import { z } from 'zod'

const finiteNumber = z.coerce.number().finite()
const isoDate = z.string().date().nullable().optional()

export const farmCreateSchema = z.object({
  ownerId: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional(),
  name: z.string().trim().min(1).optional(),
  village: z.string().trim().optional(),
  district: z.string().trim().min(1).optional(),
  state: z.string().trim().optional(),
  cropType: z.string().trim().min(1).optional(),
  areaInAcres: finiteNumber.positive().optional(),
  latitude: finiteNumber.min(-90).max(90).optional(),
  longitude: finiteNumber.min(-180).max(180).optional(),
  soilPh: finiteNumber.min(0).max(14).nullable().optional(),
  nitrogenKgPerHa: finiteNumber.nonnegative().nullable().optional(),
  locale: z.string().trim().min(2).optional(),
  sowingDate: isoDate,
  harvestWindowDays: finiteNumber.int().positive().max(500).optional(),
  estimatedYieldTons: finiteNumber.positive().nullable().optional(),
  actualYieldTons: finiteNumber.positive().nullable().optional(),
  saleWindowStartDate: isoDate,
  saleWindowEndDate: isoDate,
  shelfLifeDays: finiteNumber.int().positive().max(3650).optional(),
})

export const farmCropCycleSchema = z.object({
  id: z.string().trim().min(1),
  cropType: z.string().trim().min(1).optional(),
  sowingDate: isoDate,
  harvestWindowDays: finiteNumber.int().positive().max(500).optional(),
  estimatedYieldTons: finiteNumber.positive().nullable().optional(),
  actualYieldTons: finiteNumber.positive().nullable().optional(),
  saleWindowStartDate: isoDate,
  saleWindowEndDate: isoDate,
  shelfLifeDays: finiteNumber.int().positive().max(3650).optional(),
}).refine((cycle) => (
  !cycle.saleWindowStartDate || !cycle.saleWindowEndDate || cycle.saleWindowStartDate <= cycle.saleWindowEndDate
), { message: 'saleWindowEndDate must be on or after saleWindowStartDate', path: ['saleWindowEndDate'] })

export const listingCreateSchema = z.object({
  sellerId: z.string().trim().min(1),
  name: z.string().trim().min(1),
  category: z.string().trim().min(1).optional(),
  sellerName: z.string().trim().min(1).optional(),
  sellerState: z.string().trim().min(1).optional(),
  sellerPlace: z.string().trim().min(1).optional(),
  expectedDeliveryDays: finiteNumber.int().positive().max(365).optional(),
  listingType: z.enum(['input', 'residue_need']).optional(),
  residueType: z.string().trim().nullable().optional(),
  qualityGrade: z.string().trim().nullable().optional(),
  moisturePercent: finiteNumber.min(0).max(100).nullable().optional(),
  quantityQuintals: finiteNumber.positive().nullable().optional(),
  pickupDistrict: z.string().trim().optional(),
  notes: z.string().trim().max(2000).optional(),
  priceInr: finiteNumber.positive(),
  stockUnits: finiteNumber.int().nonnegative().optional(),
})

export const orderCreateSchema = z.object({
  listingId: z.string().trim().min(1),
  sellerId: z.string().trim().min(1),
  buyerId: z.string().trim().min(1).nullable().optional(),
  farmId: z.string().trim().min(1).nullable().optional(),
  sellerName: z.string().trim().optional(),
  sellerState: z.string().trim().optional(),
  sellerPlace: z.string().trim().optional(),
  expectedDeliveryDays: finiteNumber.int().positive().max(365).optional(),
  quantity: finiteNumber.int().positive(),
  totalInr: finiteNumber.positive().optional(),
})

export const residuePlanSchema = z.object({
  farmId: z.string().trim().min(1),
  requestedDate: z.string().trim().optional(),
  notes: z.string().trim().max(2000).optional(),
})

export function validationError(result) {
  return result.error.issues.map((issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`).join('; ')
}
