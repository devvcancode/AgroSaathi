'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, BarChart3, ShieldCheck, Users, Search, CheckCircle2 } from 'lucide-react'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import LiveDriverTracker from '@/components/admin/LiveDriverTracker'
import { apiUrl } from '@/lib/api'

export default function AdminDashboard() {
  const [overview, setOverview] = useState({ farmers: 0, bookings: 0, diagnostics: 0, districts: [] })
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const visibleReviews = useMemo(() => reviews.filter((item) => `${item.farm?.name || ''} ${item.farm?.village || ''} ${item.farm?.state || ''} ${item.reviewType}`.toLowerCase().includes(query.toLowerCase())), [reviews, query])

  useEffect(() => {
    Promise.all([fetch(apiUrl('/api/admin/overview')), fetch(apiUrl('/api/admin/reviews'))]).then(async ([overviewResponse, reviewsResponse]) => {
      if (!overviewResponse.ok || !reviewsResponse.ok) throw new Error('Unable to load admin data')
      setOverview(await overviewResponse.json())
      setReviews(await reviewsResponse.json())
    }).catch((loadError) => setError(loadError.message)).finally(() => setLoading(false))
  }, [])

  function markReviewed(id) {
    fetch(apiUrl('/api/admin/reviews'), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: 'reviewed' }) }).then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Unable to update review'); setReviews((items) => items.map((item) => item.id === id ? { ...item, ...data } : item)) }).catch((updateError) => setError(updateError.message))
  }

  return (
    <main className="page-admin min-h-screen p-4 text-slate-800 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between rounded-[24px] border border-white/80 bg-white/70 p-4 backdrop-blur-md">
          <Link href="/login" className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" /> AgroVani Admin Portal
          </Link>
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-blue-700">Admin</span>
          <LanguageSwitcher />
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-[28px] border border-white/80 bg-white/80 p-6 shadow-sm backdrop-blur-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
              <Users className="h-6 w-6" />
            </div>
            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">Farmers</p>
            <p className="mt-3 text-4xl font-bold text-slate-900">{overview.farmers.toLocaleString('en-IN')}</p>
            <p className="mt-2 text-sm text-slate-600">Registered active farmers</p>
          </div>

          <div className="rounded-[28px] border border-white/80 bg-white/80 p-6 shadow-sm backdrop-blur-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <BarChart3 className="h-6 w-6" />
            </div>
            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">Operations</p>
            <p className="mt-3 text-4xl font-bold text-slate-900">{overview.districts.length ? Math.round(overview.districts.reduce((sum, district) => sum + Number(district.coverage || 0), 0) / overview.districts.length) : 0}%</p>
            <p className="mt-2 text-sm text-slate-600">District program coverage</p>
          </div>

          <div className="rounded-[28px] border border-white/80 bg-white/80 p-6 shadow-sm backdrop-blur-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">Compliance</p>
            <p className="mt-3 text-4xl font-bold text-slate-900">{overview.diagnostics ? Math.min(100, overview.diagnostics) : 0}%</p>
            <p className="mt-2 text-sm text-slate-600">Verification and audit score</p>
          </div>
        </div>
        {loading && <p className="mt-6 text-sm text-slate-600">Loading shared admin data...</p>}
        {error && <p role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[28px] border border-white/80 bg-white/75 p-6 shadow-sm backdrop-blur-md"><p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">National rollout</p><h2 className="mt-2 text-2xl font-bold text-slate-900">District coverage</h2><div className="mt-5 space-y-4">{overview.districts.map((district) => <div key={district.id || district.district}><div className="flex justify-between text-sm"><span className="font-semibold text-slate-800">{district.district}</span><span className="text-slate-500">{district.farmers} farmers · {district.coverage}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${district.coverage}%` }} /></div></div>)}</div></div>
          <div className="rounded-[28px] border border-white/80 bg-white/75 p-6 shadow-sm backdrop-blur-md"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">Action queue</p><h2 className="mt-2 text-2xl font-bold text-slate-900">Reviews</h2></div><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">{reviews.filter((item) => item.status === 'open').length} open</span></div><div className="mt-5 space-y-3">{visibleReviews.map((item) => <div key={item.id} className="rounded-2xl bg-white/70 p-3"><p className="text-sm font-semibold text-slate-900">{item.farm?.name || 'Farm record'}</p><p className="mt-1 text-xs text-slate-500">{item.farm?.village}, {item.farm?.state}</p><div className="mt-3 flex items-center justify-between gap-2"><span className="text-xs text-slate-600">{item.reviewType}</span><button onClick={() => markReviewed(item.id)} disabled={item.status !== 'open'} className="rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white disabled:bg-emerald-600">{item.status === 'open' ? 'Review' : 'Reviewed'}</button></div></div>)}</div></div>
        </section>

        <section className="mt-6 rounded-[28px] border border-white/80 bg-white/75 p-6 shadow-sm backdrop-blur-md"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">Farmer operations</p><h2 className="mt-2 text-2xl font-bold text-slate-900">Find a farmer or request</h2></div><div className="flex min-w-[240px] items-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-3"><Search className="h-4 w-4 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the action queue" className="w-full bg-transparent py-2 text-sm outline-none" /></div></div><div className="mt-4 flex items-center gap-2 text-sm text-slate-600"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Verification actions are tracked locally in this demo portal.</div></section>
        <LiveDriverTracker />
      </div>
    </main>
  )
}
