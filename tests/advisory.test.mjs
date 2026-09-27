import test from 'node:test'
import assert from 'node:assert/strict'
import { predictYield, backtestMetrics } from '../backend/src/services/yieldModel.js'
import { compareMsp, lookupMandiPrices } from '../backend/src/services/mandiService.js'
import { buildFarmReportPdf, createWhatsAppText } from '../backend/src/services/reportService.js'
import { fetchIndiaWeather } from '../backend/src/adapters/cloudNextWeather.js'

test('yield prediction returns range, confidence, risk and non-causal disclaimer', () => {
  const result = predictYield({ crop: 'Rice', areaInAcres: 5, soilPh: 6.4, nitrogenKgPerHa: 95, rainfallMm: 640 })
  assert.ok(result.predictedYieldRangeTonsPerAcre.lower < result.expectedYieldTonsPerAcre)
  assert.ok(result.predictedYieldRangeTonsPerAcre.upper > result.expectedYieldTonsPerAcre)
  assert.match(result.disclaimer, /not causal/i)
  assert.ok(['Low', 'Medium', 'High'].includes(result.riskLevel))
})

test('backtest metrics include MAE, RMSE and calibration error', () => {
  const metrics = backtestMetrics([2, 3], [1.5, 2.5])
  assert.equal(metrics.sampleSize, 2)
  assert.equal(metrics.mae, 0.5)
  assert.equal(metrics.rmse, 0.5)
  assert.equal(metrics.calibrationError, 0.5)
})

test('mandi lookup and MSP comparison return source and soft signal', () => {
  const prices = lookupMandiPrices({ commodity: 'Rice', state: 'Punjab' })
  assert.ok(prices.latestModalPrice > 0)
  assert.equal(prices.source.official, false)
  const comparison = compareMsp({ commodity: 'Rice', modalPrice: prices.latestModalPrice })
  assert.match(comparison.signal, /sell|hold|data/)
  assert.match(comparison.disclaimer, /not financial advice/i)
})

test('missing market data is explicit and report outputs are shareable', () => {
  assert.equal(lookupMandiPrices({ commodity: 'Unknown crop' }).message, 'insufficient data')
  const text = createWhatsAppText({ crop: 'Rice', yieldRange: '2-2.5 t/acre' })
  assert.match(text, /AgroVani farm summary/)
  const pdf = buildFarmReportPdf({ crop: 'Rice', yieldRange: '2-2.5 t/acre', assumptions: ['Demo'] })
  assert.equal(new TextDecoder().decode(pdf).slice(0, 8), '%PDF-1.4')
})

test('weather map does not return fabricated observations without a provider', async () => {
  const savedUrl = process.env.CLOUD_NEXT_WEATHER_API_URL
  const savedKey = process.env.CLOUD_NEXT_WEATHER_API_KEY
  delete process.env.CLOUD_NEXT_WEATHER_API_URL
  delete process.env.CLOUD_NEXT_WEATHER_API_KEY
  try {
    const result = await fetchIndiaWeather()
    assert.equal(result.sourceStatus, 'unavailable')
    assert.ok(result.points.every((point) => point.temperatureC === null && point.source === 'not-configured'))
  } finally {
    if (savedUrl === undefined) delete process.env.CLOUD_NEXT_WEATHER_API_URL
    else process.env.CLOUD_NEXT_WEATHER_API_URL = savedUrl
    if (savedKey === undefined) delete process.env.CLOUD_NEXT_WEATHER_API_KEY
    else process.env.CLOUD_NEXT_WEATHER_API_KEY = savedKey
  }
})
