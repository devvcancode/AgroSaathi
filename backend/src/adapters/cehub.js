// Syngenta CE Hub API adapter + geocoding.

const CEHUB_BASE = 'https://services.cehub.syngenta-ais.com';
const CEHUB_APIKEY = process.env.CEHUB_APIKEY || 'b5428df1-abb7-4f52-8a13-ddaed67dcb98';

function headers() {
  return { ApiKey: CEHUB_APIKEY, Accept: 'application/json' };
}

function ymd(d) {
  return d.toISOString().slice(0, 10);
}

async function fetchOpenMeteoSprayWindow(latitude, longitude) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    hourly: 'temperature_2m,precipitation_probability,wind_speed_10m,relative_humidity_2m',
    forecast_days: '5',
    timezone: 'auto',
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Open-Meteo returned HTTP ${response.status}`);
  const data = await response.json();
  const hours = data.hourly || {};
  const windows = [];
  for (let index = 0; index < (hours.time || []).length; index += 1) {
    const temperature = Number(hours.temperature_2m?.[index]);
    const rainChance = Number(hours.precipitation_probability?.[index]);
    const wind = Number(hours.wind_speed_10m?.[index]);
    const humidity = Number(hours.relative_humidity_2m?.[index]);
    const hour = new Date(hours.time[index]).getHours();
    if (hour < 6 || hour > 18 || rainChance > 20 || wind > 15 || temperature < 10 || temperature > 32) continue;
    windows.push({
      startTime: hours.time[index],
      endTime: hours.time[index + 1] || hours.time[index],
      temperatureC: temperature,
      rainChancePercent: rainChance,
      windKph: wind,
      humidityPercent: humidity,
      source: 'Open-Meteo forecast',
    });
    if (windows.length === 4) break;
  }
  return windows;
}

// Optimal spray window for biostimulant foliar application.
export async function fetchSprayWindow(latitude, longitude, sprayingType = 'Foliar') {
  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + 5);
  const url = `${CEHUB_BASE}/api/AgronomicsDecisionRecommendation/SprayWindowRecommendation?latitude=${latitude}&longitude=${longitude}&sprayingType=${encodeURIComponent(
    sprayingType
  )}&startDate=${ymd(start)}&endDate=${ymd(end)}`;
  try {
    const res = await fetch(url, { headers: headers(), cache: 'no-store' });
    if (!res.ok) return { ok: false, windows: [], status: res.status, error: `CE Hub returned HTTP ${res.status}` };
    const data = await res.json();
    const windows = Array.isArray(data)
      ? data
      : Array.isArray(data?.windows)
        ? data.windows
        : Array.isArray(data?.recommendations)
          ? data.recommendations
          : [];
    if (windows.length) return { ok: true, windows, status: res.status, source: 'Syngenta CE Hub' };
    try {
      const forecastWindows = await fetchOpenMeteoSprayWindow(latitude, longitude);
      return { ok: forecastWindows.length > 0, windows: forecastWindows, status: res.status, source: 'Open-Meteo forecast', fallback: true };
    } catch (fallbackError) {
      return { ok: false, windows: [], status: res.status, source: 'Syngenta CE Hub', error: fallbackError.message };
    }
  } catch (e) {
    return { ok: false, windows: [], status: null, error: String(e) };
  }
}

export async function fetchHydricStress(latitude, longitude, crop = 'Rice') {
  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + 7);
  const url = `${CEHUB_BASE}/api/AgronomicsDecisionRecommendation/HydricStressRecommendation?latitude=${latitude}&longitude=${longitude}&crop=${encodeURIComponent(
    crop
  )}&startDate=${ymd(start)}&endDate=${ymd(end)}&waterAvailabilty=Medium`;
  try {
    const res = await fetch(url, { headers: headers(), cache: 'no-store' });
    if (!res.ok) return { ok: false, data: null };
    const data = await res.json();
    return { ok: true, data };
  } catch (e) {
    return { ok: false, data: null, error: String(e) };
  }
}

// Geocode via OpenStreetMap Nominatim (free, no key) as CE Hub LocationSearch
// path is not publicly resolvable. Restricted to India.
export async function geocodeLocation(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&limit=5&q=${encodeURIComponent(
    query
  )}`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'AgroVani-Annam/1.0 (agri-demo)' },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data || []).map((d) => ({
      name: d.display_name,
      latitude: parseFloat(d.lat),
      longitude: parseFloat(d.lon),
      type: d.type,
    }));
  } catch (e) {
    return [];
  }
}
