'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Store, TrendingUp, PackageCheck, Plus, Search, Truck, Check } from 'lucide-react'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { seedCatalog } from '@/lib/data/seedCatalog'
import RazorpayButton from '@/components/RazorpayButton'
import { plans } from '@/lib/data/plans'
import { apiUrl } from '@/lib/api'
import SupportDock from '@/components/SupportDock'

export default function SellerDashboard() {
  const [listings, setListings] = useState([])
  const [orders, setOrders] = useState([])
  const [sellerId, setSellerId] = useState('seller@agrovani.in')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [showForm, setShowForm] = useState(false)
  const [draft, setDraft] = useState({ name: '', category: 'Biostimulant', stock: 1, price: '', residueType: '', qualityGrade: '', moisturePercent: '', quantityQuintals: '', pickupDistrict: '', notes: '' })

  const filteredListings = useMemo(() => listings.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()) && (category === 'All' || item.category === category)), [listings, query, category])
  const inventory = listings.reduce((sum, item) => sum + Number(item.stockUnits || 0), 0)
  const revenue = orders.reduce((sum, order) => sum + Number(order.totalInr || 0), 0)
  const delivered = orders.length ? Math.round((orders.filter((order) => order.status === 'delivered').length / orders.length) * 100) : 0
  const activeOrders = orders.filter((order) => order.status !== 'delivered')
  const pendingPickup = orders.filter((order) => ['new', 'packed'].includes(order.status)).length
  const statusOrder = ['new', 'packed', 'out_for_delivery', 'delivered']
  const orderProgress = useMemo(() => {
    const total = orders.length || 1
    return {
      new: Math.round((orders.filter((order) => order.status === 'new').length / total) * 100),
      packed: Math.round((orders.filter((order) => order.status === 'packed').length / total) * 100),
      out_for_delivery: Math.round((orders.filter((order) => order.status === 'out_for_delivery').length / total) * 100),
      delivered: Math.round((orders.filter((order) => order.status === 'delivered').length / total) * 100),
    }
  }, [orders])

  const statusStyles = {
    new: 'bg-sky-100 text-sky-700',
    packed: 'bg-amber-100 text-amber-700',
    out_for_delivery: 'bg-violet-100 text-violet-700',
    delivered: 'bg-emerald-100 text-emerald-700',
  }

  const statusLabel = {
    new: 'New',
    packed: 'Packed',
    out_for_delivery: 'Out for delivery',
    delivered: 'Delivered',
  }

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('agrovani_user') || '{}')
    const currentSeller = user.email || 'seller@agrovani.in'
    setSellerId(currentSeller)
    Promise.all([fetch(apiUrl(`/api/marketplace/listings?sellerId=${encodeURIComponent(currentSeller)}`)), fetch(apiUrl(`/api/marketplace/orders?sellerId=${encodeURIComponent(currentSeller)}`))])
      .then(async ([listingResponse, orderResponse]) => {
        if (!listingResponse.ok || !orderResponse.ok) throw new Error('Unable to load seller data')
        setListings(await listingResponse.json())
        setOrders(await orderResponse.json())
      })
      .catch((loadError) => setError(loadError.message))
      .finally(() => setLoading(false))
  }, [])

  function addListing(event) {
    event.preventDefault()
    if (!draft.name || !draft.price) return
    fetch(apiUrl('/api/marketplace/listings'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sellerId, name: draft.name, category: draft.category, stockUnits: draft.stock, priceInr: draft.price, residueType: draft.residueType, qualityGrade: draft.qualityGrade, moisturePercent: draft.moisturePercent, quantityQuintals: draft.quantityQuintals, pickupDistrict: draft.pickupDistrict, notes: draft.notes }) })
      .then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Unable to publish listing'); setListings((items) => [data, ...items]); setDraft({ name: '', category: 'Biostimulant', stock: 1, price: '' }); setShowForm(false) })
      .catch((saveError) => setError(saveError.message))
  }

  function advanceOrder(id) {
    const order = orders.find((item) => item.id === id)
    const nextStatus = order?.status === 'new' ? 'packed' : order?.status === 'packed' ? 'out_for_delivery' : 'delivered'
    fetch(apiUrl('/api/marketplace/orders'), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: nextStatus }) })
      .then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Unable to update order'); setOrders((items) => items.map((item) => item.id === id ? data : item)) })
      .catch((updateError) => setError(updateError.message))
  }

  return (
    <main className="page-seller min-h-screen p-4 text-slate-800 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between rounded-[24px] border border-white/80 bg-white/70 p-4 backdrop-blur-md">
          <Link href="/login" className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" /> AgroVani Seller Portal
          </Link>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-amber-700">Seller</span>
          <LanguageSwitcher />
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          <div className="rounded-[28px] border border-white/80 bg-white/80 p-6 shadow-sm backdrop-blur-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <Store className="h-6 w-6" />
            </div>
            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">Inventory</p>
            <p className="mt-3 text-4xl font-bold text-slate-900">{inventory.toLocaleString('en-IN')}</p>
            <p className="mt-2 text-sm text-slate-600">Units listed this month</p>
          </div>

          <div className="rounded-[28px] border border-white/80 bg-white/80 p-6 shadow-sm backdrop-blur-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <TrendingUp className="h-6 w-6" />
            </div>
            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">Sales</p>
            <p className="mt-3 text-4xl font-bold text-slate-900">₹{revenue.toLocaleString('en-IN')}</p>
            <p className="mt-2 text-sm text-slate-600">Monthly revenue generated</p>
          </div>

          <div className="rounded-[28px] border border-white/80 bg-white/80 p-6 shadow-sm backdrop-blur-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
              <PackageCheck className="h-6 w-6" />
            </div>
            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">Fulfillment</p>
            <p className="mt-3 text-4xl font-bold text-slate-900">{delivered}%</p>
            <p className="mt-2 text-sm text-slate-600">On-time shipping rate</p>
          </div>

          <div className="rounded-[28px] border border-white/80 bg-white/80 p-6 shadow-sm backdrop-blur-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
              <Truck className="h-6 w-6" />
            </div>
            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">Pickup queue</p>
            <p className="mt-3 text-4xl font-bold text-slate-900">{pendingPickup}</p>
            <p className="mt-2 text-sm text-slate-600">Orders awaiting dispatch</p>
          </div>
        </div>
        {loading && <p className="mt-6 text-sm text-slate-600">Loading shared seller data...</p>}
        {error && <p role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        <section className="mt-6 rounded-[28px] border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-6 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><p className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-700">Primary marketplace</p><h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Featured Seeds</h2><p className="mt-2 text-sm text-slate-600">Make quality seed the first choice for every sowing season.</p></div>
            <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">6 seed types</span>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {seedCatalog.map((seed) => (
              <div key={seed.name} className="rounded-2xl border border-white/80 bg-white/80 p-4">
                <div className="flex items-start justify-between gap-3"><div><p className="font-bold text-slate-900">{seed.name}</p><p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">{seed.type}</p></div><span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-700">{seed.season}</span></div>
                <p className="mt-3 text-sm leading-5 text-slate-600">{seed.note}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-[28px] border border-white/80 bg-white/75 p-6 shadow-sm backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div><p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">Catalog</p><h2 className="mt-2 text-2xl font-bold text-slate-900">Manage listings</h2></div>
            <button onClick={() => setShowForm((value) => !value)} className="pill-dark"><Plus className="mr-2 h-4 w-4" /> Add listing</button>
          </div>
          {showForm && <form onSubmit={addListing} className="mt-5 grid gap-3 rounded-2xl bg-white/70 p-4 sm:grid-cols-4"><input required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Product name" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" /><select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2 text-sm"><option>Seeds</option><option>Biostimulant</option><option>Fungicide</option><option>Insecticide</option></select><input required type="number" min="1" value={draft.stock} onChange={(event) => setDraft({ ...draft, stock: event.target.value })} placeholder="Stock" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" /><input required type="number" min="1" value={draft.price} onChange={(event) => setDraft({ ...draft, price: event.target.value })} placeholder="Price in INR" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" /><button className="pill-dark sm:col-span-4">Publish listing</button></form>}
          <div className="mt-5 flex flex-wrap gap-3"><div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-3"><Search className="h-4 w-4 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products" className="w-full bg-transparent py-2 text-sm outline-none" /></div>{['All', 'Seeds', 'Biostimulant', 'Fungicide', 'Insecticide'].map((item) => <button key={item} onClick={() => setCategory(item)} className={`rounded-full px-4 py-2 text-xs font-semibold ${category === item ? 'bg-slate-900 text-white' : 'bg-white/70 text-slate-600'}`}>{item}</button>)}</div>
          <div className="mt-4 divide-y divide-slate-200/70">{filteredListings.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><p className="font-semibold text-slate-900">{item.name}</p><p className="text-xs text-slate-500">{item.category} · ₹{Number(item.priceInr).toLocaleString('en-IN')}</p></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.stockUnits < 50 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{item.stockUnits} in stock</span></div>)}</div>
        </section>

        <section className="mt-6 rounded-[28px] border border-white/80 bg-white/75 p-6 shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-2"><Truck className="h-5 w-5 text-sky-600" /><h2 className="text-2xl font-bold text-slate-900">Residue order pipeline</h2></div>
          <div className="mt-5 grid gap-3 md:grid-cols-4">
            {Object.entries(orderProgress).map(([state, percent]) => (
              <div key={state} className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>{statusLabel[state]}</span>
                  <span className="font-semibold text-slate-900">{percent}%</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-sky-500" style={{ width: `${percent}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-3">
            {activeOrders.length ? activeOrders.map((order) => (
              <div key={order.id} className="flex flex-col gap-3 rounded-2xl bg-white/80 p-4 shadow-sm md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{order.id}</p>
                  <p className="text-sm text-slate-500">Quantity {order.quantity} · ₹{Number(order.totalInr).toLocaleString('en-IN')}</p>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[order.status] || 'bg-slate-100 text-slate-700'}`}>
                    {statusLabel[order.status] || order.status}
                  </span>
                  <button onClick={() => advanceOrder(order.id)} className="flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white">
                    <Check className="h-3.5 w-3.5" />
                    {statusOrder[Math.min(statusOrder.indexOf(order.status) + 1, statusOrder.length - 1)] ? 'Advance status' : 'Completed'}
                  </button>
                </div>
              </div>
            )) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-6 text-sm text-slate-500">No active orders in the dispatch pipeline.</div>
            )}
          </div>
        </section>

        <section className="mt-6 rounded-[28px] border border-white/80 bg-white/75 p-6 shadow-sm backdrop-blur-md">
          <div className="mb-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-600">Membership</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Our Plans</h2>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {plans.map((plan) => (
              <div key={plan.id} className={`relative rounded-[24px] border p-5 ${plan.highlight ? 'border-amber-200 bg-amber-50 ring-2 ring-amber-100' : 'border-slate-200 bg-white'}`}>
                {plan.highlight && <span className="absolute right-4 top-4 rounded-full bg-amber-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white">Best value</span>}
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">{plan.name}</p>
                <p className="mt-4 text-3xl font-bold text-slate-900">{plan.priceInr === 0 ? '₹0' : `₹${plan.priceInr.toLocaleString('en-IN')}`}<span className="ml-2 text-sm font-medium text-slate-500">/mo</span></p>
                <p className="mt-2 text-sm text-slate-600">{plan.note}</p>
                <ul className="mt-5 space-y-2 text-sm text-slate-700">{plan.features.map((feature) => <li key={feature} className="flex items-center gap-3"><span className="h-2 w-2 rounded-full bg-amber-500" />{feature}</li>)}</ul>
                <RazorpayButton plan={plan} />
              </div>
            ))}
          </div>
        </section>
      </div>
      <SupportDock role="seller" />
    </main>
  )
}
