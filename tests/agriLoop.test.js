const test = require('node:test')
const assert = require('node:assert/strict')

const {
  calculateIncentivePlan,
  buildCropCalendar,
  calculateYieldProjection,
} = require('../science/src/agriLoop')

test('calculateIncentivePlan applies repeat buyer, buyback and order incentives correctly', () => {
  const result = calculateIncentivePlan({
    orderValue: 100000,
    repeatBuyerDiscountPct: 8,
    seedSellerBuybackPct: 12,
    residualSellerIncentivePct: 7,
    logisticsIncentivePct: 5,
    buyerRepeatCount: 4,
  })

  assert.equal(result.orderValue, 100000)
  assert.equal(result.totalIncentive, 32000)
  assert.equal(result.netPayable, 68000)
  assert.equal(result.discountBreakdown.repeatBuyerDiscount, 8000)
  assert.equal(result.discountBreakdown.seedSellerBuyback, 12000)
})

test('buildCropCalendar creates a date-wise sowing and harvesting timeline', () => {
  const timeline = buildCropCalendar({
    cropType: 'Rice',
    sowingDate: '2026-06-15',
    weatherDelayDays: 6,
    harvestWindowDays: 120,
  })

  assert.equal(timeline.sowing.date, '2026-06-21')
  assert.equal(timeline.maturityWindow.start, '2026-10-19')
  assert.equal(timeline.harvest.date, '2026-10-19')
  assert.ok(Array.isArray(timeline.milestones))
})

test('calculation inputs stay bounded for invalid money and duration values', () => {
  const incentive = calculateIncentivePlan({ orderValue: -1000, repeatBuyerDiscountPct: -20, buyerRepeatCount: -1 })
  const timeline = buildCropCalendar({ sowingDate: '2026-06-15', weatherDelayDays: -4, harvestWindowDays: -10 })

  assert.equal(incentive.orderValue, 0)
  assert.equal(incentive.totalIncentive, 0)
  assert.equal(incentive.netPayable, 0)
  assert.equal(timeline.sowing.date, '2026-06-15')
  assert.equal(timeline.harvest.date, '2026-06-16')
})

test('calculateYieldProjection scales expected yield against weather delay and stress', () => {
  const result = calculateYieldProjection({
    areaInAcres: 5,
    expectedYieldTonsPerAcre: 2.4,
    weatherDelayDays: 8,
    stressIndex: 0.18,
    yieldLossPct: 6,
  })

  assert.ok(result.netYieldTons > 0)
  assert.ok(result.yieldPercent >= 80 && result.yieldPercent <= 100)
  assert.equal(result.totalYieldTons, 11.9)
})

test('yield projection never creates negative output from invalid field inputs', () => {
  const result = calculateYieldProjection({ areaInAcres: -5, expectedYieldTonsPerAcre: -2, weatherDelayDays: -10, stressIndex: -1, yieldLossPct: -20 })

  assert.equal(result.baseYieldTons, 0)
  assert.equal(result.totalYieldTons, 0)
  assert.equal(result.yieldPercent, 100)
})
