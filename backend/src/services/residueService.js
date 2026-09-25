import { buildResiduePlanPrompt, parseResiduePlan } from '@/backend/ai/residue'

function cleanOperation(row) {
  if (!row) return null
  const { _id, ...operation } = row
  return operation
}

function fallbackPlan({ farm, profile, residue, buyerNeeds = [], listings = [], bookings = [] }) {
  const quantityQuintals = Number(profile?.quantityQuintals || Math.max(0, Number(residue?.residueTons || 0) * 10))
  const readyDate = profile?.pickupReadyDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
  const matchingNeed = buyerNeeds.find((need) => !need.region || need.region === farm?.state || need.region === farm?.district)
  const matchingListing = listings.find((listing) => listing.status === 'active')
  return {
    summary: matchingNeed ? `Prepare ${quantityQuintals} quintals of ${profile?.residueType || 'crop residue'} for buyer demand in ${matchingNeed.region || 'your region'}.` : `Prepare ${quantityQuintals} quintals of ${profile?.residueType || 'crop residue'} for verified buyer matching.`,
    residueType: profile?.residueType || `${farm?.cropType || 'crop'} residue`,
    quantityQuintals,
    qualityGrade: profile?.qualityGrade || 'Standard',
    pickupReadyDate: readyDate,
    dispatchWindow: bookings[0]?.date || readyDate,
    buyerSignal: matchingNeed ? 'Buyer need available' : matchingListing ? 'Buyer marketplace active' : 'Awaiting buyer demand',
    nextActions: [
      'Confirm residue quantity and moisture after harvest.',
      'Keep residue dry, separated, and accessible for loading.',
      matchingNeed ? 'Contact the matching buyer before confirming dispatch.' : 'Publish or wait for a verified buyer requirement.',
    ],
    safetyNote: 'Do not burn residue. Confirm price, pickup time, quality, and payment terms before loading.',
    source: 'local_residue_fallback',
  }
}

export async function buildResidueOperations({ db, farmId }) {
  const farm = farmId ? await db.collection('farms').findOne({ id: farmId }) : null
  if (farmId && !farm) return { error: 'Farm not found', status: 404 }
  const profile = farmId ? await db.collection('residue_profiles').findOne({ farmId }) : null
  const buyerNeeds = await db.collection('buyer_needs').find({ status: 'open' }).sort({ createdAt: -1 }).limit(20).toArray()
  const listings = await db.collection('marketplace_listings').find({ status: 'active', category: 'Residue' }).sort({ createdAt: -1 }).limit(20).toArray()
  const orders = farmId ? await db.collection('marketplace_orders').find({ farmId }).sort({ createdAt: -1 }).limit(20).toArray() : []
  const bookings = farmId ? await db.collection('bookings').find({ farmId }).sort({ createdAt: -1 }).limit(20).toArray() : []
  const residue = farm ? { residueTons: Number(farm.areaInAcres || 0) * 1.7, cropType: farm.cropType, district: farm.district } : null
  const latest = farmId ? await db.collection('residue_operations').find({ farmId }).sort({ createdAt: -1 }).limit(1).toArray() : []
  const operation = latest[0] ? cleanOperation(latest[0]) : null
  return { farm, profile, residue, operation, buyerNeeds, listings, orders, bookings }
}

export async function generateResiduePlan({ db, input }) {
  const data = await buildResidueOperations({ db, farmId: input.farmId })
  if (data.error) return data
  const fallback = fallbackPlan(data)
  let plan = fallback
  if (process.env.GEMINI_API_KEY) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || 'gemini-2.5-flash'}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: 'You are AgroVani residue logistics planner. Never invent a buyer, quantity, price, date, or chemical advice. Return concise JSON only.' }] },
          contents: [{ role: 'user', parts: [{ text: buildResiduePlanPrompt({ ...data, requestedDate: input.requestedDate, notes: input.notes }) }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 500, responseMimeType: 'application/json' },
        }),
        signal: AbortSignal.timeout(8000),
      })
      if (response.ok) plan = { ...fallback, ...parseResiduePlan(await response.json()), source: 'gemini' }
    } catch (error) {
      console.warn('Residue Gemini planning unavailable:', error.message)
    }
  }
  const operation = { id: crypto.randomUUID(), farmId: input.farmId, ...plan, status: 'planned', createdAt: new Date(), updatedAt: new Date() }
  await db.collection('residue_operations').insertOne(operation)
  return cleanOperation(operation)
}
