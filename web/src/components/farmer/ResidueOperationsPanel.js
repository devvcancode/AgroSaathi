'use client'

import { useEffect, useState } from 'react'
import { CalendarClock, CircleDollarSign, Loader2, RefreshCw, Sparkles, Truck } from 'lucide-react'
import { apiUrl } from '@/lib/api'

export default function ResidueOperationsPanel() {
  const [farms, setFarms] = useState([])
  const [farmId, setFarmId] = useState('')
  const [data, setData] = useState(null)
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [planning, setPlanning] = useState(false)
  const [error, setError] = useState('')

  async function load(farm) {
    if (!farm) return
    setLoading(true); setError('')
    try {
      const response = await fetch(apiUrl(`/api/residue/operations?farmId=${encodeURIComponent(farm)}`))
      const next = await response.json()
      if (!response.ok) throw new Error(next.error || 'Residue operations unavailable')
      setData(next); setPlan(next.operation || null)
    } catch (requestError) { setError(requestError.message) } finally { setLoading(false) }
  }

  useEffect(() => {
    fetch(apiUrl('/api/farms')).then((response) => response.json()).then((items) => {
      setFarms(items)
      const selected = items[0]?.id || ''
      setFarmId(selected)
      return selected ? load(selected) : null
    }).catch((requestError) => setError(requestError.message)).finally(() => setLoading(false))
  }, [])

  async function generatePlan() {
    if (!farmId) return
    setPlanning(true); setError('')
    try {
      const response = await fetch(apiUrl('/api/residue/operations/plan'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ farmId }) })
      const next = await response.json()
      if (!response.ok) throw new Error(next.error || 'Unable to create residue plan')
      setPlan(next)
      await load(farmId)
    } catch (requestError) { setError(requestError.message) } finally { setPlanning(false) }
  }

  const profile = data?.profile
  const buyerNeeds = data?.buyerNeeds || []
  const orders = data?.orders || []

  return <section className="mt-6 overflow-hidden rounded-[30px] border border-amber-200/20 bg-slate-950/70 p-6 text-white shadow-2xl backdrop-blur-xl sm:p-8">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-300">Residue & stubble management</p><h2 className="mt-2 text-3xl font-bold">Plan the pickup before the field is ready</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Keep quantity, quality, buyer demand, and dispatch timing in one farmer-owned view. Gemini can turn the live records into a practical collection plan.</p></div><Sparkles className="h-7 w-7 text-amber-300" /> </div>
    <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto_auto]"><select value={farmId} onChange={(event) => { setFarmId(event.target.value); load(event.target.value) }} className="rounded-xl border border-white/15 bg-white/10 px-3 py-3 text-sm text-white">{farms.map((farm) => <option className="text-slate-900" key={farm.id} value={farm.id}>{farm.name} · {farm.cropType} · {farm.district}</option>)}</select><button onClick={() => load(farmId)} disabled={loading || !farmId} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold hover:bg-white/15"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh</button><button onClick={generatePlan} disabled={planning || !farmId} className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-300 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-amber-200 disabled:opacity-60"><Sparkles className="h-4 w-4" />{planning ? 'Planning…' : 'Generate plan'}</button></div>
    {error && <p role="alert" className="mt-4 rounded-xl border border-rose-300/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</p>}
    {loading && !data ? <div className="mt-6 flex items-center gap-2 text-sm text-slate-300"><Loader2 className="h-4 w-4 animate-spin" /> Loading synced residue records…</div> : <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5"><div className="grid gap-3 sm:grid-cols-3"><div><p className="text-xs text-slate-400">Available residue</p><p className="mt-1 text-2xl font-bold">{profile?.quantityQuintals || Math.round(Number(data?.residue?.residueTons || 0) * 10)} <span className="text-sm text-slate-400">qtl</span></p></div><div><p className="text-xs text-slate-400">Buyer signals</p><p className="mt-1 text-2xl font-bold text-amber-300">{buyerNeeds.length}</p></div><div><p className="text-xs text-slate-400">Active dispatches</p><p className="mt-1 text-2xl font-bold text-sky-300">{orders.length}</p></div></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-black/15 p-3"><CircleDollarSign className="h-4 w-4 text-emerald-300" /><p className="mt-2 text-xs text-slate-400">Quality</p><p className="font-semibold">{profile?.qualityGrade || 'Not set'}</p></div><div className="rounded-xl bg-black/15 p-3"><CalendarClock className="h-4 w-4 text-amber-300" /><p className="mt-2 text-xs text-slate-400">Ready by</p><p className="font-semibold">{profile?.pickupReadyDate || 'Not set'}</p></div><div className="rounded-xl bg-black/15 p-3"><Truck className="h-4 w-4 text-sky-300" /><p className="mt-2 text-xs text-slate-400">Buyer status</p><p className="font-semibold">{buyerNeeds.length ? 'Demand found' : 'Awaiting demand'}</p></div></div></div>
      <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-5"><p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-200">Dispatch plan</p>{plan ? <><h3 className="mt-2 text-xl font-bold">{plan.summary}</h3><p className="mt-3 text-sm text-amber-50">{plan.quantityQuintals} qtl · {plan.residueType} · {plan.buyerSignal}</p><ul className="mt-4 space-y-2 text-sm text-amber-50">{(plan.nextActions || []).map((action) => <li key={action}>• {action}</li>)}</ul><p className="mt-4 text-xs leading-5 text-amber-100/80">{plan.safetyNote}</p><span className="mt-4 inline-flex rounded-full bg-black/15 px-3 py-1 text-xs font-bold text-amber-100">Source: {plan.source === 'gemini' ? 'Gemini base model' : 'Local planning fallback'}</span></> : <p className="mt-3 text-sm leading-6 text-amber-50">Generate a plan to combine your residue profile with buyer needs and active dispatch records.</p>}</div>
    </div>}
  </section>
}
