const DEFAULT_VERSION = 'v3'

export const INDIA_WEATHER_LOCATIONS = [
  { name: 'Delhi', state: 'Delhi', latitude: 28.6139, longitude: 77.2090 },
  { name: 'Chandigarh', state: 'Chandigarh', latitude: 30.7333, longitude: 76.7794 },
  { name: 'Jaipur', state: 'Rajasthan', latitude: 26.9124, longitude: 75.7873 },
  { name: 'Lucknow', state: 'Uttar Pradesh', latitude: 26.8467, longitude: 80.9462 },
  { name: 'Guwahati', state: 'Assam', latitude: 26.1445, longitude: 91.7362 },
  { name: 'Kolkata', state: 'West Bengal', latitude: 22.5726, longitude: 88.3639 },
  { name: 'Mumbai', state: 'Maharashtra', latitude: 19.0760, longitude: 72.8777 },
  { name: 'Bengaluru', state: 'Karnataka', latitude: 12.9716, longitude: 77.5946 },
  { name: 'Chennai', state: 'Tamil Nadu', latitude: 13.0827, longitude: 80.2707 },
  { name: 'Hyderabad', state: 'Telangana', latitude: 17.3850, longitude: 78.4867 },
  { name: 'Kochi', state: 'Kerala', latitude: 9.9312, longitude: 76.2673 },
]

function firstNumber(...values) {
  const value = values.find((candidate) => candidate !== undefined && candidate !== null && Number.isFinite(Number(candidate)))
  return value == null ? null : Number(value)
}

function fallbackWeather(location, index) {
  const temperatureC = Math.round(22 + ((index * 3.7) % 14))
  return {
    ...location,
    temperatureC,
    humidityPct: 48 + ((index * 7) % 35),
    windKph: 8 + ((index * 2) % 14),
    precipitationMm: index % 3 === 0 ? 2.4 : 0,
    condition: index % 3 === 0 ? 'Light rain possible' : 'Partly cloudy',
    source: 'demo-fallback',
  }
}

function normalizeWeather(location, payload) {
  const current = payload?.current || payload?.data?.current || payload?.data || payload
  return {
    ...location,
    temperatureC: firstNumber(current?.temperatureC, current?.temperature, current?.temp_c, current?.temp, payload?.temperatureC),
    humidityPct: firstNumber(current?.humidityPct, current?.humidity, current?.humidity_percent),
    windKph: firstNumber(current?.windKph, current?.wind_speed, current?.windSpeed, current?.wind_speed_kph),
    precipitationMm: firstNumber(current?.precipitationMm, current?.precipitation, current?.precip_mm, current?.rain),
    condition: current?.condition?.text || current?.condition || current?.summary || payload?.condition || 'Live conditions',
    source: 'cloud-next-weather-v3',
  }
}

export async function fetchCloudNextWeather(location, index = 0) {
  const baseUrl = process.env.CLOUD_NEXT_WEATHER_API_URL
  const apiKey = process.env.CLOUD_NEXT_WEATHER_API_KEY
  const version = process.env.CLOUD_NEXT_WEATHER_API_VERSION || DEFAULT_VERSION
  if (!baseUrl || !apiKey) return fallbackWeather(location, index)

  try {
    const endpoint = new URL(baseUrl)
    endpoint.searchParams.set('latitude', String(location.latitude))
    endpoint.searchParams.set('longitude', String(location.longitude))
    endpoint.searchParams.set('lat', String(location.latitude))
    endpoint.searchParams.set('lon', String(location.longitude))
    endpoint.searchParams.set('version', version)
    endpoint.searchParams.set('apiKey', apiKey)

    const response = await fetch(endpoint, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${apiKey}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    })
    if (!response.ok) throw new Error(`Cloud Next Weather returned ${response.status}`)
    return normalizeWeather(location, await response.json())
  } catch (error) {
    console.warn(`Weather API unavailable for ${location.name}:`, error.message)
    return fallbackWeather(location, index)
  }
}

export async function fetchIndiaWeather() {
  const points = await Promise.all(INDIA_WEATHER_LOCATIONS.map((location, index) => fetchCloudNextWeather(location, index)))
  return {
    country: 'India',
    bounds: { north: 37.1, south: 6.5, east: 97.5, west: 68.1 },
    provider: process.env.CLOUD_NEXT_WEATHER_API_URL ? 'Cloud Next Weather' : 'Demo fallback',
    version: process.env.CLOUD_NEXT_WEATHER_API_VERSION || DEFAULT_VERSION,
    points,
  }
}