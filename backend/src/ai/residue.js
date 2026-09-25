function extractJson(text) {
  const raw = String(text || '').trim().replace(/^```json\s*/i, '').replace(/```$/i, '')
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  return JSON.parse(start >= 0 ? raw.slice(start, end + 1) : raw)
}

export function buildResiduePlanPrompt({ farm, profile, residue, buyerNeeds, listings, orders, bookings, requestedDate, notes }) {
  return JSON.stringify({
    task: 'Create a residue collection and dispatch plan for this farmer.',
    farm: farm ? { name: farm.name, cropType: farm.cropType, district: farm.district, state: farm.state, areaInAcres: farm.areaInAcres } : null,
    residueProfile: profile,
    residueEstimate: residue,
    openBuyerNeeds: buyerNeeds?.slice(0, 10),
    activeResidueOffers: listings?.slice(0, 10),
    recentOrders: orders?.slice(0, 5),
    recentBookings: bookings?.slice(0, 5),
    requestedDate: requestedDate || null,
    farmerNotes: notes || '',
    output: { summary: 'string', residueType: 'string', quantityQuintals: 'number', qualityGrade: 'string', pickupReadyDate: 'YYYY-MM-DD', dispatchWindow: 'string', buyerSignal: 'string', nextActions: ['string'], safetyNote: 'string' },
  })
}

export function parseResiduePlan(data) {
  const text = data?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || ''
  try {
    const parsed = extractJson(text)
    return {
      summary: String(parsed.summary || ''), residueType: String(parsed.residueType || ''), quantityQuintals: Number(parsed.quantityQuintals) || 0,
      qualityGrade: String(parsed.qualityGrade || 'Standard'), pickupReadyDate: String(parsed.pickupReadyDate || ''), dispatchWindow: String(parsed.dispatchWindow || ''),
      buyerSignal: String(parsed.buyerSignal || 'Awaiting buyer demand'), nextActions: Array.isArray(parsed.nextActions) ? parsed.nextActions.map(String).slice(0, 5) : [], safetyNote: String(parsed.safetyNote || ''),
    }
  } catch { return {} }
}
