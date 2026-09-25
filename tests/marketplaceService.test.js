const test = require('node:test')
const assert = require('node:assert/strict')

const {
  getLiveAvailability,
  findMatchingFarmers,
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

test('driver assignment calculates payout from distance and payload weight', () => {
  const assignment = calculateDriverAssignment({ distanceKm: 32, loadTons: 2.4, baseRatePerKm: 18 })

  assert.equal(assignment.status, 'assigned')
  assert.ok(assignment.payoutInr > 0)
  assert.ok(assignment.etaMinutes > 0)
})
