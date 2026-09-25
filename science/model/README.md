# Yield model artifact

Place the trained Random Forest artifact at:

```text
science/model/rf_yield_model.joblib
```

The service expects a scikit-learn compatible object exposing `predict()` and these feature columns, in this exact order:

```text
soil_pH
nitrogen_ppm
seasonal_rainfall_mm
avg_temp_c
ndvi_peak
```

Do not commit private or untrusted pickle/joblib files. Only load artifacts produced by a trusted training pipeline with the same scikit-learn version as `services/yield-model/requirements.txt`.
