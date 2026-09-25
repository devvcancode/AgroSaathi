export function numberOrNull(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

export function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value))
}

export function formatInr(value) {
  if (value == null || !Number.isFinite(Number(value))) return 'insufficient data'
  return `₹${Math.round(Number(value)).toLocaleString('en-IN')}`
}

export function ageHours(value) {
  const timestamp = new Date(value).getTime()
  return Number.isFinite(timestamp) ? Math.max(0, (Date.now() - timestamp) / 3600000) : Infinity
}

export function freshness(value, maxHours = 48) {
  const hours = ageHours(value)
  return {
    hours: Number.isFinite(hours) ? Math.round(hours * 10) / 10 : null,
    stale: !Number.isFinite(hours) || hours > maxHours,
    label: !Number.isFinite(hours) ? 'Unknown freshness' : hours > maxHours ? 'Stale data' : `Updated ${Math.round(hours)}h ago`,
  }
}

export function requiredString(value, field) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${field} is required`)
  return value.trim()
}
