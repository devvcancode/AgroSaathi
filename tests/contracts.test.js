import test from 'node:test'
import assert from 'node:assert/strict'
import { farmCreateSchema, listingCreateSchema, orderCreateSchema, residuePlanSchema } from '../contracts/src/api.js'

test('farm contract rejects invalid coordinates and area', () => {
  const result = farmCreateSchema.safeParse({ areaInAcres: 0, latitude: 100, longitude: 76 })
  assert.equal(result.success, false)
})

test('listing contract rejects non-finite and non-positive prices', () => {
  assert.equal(listingCreateSchema.safeParse({ sellerId: 'seller', name: 'Seed', priceInr: 'NaN' }).success, false)
  assert.equal(listingCreateSchema.safeParse({ sellerId: 'seller', name: 'Seed', priceInr: 0 }).success, false)
})

test('order contract requires a positive integer quantity', () => {
  const valid = orderCreateSchema.safeParse({ listingId: 'listing', sellerId: 'seller', quantity: 2 })
  const invalid = orderCreateSchema.safeParse({ listingId: 'listing', sellerId: 'seller', quantity: 1.5 })
  assert.equal(valid.success, true)
  assert.equal(invalid.success, false)
})

test('residue plan contract requires a farm and bounds notes', () => {
  assert.equal(residuePlanSchema.safeParse({ farmId: 'farm-1', notes: 'Keep dry' }).success, true)
  assert.equal(residuePlanSchema.safeParse({ farmId: '', notes: 'x'.repeat(2001) }).success, false)
})
