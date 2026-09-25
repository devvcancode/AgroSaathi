import { clamp, numberOrNull } from '../../../shared/advisory.js'

const BASELINES = {
  Rice: { yieldTonsPerAcre: 2.2, pricePerQuintal: 2300, costPerAcre: 28000 },
  Wheat: { yieldTonsPerAcre: 1.8, pricePerQuintal: 2585, costPerAcre: 23000 },
  Cotton: { yieldTonsPerAcre: 0.9, pricePerQuintal: 7710, costPerAcre: 36000 },
  Soybean: { yieldTonsPerAcre: 0.8, pricePerQuintal: 5328, costPerAcre: 24000 },
}

function baselineFor(crop) { return BASELINES[crop] || BASELINES.Rice }

export function predictYield(input = {}) {
  const crop = typeof input.crop === 'string' && BASELINES[input.crop] ? input.crop : 'Rice'
  const base = baselineFor(crop)
  const soilPh = numberOrNull(input.soilPh)
  const nitrogen = numberOrNull(input.nitrogenKgPerHa)
  const rainfall = numberOrNull(input.rainfallMm)
  const area = Math.max(0.1, numberOrNull(input.areaInAcres) || 1)
  const completeness = [soilPh, nitrogen, rainfall].filter((value) => value != null).length / 3
  const soilAdjustment = soilPh == null ? 0 : clamp(1 - Math.abs(soilPh - 6.5) * 0.035, 0.88, 1.04) - 1
  const nitrogenAdjustment = nitrogen == null ? 0 : clamp(1 + (nitrogen - 100) / 1800, 0.9, 1.08) - 1
  const rainAdjustment = rainfall == null ? 0 : clamp(1 - Math.abs(rainfall - 650) / 7000, 0.9, 1.03) - 1
  const expected = base.yieldTonsPerAcre * (1 + soilAdjustment + nitrogenAdjustment + rainAdjustment)
  const treatmentUplift = input.biologicalTreatmentApplied === true ? 0.07 : 0.06
  const uncertainty = clamp(0.24 - completeness * 0.06 + (input.observedYield == null ? 0.03 : 0), 0.11, 0.3)
  const lower = expected * (1 - uncertainty)
  const upper = expected * (1 + uncertainty)
  const confidence = clamp(0.48 + completeness * 0.14 + (input.observedYield == null ? 0 : 0.12), 0.35, 0.88)
  const riskLevel = uncertainty >= 0.22 ? 'High' : uncertainty >= 0.16 ? 'Medium' : 'Low'

  return {
    model: 'observational-baseline-v1',
    modelStatus: 'baseline placeholder; train and calibrate with local historical observations before production use',
    crop,
    areaInAcres: area,
    expectedYieldTonsPerAcre: Number(expected.toFixed(2)),
    predictedYieldRangeTonsPerAcre: { lower: Number(lower.toFixed(2)), upper: Number(upper.toFixed(2)) },
    expectedYieldTons: Number((expected * area).toFixed(2)),
    estimatedTreatmentAdvantagePercent: Number((treatmentUplift * 100).toFixed(1)),
    treatmentScenarioYieldTonsPerAcre: Number((expected * (1 + treatmentUplift)).toFixed(2)),
    confidenceScore: Number(confidence.toFixed(2)),
    uncertainty: Number(uncertainty.toFixed(2)),
    riskLevel,
    disclaimer: 'Model-based observational comparison, not causal attribution or proof that treatment caused a yield change.',
    assumptions: ['Historical-like crop baseline is used.', 'Treatment advantage is an estimated scenario uplift, not a causal effect.', 'Weather, soil, management, and market inputs may be incomplete.'],
    baseline: base,
  }
}

export function backtestMetrics(observed = [], predicted = []) {
  const pairs = observed.map((value, index) => [Number(value), Number(predicted[index])]).filter(([actual, estimate]) => Number.isFinite(actual) && Number.isFinite(estimate))
  if (!pairs.length) return { sampleSize: 0, mae: null, rmse: null, calibrationError: null }
  const errors = pairs.map(([actual, estimate]) => actual - estimate)
  const mae = errors.reduce((sum, value) => sum + Math.abs(value), 0) / pairs.length
  const rmse = Math.sqrt(errors.reduce((sum, value) => sum + value ** 2, 0) / pairs.length)
  const calibrationError = Math.abs(errors.reduce((sum, value) => sum + value, 0) / pairs.length)
  return { sampleSize: pairs.length, mae: Number(mae.toFixed(3)), rmse: Number(rmse.toFixed(3)), calibrationError: Number(calibrationError.toFixed(3)) }
}
