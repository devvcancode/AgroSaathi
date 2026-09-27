'use client'

import dynamic from 'next/dynamic'
import { CloudSun, Droplets, Loader2, MapPin, RefreshCw, ShieldAlert, Wind } from 'lucide-react'
import { useEffect, useState } from 'react'

const IndiaWeatherMap = dynamic(() => import('./IndiaWeatherMap'), {
  ssr: false,
  loading: () => <div className="flex h-[430px] items-center justify-center bg-slate-100 text-slate-400">Loading India weather map…</div>,
})

export default function WeatherMapCard() {
  const [weather, setWeather] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let active = true
    async function loadWeather() {
      setLoading(true)
      setError('')
      try {
        const response = await fetch('/api/weather-map', { cache: 'no-store' })
        const text = await response.text()
        let data = {}

        try {
          data = text ? JSON.parse(text) : {}
        } catch (parseError) {
          throw new Error('Weather service returned an invalid response. Please try again.')
        }

        if (!response.ok) throw new Error(data.error || 'Weather map unavailable')
        if (active) setWeather(data)
      } catch (requestError) {
        if (active) setError(requestError.message)
      } finally {
        if (active) setLoading(false)
      }
    }
    loadWeather()
    return () => { active = false }
  }, [refreshKey])

  const observations = weather?.points?.filter((point) => point.temperatureC != null) || []
  const warmest = observations.reduce((current, point) => (point.temperatureC > (current?.temperatureC ?? -Infinity) ? point : current), null)
  const sourceConnected = weather?.sourceStatus === 'provider'

  return (
    <section className="overflow-hidden rounded-xl border border-slate-300 bg-white text-slate-900 shadow-sm">
      <div className="border-b-4 border-amber-500 bg-[#f7f9fb] px-5 py-4 sm:px-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#123d62] text-white"><CloudSun className="h-6 w-6" /></div>
            <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#355c78]">AgroSaathi · Weather desk</p><h3 className="mt-1 text-2xl font-bold text-[#102f49]">Weather observation network</h3></div>
          </div>
          <button type="button" onClick={() => setRefreshKey((value) => value + 1)} disabled={loading} title="Refresh weather data" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh</button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-200 pt-3 text-xs text-slate-600">
          <span className="inline-flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${sourceConnected ? 'bg-emerald-600' : 'bg-amber-500'}`} />Source status: {sourceConnected ? 'Provider connected' : error ? 'Unavailable' : loading ? 'Connecting' : 'Not configured'}</span>
          <span>Provider: {weather?.provider || 'Waiting for response'}</span>
          <span>Data version: {weather?.version || '—'}</span>
          <span className="font-semibold text-slate-700">Independent service; not a government portal.</span>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
        {loading && <div className="mb-4 flex items-center gap-2 text-sm text-slate-600"><Loader2 className="h-4 w-4 animate-spin" />Retrieving provider observations…</div>}
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 p-4"><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Reporting stations</p><p className="mt-2 text-2xl font-bold text-[#123d62]">{observations.length} <span className="text-sm font-medium text-slate-500">/ {weather?.points?.length || 11}</span></p></div>
          <div className="rounded-lg border border-slate-200 p-4"><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Highest reported temperature</p><p className="mt-2 text-2xl font-bold text-[#123d62]">{warmest ? `${warmest.temperatureC}°C` : 'No observation'}</p></div>
          <div className="rounded-lg border border-slate-200 p-4"><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Coverage</p><p className="mt-2 text-2xl font-bold text-[#123d62]">India</p></div>
        </div>
        {!loading && !error && !observations.length && <div className="mt-4 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"><ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" /><p>No live station values are available. Configure the weather provider to display observations; estimated values are intentionally not shown.</p></div>}
        {weather && <div className="mt-5 grid gap-5 xl:grid-cols-[1.5fr_0.8fr]">
          <div className="overflow-hidden rounded-lg border border-slate-300"><div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3"><h4 className="text-sm font-bold text-[#173c59]">India station map</h4><span className="text-xs text-slate-500">Select a marker for station details</span></div><IndiaWeatherMap points={weather.points} /></div>
          <div className="overflow-hidden rounded-lg border border-slate-200"><div className="border-b border-slate-200 bg-slate-50 px-4 py-3"><h4 className="text-sm font-bold text-[#173c59]">Station observations</h4></div><div className="max-h-[500px] divide-y divide-slate-200 overflow-y-auto">{weather.points.map((point) => <div key={`${point.name}-${point.state}`} className="px-4 py-3"><div className="flex items-center justify-between gap-3"><p className="flex items-center gap-2 text-sm font-semibold text-slate-800"><MapPin className="h-4 w-4 text-[#356b8f]" />{point.name}, {point.state}</p><span className="text-sm font-bold text-[#173c59]">{point.temperatureC == null ? '—' : `${point.temperatureC}°C`}</span></div><p className="mt-1 pl-6 text-xs text-slate-500">{point.condition}</p><p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 pl-6 text-xs text-slate-600"><span className="inline-flex items-center gap-1"><Droplets className="h-3.5 w-3.5" />{point.humidityPct == null ? '—' : `${point.humidityPct}%`}</span><span className="inline-flex items-center gap-1"><Wind className="h-3.5 w-3.5" />{point.windKph == null ? '—' : `${point.windKph} km/h`}</span><span>Rain {point.precipitationMm == null ? '—' : `${point.precipitationMm} mm`}</span></p></div>)}</div></div>
        </div>}
      </div>
    </section>
  )
}