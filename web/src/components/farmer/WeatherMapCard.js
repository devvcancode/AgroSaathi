'use client'

import dynamic from 'next/dynamic'
import { CloudSun, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

const IndiaWeatherMap = dynamic(() => import('./IndiaWeatherMap'), {
  ssr: false,
  loading: () => <div className="flex h-[430px] items-center justify-center bg-slate-100 text-slate-400">Loading India weather map…</div>,
})

export default function WeatherMapCard() {
  const [weather, setWeather] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    fetch('/api/weather-map')
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Weather map unavailable')
        if (active) setWeather(data)
      })
      .catch((requestError) => { if (active) setError(requestError.message) })
    return () => { active = false }
  }, [])

  const warmest = weather?.points?.reduce((current, point) => (point.temperatureC > (current?.temperatureC ?? -Infinity) ? point : current), null)

  return (
    <section className="glass-card card-3d">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <CloudSun className="h-5 w-5 text-sky-600" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-sky-600">Live Weather</p>
            <h3 className="mt-1 text-2xl font-bold text-slate-900">India weather map</h3>
          </div>
        </div>
        <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">{weather?.provider || 'Connecting…'} · {weather?.version || 'v3'}</span>
      </div>

      {error ? <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {!weather && !error ? <div className="flex h-[430px] items-center justify-center text-slate-500"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading live weather…</div> : null}
      {weather ? (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-sky-50 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Stations</p><p className="mt-2 text-2xl font-bold text-slate-900">{weather.points.length}</p></div>
            <div className="rounded-2xl bg-emerald-50 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Warmest</p><p className="mt-2 text-2xl font-bold text-slate-900">{warmest?.temperatureC ?? '—'}°C</p></div>
            <div className="rounded-2xl bg-slate-100 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Coverage</p><p className="mt-2 text-2xl font-bold text-slate-900">India only</p></div>
          </div>
          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200"><IndiaWeatherMap points={weather.points} /></div>
        </>
      ) : null}
    </section>
  )
}