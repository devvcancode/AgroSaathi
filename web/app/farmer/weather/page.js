'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CloudRain, MapPin, Satellite, ShieldCheck } from 'lucide-react'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import SupportDock from '@/components/SupportDock'
import { apiUrl } from '@/lib/api'

export default function FarmerWeatherPage() {
  const [farm, setFarm] = useState(null)
  const [data, setData] = useState(null)
  const [message, setMessage] = useState('Loading live weather...')

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('agrovani_farm') || 'null')
    setFarm(saved)
    if (!saved?.latitude || !saved?.longitude) return setMessage('Complete farmer onboarding to use location-based weather.')
    fetch(apiUrl(`/api/stress?lat=${saved.latitude}&lon=${saved.longitude}&crop=${encodeURIComponent(saved.cropType || 'Rice')}&area=${saved.areaInAcres || 1}&state=${encodeURIComponent(saved.state || 'India')}`))
      .then(async (response) => { const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Weather unavailable'); setData(result); setMessage('Live Meteoblue weather signal loaded') })
      .catch((error) => setMessage(error.message))
  }, [])

  const weather = data?.weather
  return <main className="page-farmer min-h-screen p-4 text-slate-100 md:p-8"><div className="mx-auto max-w-7xl"><header className="mb-6 flex flex-wrap items-center justify-between gap-4"><Link href="/farmer/dashboard" className="flex items-center gap-2 text-sm font-semibold"><ArrowLeft className="h-4 w-4" /> Farmer dashboard</Link><div className="flex items-center gap-3"><LanguageSwitcher /><Link href="/farmer/operations" className="glass-btn">Operations</Link></div></header><div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]"><section className="glass-card border-white/15 bg-white/10"><div className="flex items-center gap-3"><CloudRain className="h-7 w-7 text-sky-300" /><div><p className="text-xs uppercase tracking-[0.25em] text-sky-200">Live field weather</p><h1 className="mt-1 text-3xl font-bold">Weather & verification</h1></div></div><p className="mt-4 text-sm text-slate-300">{message}</p>{farm && <p className="mt-2 flex items-center gap-2 text-sm text-slate-300"><MapPin className="h-4 w-4" /> {farm.village || farm.district}, {farm.state}</p>}<div className="mt-8 grid gap-4 sm:grid-cols-2"><div className="rounded-2xl border border-white/10 bg-black/10 p-4"><p className="text-xs uppercase tracking-wider text-slate-400">Temperature</p><p className="mt-3 text-4xl font-bold">{weather?.tavg ?? '—'}°C</p><p className="mt-2 text-sm text-slate-300">{weather ? `${weather.tmin}°C to ${weather.tmax}°C` : 'Waiting for signal'}</p></div><div className="rounded-2xl border border-white/10 bg-black/10 p-4"><p className="text-xs uppercase tracking-wider text-slate-400">Rainfall</p><p className="mt-3 text-4xl font-bold">{weather?.precip ?? '—'} mm</p><p className="mt-2 text-sm text-slate-300">Recent verified interval</p></div><div className="rounded-2xl border border-white/10 bg-black/10 p-4"><p className="text-xs uppercase tracking-wider text-slate-400">Soil moisture</p><p className="mt-3 text-4xl font-bold">{weather?.soilMoisturePct?.toFixed?.(1) ?? '—'}%</p></div><div className="rounded-2xl border border-white/10 bg-black/10 p-4"><p className="text-xs uppercase tracking-wider text-slate-400">Drought signal</p><p className="mt-3 text-2xl font-bold text-amber-200">{data?.diagnostic?.droughtIndex?.risk || '—'}</p></div></div></section><aside className="space-y-6"><div className="glass-card border-white/15 bg-white/10"><div className="flex items-center gap-3"><Satellite className="h-6 w-6 text-emerald-300" /><h2 className="text-xl font-bold">Satellite verification</h2></div><p className="mt-4 text-sm leading-6 text-slate-300">Satellite rainfall and crop imagery require an authorized ISRO/Bhuvan data endpoint. The interface is ready, but no satellite feed is shown until credentials and a source are configured.</p><div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-xs text-amber-100"><ShieldCheck className="h-4 w-4" /> No synthetic satellite readings</div></div><div className="glass-card border-white/15 bg-white/10"><h2 className="text-xl font-bold">Farmer verification</h2><p className="mt-3 text-sm leading-6 text-slate-300">A future verification workflow can combine nearby farmer reports, rain gauges, and satellite observations before a task is scheduled.</p></div></aside></div></div><SupportDock role="farmer" context={{ weather: data }} /></main>
}
