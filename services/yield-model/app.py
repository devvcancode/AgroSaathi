from __future__ import annotations

import os
from pathlib import Path
from typing import Any

import numpy as np
from flask import Flask, jsonify, render_template, request

try:
    import joblib
except ImportError:  # pragma: no cover - handled by the Codespaces requirements
    joblib = None

PROJECT_ROOT = Path(__file__).resolve().parents[2]
MODEL_PATH = Path(os.getenv('YIELD_MODEL_PATH', PROJECT_ROOT / 'science' / 'model' / 'rf_yield_model.joblib'))
FEATURES = ['soil_pH', 'nitrogen_ppm', 'seasonal_rainfall_mm', 'avg_temp_c', 'ndvi_peak']

app = Flask(__name__)
model = None
model_load_error = None


def load_model() -> None:
    global model, model_load_error
    if not MODEL_PATH.exists():
        model_load_error = f'Model artifact not found at {MODEL_PATH}. Add the trained Random Forest file to enable model predictions.'
        return
    if joblib is None:
        model_load_error = 'joblib is not installed. Run pip install -r services/yield-model/requirements.txt.'
        return
    try:
        model = joblib.load(MODEL_PATH)
        if not hasattr(model, 'predict'):
            raise TypeError('Loaded artifact does not expose a predict method.')
    except Exception as exc:  # pragma: no cover - depends on an external artifact
        model = None
        model_load_error = f'Unable to load model artifact: {exc}'


load_model()


def number(payload: dict[str, Any], key: str) -> float:
    value = payload.get(key)
    if value is None or value == '':
        raise ValueError(f'{key} is required')
    parsed = float(value)
    if not np.isfinite(parsed):
        raise ValueError(f'{key} must be a finite number')
    return parsed


def validate_features(payload: dict[str, Any]) -> dict[str, float]:
    values = {feature: number(payload, feature) for feature in FEATURES}
    if not 0 <= values['soil_pH'] <= 14:
        raise ValueError('soil_pH must be between 0 and 14')
    if values['nitrogen_ppm'] < 0 or values['seasonal_rainfall_mm'] < 0 or values['ndvi_peak'] < 0:
        raise ValueError('nitrogen_ppm, seasonal_rainfall_mm, and ndvi_peak cannot be negative')
    if not 0 <= values['ndvi_peak'] <= 1:
        raise ValueError('ndvi_peak must be between 0 and 1')
    return values


def fallback_yield_percent(values: dict[str, float]) -> float:
    soil_score = max(0, 1 - abs(values['soil_pH'] - 6.5) / 6.5)
    nitrogen_score = min(1, values['nitrogen_ppm'] / 120)
    rain_score = max(0, 1 - abs(values['seasonal_rainfall_mm'] - 800) / 1200)
    temperature_score = max(0, 1 - abs(values['avg_temp_c'] - 25) / 30)
    ndvi_score = values['ndvi_peak']
    score = 0.2 * soil_score + 0.2 * nitrogen_score + 0.2 * rain_score + 0.2 * temperature_score + 0.2 * ndvi_score
    return round(max(0, min(100, score * 100)), 2)


def predict_yield(values: dict[str, float]) -> tuple[float, str]:
    if model is None:
        return fallback_yield_percent(values), 'fallback_heuristic'

    feature_vector = np.asarray([[values[feature] for feature in FEATURES]], dtype=float)
    prediction = float(np.asarray(model.predict(feature_vector)).reshape(-1)[0])
    if not np.isfinite(prediction):
        raise ValueError('The model returned a non-finite prediction.')
    return round(max(0, min(100, prediction))), 'random_forest'


@app.get('/')
def home():
    return render_template('index.html', model_loaded=model is not None, model_error=model_load_error, features=FEATURES)


@app.get('/health')
def health():
    return jsonify({'status': 'ok', 'model_loaded': model is not None, 'model_path': str(MODEL_PATH), 'model_error': model_load_error})


@app.post('/predict')
def predict():
    try:
        payload = request.get_json(silent=True) or request.form.to_dict()
        values = validate_features(payload)
        predicted_yield, source = predict_yield(values)
        result = {'success': True, 'predicted_yield_percent': predicted_yield, 'source': source, 'features': values}
        if request.is_json:
            return jsonify(result)
        return render_template('index.html', result=result, model_loaded=model is not None, model_error=model_load_error, features=FEATURES)
    except (TypeError, ValueError) as exc:
        if request.is_json:
            return jsonify({'success': False, 'error': str(exc)}), 400
        return render_template('index.html', error=str(exc), model_loaded=model is not None, model_error=model_load_error, features=FEATURES), 400
    except Exception as exc:
        app.logger.exception('Yield prediction failed')
        if request.is_json:
            return jsonify({'success': False, 'error': f'Prediction error: {exc}'}), 500
        return render_template('index.html', error=f'Prediction error: {exc}', model_loaded=model is not None, model_error=model_load_error, features=FEATURES), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', '5000')), debug=os.getenv('FLASK_DEBUG', 'false').lower() == 'true')
