// Meteoblue Dataset API adapter
// Fetches ERA5LAND daily weather for the biostimulant stress engine.

const METEOBLUE_ENDPOINT = 'https://my.meteoblue.com/dataset/query';
const METEOBLUE_APIKEY = process.env.METEOBLUE_APIKEY;

function fmtDate(d) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}T+00:00`;
}

// Build a rolling 10-day interval ending a few days before today
// (ERA5LAND has a short reporting lag; gapFillDomain covers recent gaps).
function defaultInterval() {
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 2);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 9);
  return `${fmtDate(start)}/${fmtDate(end)}`;
}

function pick(codes, code, aggregation, level) {
  const match = codes.find(
    (c) => c.code === code && c.aggregation === aggregation && (!level || c.level === level)
  );
  if (!match) return { data: [], unit: null };
  const series = match.dataPerTimeInterval?.[0]?.data?.[0] || [];
  return { data: series, unit: match.unit };
}

function lastValid(arr) {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i] !== null && arr[i] !== undefined && !Number.isNaN(arr[i])) return arr[i];
  }
  return null;
}

function avgValid(arr) {
  const v = arr.filter((x) => x !== null && x !== undefined && !Number.isNaN(x));
  if (!v.length) return null;
  return v.reduce((a, b) => a + b, 0) / v.length;
}

export async function fetchWeather(latitude, longitude, opts = {}) {
  const lat = Number(latitude);
  const lon = Number(longitude);
  const interval = opts.timeInterval || defaultInterval();

  const payload = {
    units: { temperature: 'C', velocity: 'km/h', length: 'metric', energy: 'watts' },
    geometry: {
      type: 'MultiPoint',
      coordinates: [[lon, lat]],
      mode: 'preferLandWithMatchingElevation',
      excludeSeaPoints: true,
    },
    format: 'json',
    timeIntervals: [interval],
    timeIntervalsAlignment: 'none',
    queries: [
      {
        domain: 'ERA5LAND',
        gapFillDomain: 'NEMSGLOBAL',
        timeResolution: 'daily',
        codes: [
          { code: 11, level: '2 m above gnd', aggregation: 'max' },
          { code: 11, level: '2 m above gnd', aggregation: 'min' },
          { code: 61, level: 'sfc', aggregation: 'sum' },
          { code: 144, level: '0-7 cm down', aggregation: 'mean' },
          { code: 261, level: 'sfc', aggregation: 'sum' },
        ],
      },
    ],
  };

  let res;
  if (!METEOBLUE_APIKEY) return fallbackWeather(lat, lon, interval);
  try {
    res = await fetch(`${METEOBLUE_ENDPOINT}?apikey=${METEOBLUE_APIKEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
  } catch (error) {
    return fallbackWeather(lat, lon, interval);
  }

  const json = await res.json();
  if (!Array.isArray(json)) {
    return fallbackWeather(lat, lon, interval);
  }

  const block = json[0];
  const times = block?.timeIntervals?.[0] || [];
  const codes = block?.codes || [];

  const tmaxSeries = pick(codes, 11, 'max', '2 m above gnd').data;
  const tminSeries = pick(codes, 11, 'min', '2 m above gnd').data;
  const precipSeries = pick(codes, 61, 'sum', 'sfc').data;
  const soilSeries = pick(codes, 144, 'mean', '0-7 cm down').data; // m3/m3
  const evapSeries = pick(codes, 261, 'sum', 'sfc').data;

  const tmax = lastValid(tmaxSeries);
  const tmin = lastValid(tminSeries);
  const precip = lastValid(precipSeries);
  const soilRaw = lastValid(soilSeries); // volumetric fraction 0..1
  const soilMoisturePct = soilRaw !== null ? soilRaw * 100 : null;
  let evaporation = lastValid(evapSeries);
  // ERA5LAND evapotranspiration can be unreliable; estimate from temp when tiny.
  const tavg = tmax !== null && tmin !== null ? (tmax + tmin) / 2 : null;
  if ((evaporation === null || evaporation < 0.1) && tavg !== null) {
    evaporation = Math.max(0, 0.15 * tavg);
  }

  return {
    latitude: lat,
    longitude: lon,
    interval,
    tmax,
    tmin,
    tavg,
    precip,
    soilMoisturePct,
    evaporation,
    series: {
      dates: times,
      tmax: tmaxSeries,
      tmin: tminSeries,
      precip: precipSeries,
      soilMoisture: soilSeries.map((v) => (v !== null ? v * 100 : null)),
    },
    raw: { unit: '°C' },
  };
}

function fallbackWeather(latitude, longitude, interval) {
  const tmax = 31;
  const tmin = 20;
  return {
    latitude, longitude, interval, tmax, tmin, tavg: 25.5, precip: 1.5,
    soilMoisturePct: 42, evaporation: 3.8,
    series: { dates: [], tmax: [tmax], tmin: [tmin], precip: [1.5], soilMoisture: [42] },
    raw: { unit: '°C', source: 'fallback' },
  };
}
