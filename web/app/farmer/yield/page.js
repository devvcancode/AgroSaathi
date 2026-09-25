'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Activity, ArrowLeft, BadgeCheck, BrainCircuit, CloudRain, Droplets, Leaf, Loader2, RefreshCw, Sprout, ThermometerSun, TrendingUp } from 'lucide-react'
import { apiUrl } from '@/lib/api'

const defaultInputs = {
  soil_pH: '6.5',
  nitrogen_ppm: '120',
  seasonal_rainfall_mm: '800',
  avg_temp_c: '25',
  ndvi_peak: '0.72',
}

function scoreTone(value) {
  if (value >= 75) return { label: 'Strong field outlook', color: '#047857', track: 'from-emerald-400 to-teal-500' }
  if (value >= 50) return { label: 'Watch the field closely', color: '#b45309', track: 'from-amber-300 to-orange-500' }
  return { label: 'Needs attention', color: '#be123c', track: 'from-rose-400 to-red-500' }
}

function sourceLabel(source) {
  return source === 'random_forest_service' ? 'Random Forest ML service' : 'Fallback field heuristic'
}

export default function YieldPage() {
  const [inputs, setInputs] = useState(defaultInputs)
  const [farm, setFarm] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(apiUrl('/api/farms'))
      .then((response) => response.ok ? response.json() : [])
      .then((farms) => {
        const selectedFarm = farms[0] || null
        setFarm(selectedFarm)
        if (selectedFarm) {
          setInputs((current) => ({
            ...current,
            soil_pH: selectedFarm.soilPh ?? current.soil_pH,
            nitrogen_ppm: selectedFarm.nitrogenKgPerHa ?? current.nitrogen_ppm,
          }))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function calculateYield(event) {
    event?.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await fetch(apiUrl('/api/yield-predict'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(Object.entries(inputs).map(([key, value]) => [key, Number(value)]))),
      })
      const data = await response.json()
      if (!response.ok || data.success === false) throw new Error(data.error || 'Yield model unavailable')
      setResult(data)
    } catch (requestError) {
      setError(requestError.message || 'Unable to calculate yield percentage')
    } finally {
      setLoading(false)
    }
  }

  const score = Number(result?.predicted_yield_percent ?? 0)
  const tone = scoreTone(score)
  const circumference = 2 * Math.PI * 92
  const dashOffset = circumference - (circumference * Math.min(100, Math.max(0, score))) / 100
  const modelInputs = useMemo(() => [
    { label: 'Soil pH', key: 'soil_pH', suffix: '', icon: Droplets, min: 0, max: 14, step: 0.1 },
    { label: 'Nitrogen', key: 'nitrogen_ppm', suffix: ' ppm', icon: Sprout, min: 0, max: 1000, step: 1 },
    { label: 'Season rainfall', key: 'seasonal_rainfall_mm', suffix: ' mm', icon: CloudRain, min: 0, max: 5000, step: 1 },
    { label: 'Average temperature', key: 'avg_temp_c', suffix: ' °C', icon: ThermometerSun, min: -20, max: 60, step: 0.1 },
    { label: 'Peak NDVI', key: 'ndvi_peak', suffix: '', icon: Leaf, min: 0, max: 1, step: 0.01 },
  ], [])

  return (
    <main className="page-farmer min-h-screen px-4 py-6 text-slate-900 md:px-8 md:py-10">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/farmer/dashboard" className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-md hover:bg-white">
            <ArrowLeft className="h-4 w-4" /> Farmer dashboard
          </Link>
          <div className="flex items-center gap-2 rounded-full border border-emerald-200/70 bg-emerald-50/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">
            <BrainCircuit className="h-4 w-4" /> ML yield workspace
          </div>
        </header>

        <section className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.32em] text-emerald-700">Yield percentage</p>
            <h1 className="mt-4 max-w-2xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-6xl">Know your field&apos;s potential before the next harvest.</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-200">A model-backed percentage score built from soil, rainfall, temperature, and crop-health signals. Use it alongside residue planning to decide where attention will create the biggest return.</p>
            {farm && <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-slate-100"><Sprout className="h-4 w-4 text-emerald-300" /> {farm.name} · {farm.cropType} · {farm.areaInAcres} acres</p>}
          </div>

          <div className="relative overflow-hidden rounded-[36px] border border-white/20 bg-slate-950/75 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
            <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-emerald-400/20 blur-3xl" />
            <div className="relative flex flex-col items-center">
              <div className="relative h-64 w-64 sm:h-72 sm:w-72">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 220 220" aria-label={`Yield potential ${Math.round(score)} percent`} role="img">
                  <circle cx="110" cy="110" r="92" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="18" />
                  <circle cx="110" cy="110" r="92" fill="none" stroke="url(#yieldGradient)" strokeLinecap="round" strokeWidth="18" strokeDasharray={circumference} strokeDashoffset={dashOffset} className="transition-all duration-1000" />
                  <defs><linearGradient id="yieldGradient" x1="0" x2="1"><stop stopColor="#34d399" /><stop offset="1" stopColor="#38bdf8" /></linearGradient></defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white">
                  <span className="text-6xl font-black tracking-tight">{result ? Math.round(score) : '—'}<span className="text-3xl text-emerald-300">%</span></span>
                  <span className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">yield potential</span>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold" style={{ color: tone.color, backgroundColor: `${tone.color}20` }}>
                <Activity className="h-4 w-4" /> {result ? tone.label : 'Run the model to see your outlook'}
              </div>
              {result && <div className="mt-5 grid w-full grid-cols-2 gap-3 text-center"><div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-white"><p className="text-2xl font-bold">{Math.round(Number(result.predicted_yield_percent))}%</p><p className="text-[10px] uppercase tracking-widest text-slate-400">predicted</p></div><div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-white"><p className="text-2xl font-bold">{sourceLabel(result.source)}</p><p className="text-[10px] uppercase tracking-widest text-slate-400">model source</p></div></div>}
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <form onSubmit={calculateYield} className="rounded-[30px] border border-white/60 bg-white/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-700">Model inputs</p><h2 className="mt-2 text-2xl font-bold text-slate-900">Refresh the field signal</h2></div><span className="rounded-full bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700">5 feature model</span></div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {modelInputs.map(({ label, key, suffix, icon: Icon, min, max, step }) => <label key={key} className="block text-sm font-semibold text-slate-700"><span className="flex items-center gap-2"><Icon className="h-4 w-4 text-emerald-700" />{label}</span><div className="mt-2 flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100"><input required type="number" min={min} max={max} step={step} value={inputs[key]} onChange={(event) => setInputs((current) => ({ ...current, [key]: event.target.value }))} className="w-full bg-transparent py-3 text-slate-900 outline-none" />{suffix && <span className="text-xs text-slate-400">{suffix}</span>}</div></label>)}
            </div>
            {error && <p role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
            <button type="submit" disabled={loading} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#006a42] px-5 py-4 font-bold text-white shadow-lg shadow-emerald-900/20 transition hover:-translate-y-0.5 hover:bg-[#005836] disabled:opacity-60"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />{loading ? 'Running yield model...' : 'Calculate yield percentage'}</button>
          </form>

          <aside className="rounded-[30px] border border-white/15 bg-slate-950/70 p-6 text-white shadow-2xl backdrop-blur-xl sm:p-8">
            <div className="flex items-center gap-3"><div className="rounded-2xl bg-emerald-400/15 p-3 text-emerald-300"><BadgeCheck className="h-5 w-5" /></div><div><p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">Action signal</p><h2 className="mt-1 text-2xl font-bold">Turn the score into a field plan</h2></div></div>
            <div className="mt-6 space-y-3 text-sm leading-6 text-slate-300"><p><TrendingUp className="mr-2 inline h-4 w-4 text-emerald-300" />High scores support your current crop plan. Keep residue collection and sowing dates aligned.</p><p><Leaf className="mr-2 inline h-4 w-4 text-amber-300" />Lower scores are a prompt to inspect soil, moisture, crop stress, and stubble timing before spending on inputs.</p><p><Activity className="mr-2 inline h-4 w-4 text-sky-300" />The result is decision support, not a guaranteed harvest or a chemical prescription.</p></div>
            <Link href="/farmer/dashboard" className="mt-7 inline-flex w-full items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/15">Open residue & stubble plan</Link>
          </aside>
        </section>
      </div>
    </main>
  )
}
