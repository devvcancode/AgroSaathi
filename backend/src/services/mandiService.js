import { MANDI_PRICES, MANDI_SOURCE, MSP_DATA } from '../../data/mandiDemo'
import { ageHours, freshness, numberOrNull } from '../../../shared/advisory.js'

function latest(rows) {
  return [...rows].sort((a, b) => new Date(b.observedAt) - new Date(a.observedAt))[0] || null
}

export function lookupMandiPrices({ commodity, state, market } = {}) {
  const query = String(commodity || '').trim().toLowerCase()
  const rows = MANDI_PRICES.filter((row) => (!query || row.commodity.toLowerCase().includes(query)) && (!state || row.state === state) && (!market || row.market === market))
  const latestRow = latest(rows)
  const trendRows = rows.filter((row) => ageHours(row.observedAt) <= 7 * 24)
  return {
    source: MANDI_SOURCE,
    dataFreshness: latestRow ? freshness(latestRow.observedAt) : { stale: true, label: 'No data' },
    latestModalPrice: latestRow?.modalPrice ?? null,
    latest: latestRow,
    trend7Day: trendRows.map((row) => ({ date: row.observedAt.slice(0, 10), market: row.market, modalPrice: row.modalPrice })),
    rows,
    message: rows.length ? null : 'insufficient data',
  }
}

export function compareMsp({ commodity, modalPrice } = {}) {
  const record = MSP_DATA[commodity]
  const price = numberOrNull(modalPrice)
  if (!record || price == null) return { commodity, msp: record || null, modalPrice: null, message: 'insufficient data' }
  const premiumDiscountPercent = ((price - record.value) / record.value) * 100
  const confidence = premiumDiscountPercent > 4 || premiumDiscountPercent < -4 ? 0.68 : 0.45
  return {
    commodity, msp: record.value, mspUnit: record.unit, season: record.season, modalPrice: price,
    premiumDiscountPercent: Number(premiumDiscountPercent.toFixed(1)),
    signal: premiumDiscountPercent >= 3 ? 'soft sell' : premiumDiscountPercent <= -3 ? 'soft hold' : 'wait for more data',
    confidenceScore: confidence,
    disclaimer: 'Soft informational signal only. This is not financial advice and does not account for quality, transport, storage, or local bargaining.',
  }
}
