import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MODULE_PATH = ROOT / 'services' / 'yield-model' / 'app.py'

spec = importlib.util.spec_from_file_location('agrovani_yield_model', MODULE_PATH)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def test_validate_features_accepts_valid_payload():
    payload = {
        'soil_pH': 6.5,
        'nitrogen_ppm': 120,
        'seasonal_rainfall_mm': 800,
        'avg_temp_c': 25,
        'ndvi_peak': 0.72,
    }

    assert module.validate_features(payload) == payload


def test_fallback_yield_percent_is_bounded():
    payload = {
        'soil_pH': 6.5,
        'nitrogen_ppm': 120,
        'seasonal_rainfall_mm': 800,
        'avg_temp_c': 25,
        'ndvi_peak': 0.72,
    }

    value = module.fallback_yield_percent(payload)
    assert 0 <= value <= 100
