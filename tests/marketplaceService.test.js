const test = require('node:test')
const assert = require('node:assert/strict')

const {
  getLiveAvailability,
  findMatchingFarmers,
  getSeedPriceSnapshot,
  calculateDriverAssignment,
} = require('../backend/src/services/marketplaceService.js')

test('live availability reports crop matching supply from the database and region filters', () => {
  const rows = [
    { id: 'f1', cropType: 'Rice', district: 'Patiala', state: 'Punjab', latitude: 30.34, longitude: 76.38 },
    { id: 'f2', cropType: 'Rice', district: 'Ludhiana', state: 'Punjab', latitude: 30.9, longitude: 75.85 },
    { id: 'f3', cropType: 'Wheat', district: 'Patiala', state: 'Punjab', latitude: 30.34, longitude: 76.38 },
  ]

  const result = getLiveAvailability({ cropType: 'Rice', region: 'Punjab', farms: rows })

  assert.equal(result.totalFarmers, 2)
  assert.equal(result.available, true)
  assert.ok(result.matchingFarms.length >= 2)
})

test('matching farmers prioritize region and crop fit with a live quote', () => {
  const farms = [
    { id: 'f1', name: 'Gurpreet Singh', cropType: 'Rice', district: 'Patiala', state: 'Punjab', areaInAcres: 8 },
    { id: 'f2', name: 'Sukhdev Singh', cropType: 'Wheat', district: 'Patiala', state: 'Punjab', areaInAcres: 9 },
  ]

  const result = findMatchingFarmers({ cropType: 'Rice', region: 'Punjab', farms, mandiPrice: 2400 })

  assert.equal(result.length, 1)
  assert.equal(result[0].matchScore > 0, true)
  assert.ok(result[0].quotePerTon > 0)
})

test('matching farmers do not receive an invented quote when mandi data is unavailable', () => {
  const result = findMatchingFarmers({
    cropType: 'Rice',
    region: 'Punjab',
    farms: [{ id: 'f1', cropType: 'Rice', district: 'Patiala', state: 'Punjab' }],
    mandiPrice: 0,
  })

  assert.equal(result[0].quotePerTon, null)
  assert.equal(result[0].lockablePrice, null)
})

test('seed price snapshot compares only active matching seed listings in the selected area', () => {
  const snapshot = getSeedPriceSnapshot({
    district: 'Patiala',
    product: 'rice',
    listings: [
      { id: 's1', name: 'Rice seed 10kg', category: 'Seeds', priceInr: 900, sellerPlace: 'Patiala', sellerState: 'Punjab', status: 'active' },
      { id: 's2', name: 'Rice seed 10kg', category: 'Seeds', priceInr: 1100, sellerPlace: 'Patiala', sellerState: 'Punjab', status: 'active' },
      { id: 's3', name: 'Rice seed 10kg', category: 'Seeds', priceInr: 700, sellerPlace: 'Ludhiana', sellerState: 'Punjab', status: 'active' },
      { id: 's4', name: 'Wheat seed', category: 'Seeds', priceInr: 500, sellerPlace: 'Patiala', sellerState: 'Punjab', status: 'active' },
    ],
  })

  assert.equal(snapshot.sampleCount, 2)
  assert.equal(snapshot.lowInr, 900)
  assert.equal(snapshot.medianInr, 1000)
  assert.equal(snapshot.highInr, 1100)
})

test('driver assignment calculates payout from distance and payload weight', () => {
  const assignment = calculateDriverAssignment({ distanceKm: 32, loadTons: 2.4, baseRatePerKm: 18 })

  assert.equal(assignment.status, 'assigned')
  assert.ok(assignment.payoutInr > 0)
  assert.ok(assignment.etaMinutes > 0)
})
