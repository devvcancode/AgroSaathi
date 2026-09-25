import { createClient } from '@supabase/supabase-js'

const TABLE_COLUMNS = {
  farms: {
    ownerId: 'owner_id', cropType: 'crop_type', areaInAcres: 'area_in_acres', soilPh: 'soil_ph',
    nitrogenKgPerHa: 'nitrogen_kg_per_ha', createdAt: 'created_at',
  },
  machinery: {
    pricePerAcre: 'price_per_acre',
  },
  district_metrics: {
    buyerDemand: 'buyer_demand', machineryReadiness: 'machinery_readiness',
  },
  bookings: {
    farmId: 'farm_id', farmerName: 'farmer_name', machineryType: 'machinery_type',
    date: 'booking_date', createdAt: 'created_at',
  },
  stress_diagnostic_logs: {
    farmId: 'farm_id', diurnalScore: 'diurnal_score', nightScore: 'night_score',
    frostScore: 'frost_score', droughtIndex: 'drought_index',
    recommendedProduct: 'recommended_product', sprayWindowStart: 'spray_window_start',
    createdAt: 'created_at',
  },
  marketplace_listings: {
    sellerId: 'seller_id', sellerName: 'seller_name', sellerState: 'seller_state', sellerPlace: 'seller_place', expectedDeliveryDays: 'expected_delivery_days', priceInr: 'price_inr', stockUnits: 'stock_units',
    createdAt: 'created_at', updatedAt: 'updated_at',
    sellerId: 'seller_id', priceInr: 'price_inr', stockUnits: 'stock_units',
    listingType: 'listing_type', residueType: 'residue_type', qualityGrade: 'quality_grade', moisturePercent: 'moisture_percent', quantityQuintals: 'quantity_quintals', pickupDistrict: 'pickup_district', createdAt: 'created_at', updatedAt: 'updated_at',
  },
  marketplace_orders: {
    listingId: 'listing_id', farmId: 'farm_id', buyerId: 'buyer_id', sellerId: 'seller_id', sellerName: 'seller_name', sellerState: 'seller_state', sellerPlace: 'seller_place', listingName: 'listing_name', expectedDeliveryDays: 'expected_delivery_days', expectedDeliveryAt: 'expected_delivery_at',
    quantity: 'quantity', totalInr: 'total_inr', createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  buyer_needs: {
    buyerId: 'buyer_id', cropType: 'crop_type', residueType: 'residue_type', useCase: 'use_case',
    quantity: 'quantity', region: 'region', urgency: 'urgency', notes: 'notes', createdAt: 'created_at',
  },
  admin_reviews: {
    farmId: 'farm_id', reviewType: 'review_type', createdAt: 'created_at',
    reviewedAt: 'reviewed_at',
  },
  tasks: {
    ownerId: 'owner_id', dueDate: 'due_date', createdAt: 'created_at',
  },
  messages: {
    senderId: 'sender_id', recipientId: 'recipient_id', sourceLanguage: 'source_language', targetLanguage: 'target_language', translatedText: 'translated_text', createdAt: 'created_at',
  },
  earnings: {
    ownerId: 'owner_id', amountInr: 'amount_inr', createdAt: 'created_at',
  },
  dispatch: {
    driverId: 'driver_id', farmerId: 'farmer_id', buyerId: 'buyer_id', pickupLocation: 'pickup_location', dropLocation: 'drop_location', etaMinutes: 'eta_minutes', createdAt: 'created_at',
  },
  notifications: {
    listingId: 'listing_id', createdAt: 'created_at',
  },
  residue_profiles: {
    farmId: 'farm_id', residueType: 'residue_type', qualityGrade: 'quality_grade', quantityQuintals: 'quantity_quintals', moisturePercent: 'moisture_percent', pickupReadyDate: 'pickup_ready_date', updatedAt: 'updated_at',
  },
  residue_operations: {
    farmId: 'farm_id', residueType: 'residue_type', quantityQuintals: 'quantity_quintals', qualityGrade: 'quality_grade',
    pickupReadyDate: 'pickup_ready_date', dispatchWindow: 'dispatch_window', buyerSignal: 'buyer_signal', nextActions: 'next_actions',
    safetyNote: 'safety_note', createdAt: 'created_at', updatedAt: 'updated_at',
  },
}

function toDatabaseRow(table, row) {
  const columns = TABLE_COLUMNS[table] || {}
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [columns[key] || key, value instanceof Date ? value.toISOString() : value]))
}

function fromDatabaseRow(table, row) {
  const columns = TABLE_COLUMNS[table] || {}
  const reverse = Object.fromEntries(Object.entries(columns).map(([key, value]) => [value, key]))
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [reverse[key] || key, value]))
}

function throwIfError(result) {
  if (result.error) throw result.error
  return result.data
}

function createSupabaseCollection(supabase, table) {
  return {
    async countDocuments() {
      const result = await supabase.from(table).select('id', { count: 'exact', head: true })
      if (result.error) throw result.error
      return result.count || 0
    },
    async insertMany(items) {
      const result = await supabase.from(table).insert(items.map((item) => toDatabaseRow(table, item)))
      throwIfError(result)
      return { insertedCount: items.length }
    },
    async insertOne(item) {
      const result = await supabase.from(table).insert(toDatabaseRow(table, item)).select().single()
      const inserted = throwIfError(result)
      return { insertedId: inserted?.id || item.id }
    },
    async updateOne(query, update) {
      let request = supabase.from(table).update(toDatabaseRow(table, update.$set || update))
      for (const [key, value] of Object.entries(query)) {
        request = request.eq((TABLE_COLUMNS[table] || {})[key] || key, value)
      }
      const result = await request
      throwIfError(result)
      return { matchedCount: result.count || 1, modifiedCount: result.count || 1 }
    },
    find(query = {}) {
      let sortSpec = null
      let limitValue = null
      return {
        sort(spec) {
          sortSpec = spec
          return this
        },
        limit(value) {
          limitValue = value
          return this
        },
        async toArray() {
          let request = supabase.from(table).select('*')
          for (const [key, value] of Object.entries(query)) {
            if (value === undefined) continue
            const column = (TABLE_COLUMNS[table] || {})[key] || key
            if (value && typeof value === 'object' && Array.isArray(value.$in)) {
              request = request.in(column, value.$in)
            } else {
              request = request.eq(column, value)
            }
          }
          if (sortSpec) {
            for (const [key, direction] of Object.entries(sortSpec)) {
              request = request.order((TABLE_COLUMNS[table] || {})[key] || key, { ascending: direction !== -1 })
            }
          }
          if (limitValue !== null) request = request.limit(limitValue)
          const rows = throwIfError(await request)
          return (rows || []).map((row) => fromDatabaseRow(table, row))
        },
      }
    },
    async findOne(query = {}) {
      let request = supabase.from(table).select('*')
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) request = request.eq((TABLE_COLUMNS[table] || {})[key] || key, value)
      }
      const result = await request.maybeSingle()
      if (result.error) throw result.error
      return result.data ? fromDatabaseRow(table, result.data) : null
    },
  }
}

export function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

export function createSupabaseDb(supabase) {
  return {
    collection(name) {
      return createSupabaseCollection(supabase, name)
    },
  }
}