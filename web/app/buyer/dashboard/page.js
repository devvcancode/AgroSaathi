'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ClipboardList, Clock, PackageSearch, Send, ShieldCheck, Sprout, Store, Truck } from 'lucide-react'
import LanguageSwitcher from '@/components/LanguageSwitcher'

const BuyerFarmerMap = dynamic(() => import('@/components/buyer/BuyerFarmerMap'), {
  ssr: false,
  loading: () => <div className="flex h-[500px] items-center justify-center bg-slate-100 text-slate-400">Loading India farmer map…</div>,
})

const crops = ['Rice', 'Wheat', 'Soybean', 'Cotton', 'Maize']
const residueTypes = ['Paddy straw', 'Wheat straw', 'Maize residue', 'Cotton stalk', 'Soybean residue']

const emptyNeed = { cropType: 'Rice', residueType: 'Paddy straw', useCase: 'Biomass processing', region: 'Punjab', urgency: 'This month', quantity: '', notes: '' }

export default function BuyerDashboard() {
  const [farms, setFarms] = useState([])
  const [needs, setNeeds] = useState([])
  const [sellers, setSellers] = useState([])
  const [orders, setOrders] = useState([])
  const [selectedListing, setSelectedListing] = useState('')
  const [orderQuantity, setOrderQuantity] = useState(1)
  const [cropFilter, setCropFilter] = useState('All')
  const [form, setForm] = useState(emptyNeed)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const buyerId = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('agrovani_user') || '{}').email || 'buyer@agrovani.in' : 'buyer@agrovani.in'
  const cropCounts = useMemo(() => crops.reduce((counts, crop) => ({ ...counts, [crop]: farms.filter((farm) => farm.cropType === crop).length }), {}), [farms])

  useEffect(() => {
    Promise.all([
      fetch('/api/buyer/farm-map').then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Unable to load farmer map'); return data.farms }),
      fetch(`/api/buyer/needs?buyerId=${encodeURIComponent(buyerId)}`).then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Unable to load buyer needs'); return data }),
      fetch('/api/buyer/sellers').then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Unable to load seller offers'); return data }),
      fetch(`/api/marketplace/orders?buyerId=${encodeURIComponent(buyerId)}`).then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Unable to load buyer orders'); return data }),
    ])
      .then(([farmData, needData, sellerData, orderData]) => {
        const uniqueFarms = [...new Map(farmData.map((farm) => [farm.id, farm])).values()]
        const uniqueSellers = [...new Map(sellerData.map((seller) => [seller.id, seller])).values()]
        const uniqueOrders = [...new Map(orderData.map((order) => [order.id, order])).values()]
        setFarms(uniqueFarms)
        setNeeds(needData)
        setSellers(uniqueSellers)
        setOrders(uniqueOrders)
        setSelectedListing(uniqueSellers[0]?.id || '')
      })
      .catch((loadError) => setError(loadError.message))
      .finally(() => setLoading(false))
  }, [buyerId])

  function setField(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  async function submitNeed(event) {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')
    try {
      const response = await fetch('/api/buyer/needs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, buyerId }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to publish need')
      setNeeds((current) => [data, ...current])
      setForm(emptyNeed)
      setMessage('Your need is live. Matching farmers will be contacted without exposing their residue quantity upfront.')
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSaving(false)
    }
  }

  async function placeOrder(event) {
    event.preventDefault()
    const listing = sellers.find((item) => item.id === selectedListing)
    if (!listing) return setError('Choose a seller offer first.')
    setSaving(true)
    setMessage('')
    setError('')
    try {
      const response = await fetch('/api/marketplace/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ buyerId, sellerId: listing.sellerId, listingId: listing.id, quantity: Number(orderQuantity), totalInr: Number(listing.priceInr) * Number(orderQuantity) }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to place order')
      setOrders((current) => [data, ...current])
      setMessage(`Order placed with ${listing.sellerName}. Expected delivery in ${data.expectedDeliveryDays} days.`)
    } catch (orderError) {
      setError(orderError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#101c22] px-4 py-5 text-slate-100 md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
          <Link href="/login" className="flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white"><ArrowLeft className="h-4 w-4" /> AgroVani Buyer Desk</Link>
          <div className="flex items-center gap-3"><span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-amber-200">Buyer</span><LanguageSwitcher /></div>
        </header>

        <section className="grid gap-8 py-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
          <div><p className="text-xs font-bold uppercase tracking-[0.35em] text-amber-300">Residue sourcing desk</p><h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-6xl">Source by need, not by guesswork.</h1><p className="mt-5 max-w-xl text-base leading-7 text-slate-300">List the crop residue you need and discover India-wide farmer networks by crop. Farmer quantities stay private until your request is matched.</p></div>
          <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-white/10 bg-white/5 p-5"><PackageSearch className="h-5 w-5 text-amber-300" /><p className="mt-5 text-3xl font-bold text-white">{farms.length}</p><p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">Farmer locations</p></div><div className="rounded-2xl border border-white/10 bg-white/5 p-5"><Sprout className="h-5 w-5 text-emerald-300" /><p className="mt-5 text-3xl font-bold text-white">{Object.values(cropCounts).filter(Boolean).length}</p><p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">Crop networks</p></div><div className="rounded-2xl border border-white/10 bg-white/5 p-5"><ShieldCheck className="h-5 w-5 text-sky-300" /><p className="mt-5 text-3xl font-bold text-white">Private</p><p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">Quantity disclosure</p></div></div>
        </section>

        {error && <p role="alert" className="mb-6 rounded-xl border border-red-300/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</p>}
        {message && <p role="status" className="mb-6 rounded-xl border border-emerald-300/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">{message}</p>}

        <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <section className="rounded-[28px] border border-white/10 bg-[#f4f0e8] p-6 text-slate-900 shadow-2xl">
            <div className="flex items-center gap-3"><div className="rounded-2xl bg-amber-200 p-3 text-amber-900"><ClipboardList className="h-5 w-5" /></div><div><p className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-700">Buyer brief</p><h2 className="text-2xl font-bold">List a residue need</h2></div></div>
            <form onSubmit={submitNeed} className="mt-6 space-y-4">
              <label className="block text-sm font-semibold">Crop needed<select value={form.cropType} onChange={setField('cropType')} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3">{crops.map((crop) => <option key={crop}>{crop}</option>)}</select></label>
              <label className="block text-sm font-semibold">Residue type<select value={form.residueType} onChange={setField('residueType')} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3">{residueTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
              <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-semibold">Preferred region<input value={form.region} onChange={setField('region')} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3" placeholder="State or district" /></label><label className="block text-sm font-semibold">Quantity needed<input value={form.quantity} onChange={setField('quantity')} type="number" min="1" required className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3" placeholder="Tons needed" /></label></div>
              <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-semibold">Use case<select value={form.useCase} onChange={setField('useCase')} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3"><option>Biomass processing</option><option>Compost and soil inputs</option><option>Animal feed</option><option>Bioenergy</option></select></label><label className="block text-sm font-semibold">Timing<select value={form.urgency} onChange={setField('urgency')} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3"><option>This week</option><option>This month</option><option>Next season</option></select></label></div>
              <label className="block text-sm font-semibold">Note for farmer network<textarea value={form.notes} onChange={setField('notes')} className="mt-2 min-h-24 w-full rounded-xl border border-slate-300 bg-white px-3 py-3" placeholder="Quality, pickup, or processing requirements" /></label>
              <button type="submit" disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#10252a] px-4 py-3 font-semibold text-white transition hover:bg-[#1c3c40] disabled:opacity-60"><Send className="h-4 w-4" />{saving ? 'Publishing…' : 'Publish buyer need'}</button>
            </form>
          </section>

          <section className="overflow-hidden rounded-[28px] border border-white/10 bg-white shadow-2xl"><div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 p-5 text-slate-900"><div><p className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-700">India sourcing map</p><h2 className="mt-1 text-2xl font-bold">Farmer crop networks</h2><p className="mt-1 text-sm text-slate-500">Crop availability is visible. Residue quantities remain private.</p></div><div className="flex flex-wrap gap-2">{['All', ...crops].map((crop) => <button type="button" key={crop} onClick={() => setCropFilter(crop)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${cropFilter === crop ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>{crop}{crop !== 'All' ? ` · ${cropCounts[crop] || 0}` : ''}</button>)}</div></div><div className="relative">{loading ? <div className="flex h-[500px] items-center justify-center text-slate-400">Loading farmer network…</div> : <BuyerFarmerMap farms={farms} cropFilter={cropFilter} />}</div></section>
        </div>

          <section className="mt-6 rounded-[28px] border border-amber-300/20 bg-[#182b2f] p-6"><div className="flex items-center gap-3"><Store className="h-5 w-5 text-amber-300" /><div><p className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-300">Choose your seller</p><h2 className="text-xl font-bold text-white">Available residue offers</h2></div></div><form onSubmit={placeOrder} className="mt-5 grid gap-4 lg:grid-cols-[1fr_140px_auto]"> <select value={selectedListing} onChange={(event) => setSelectedListing(event.target.value)} className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white">{sellers.map((seller, index) => <option className="text-slate-900" key={`${seller.id}-${index}`} value={seller.id}>{seller.sellerName} · {seller.name} · {seller.sellerPlace}, {seller.sellerState} · {seller.expectedDeliveryDays} days</option>)}</select><input value={orderQuantity} onChange={(event) => setOrderQuantity(event.target.value)} type="number" min="1" className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white" placeholder="Loads" /><button type="submit" disabled={saving || !sellers.length} className="flex items-center justify-center gap-2 rounded-xl bg-amber-300 px-5 py-3 text-sm font-bold text-slate-950 disabled:opacity-50"><Truck className="h-4 w-4" />{saving ? 'Placing…' : 'Order selected offer'}</button></form><div className="mt-4 grid gap-3 md:grid-cols-2">{sellers.map((seller, index) => <div key={`${seller.id}-${index}`} className="rounded-2xl border border-white/10 bg-black/10 p-4"><p className="font-semibold text-white">{seller.sellerName}</p><p className="mt-1 text-sm text-slate-300">{seller.name} · ₹{Number(seller.priceInr).toLocaleString('en-IN')} per load</p><p className="mt-2 text-xs text-slate-400">{seller.sellerPlace}, {seller.sellerState} · Expected in {seller.expectedDeliveryDays} days</p></div>)}</div></section>

        <section className="mt-6 rounded-[28px] border border-white/10 bg-white/5 p-6"><div className="flex items-center gap-3"><Truck className="h-5 w-5 text-sky-300" /><h2 className="text-xl font-bold text-white">Current order status</h2></div><div className="mt-4 grid gap-3 md:grid-cols-2">{orders.length ? orders.map((order, index) => <div key={`${order.id}-${index}`} className="rounded-2xl border border-white/10 bg-black/10 p-4"><div className="flex items-center justify-between gap-3"><p className="font-semibold text-white">{order.listingName || 'Residue order'}</p><span className="rounded-full bg-sky-300/10 px-2 py-1 text-xs font-semibold capitalize text-sky-200">{String(order.status).replaceAll('_', ' ')}</span></div><p className="mt-2 text-sm text-slate-300">Ordered from {order.sellerName}</p><p className="mt-1 text-sm text-slate-400">{order.sellerPlace}, {order.sellerState} · {order.quantity} load{order.quantity === 1 ? '' : 's'}</p><p className="mt-3 flex items-center gap-2 text-xs text-amber-200"><Clock className="h-4 w-4" /> Expected delivery: {new Date(order.expectedDeliveryAt).toLocaleDateString('en-IN')} ({order.expectedDeliveryDays} days)</p></div>) : <p className="text-sm text-slate-400">No orders yet. Choose a seller offer above to start sourcing.</p>}</div></section>

        <section className="mt-6 rounded-[28px] border border-white/10 bg-white/5 p-6"><div className="flex items-center gap-3"><ClipboardList className="h-5 w-5 text-amber-300" /><h2 className="text-xl font-bold text-white">Your live needs</h2></div><div className="mt-4 grid gap-3 md:grid-cols-2">{needs.length ? needs.map((need) => <div key={need.id} className="rounded-2xl border border-white/10 bg-black/10 p-4"><div className="flex items-center justify-between gap-3"><p className="font-semibold text-white">{need.residueType}</p><span className="rounded-full bg-amber-300/10 px-2 py-1 text-xs text-amber-200">{need.urgency}</span></div><p className="mt-2 text-sm text-slate-300">{need.cropType} · {need.quantity} tons · {need.region}</p><p className="mt-2 text-xs text-slate-400">{need.useCase}</p></div>) : <p className="text-sm text-slate-400">No needs listed yet. Create your first buyer brief above.</p>}</div></section>
      </div>
    </main>
  )
}
/* Legacy buyer dashboard implementation retained temporarily for reference.
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, BadgeIndianRupee, RefreshCw, ShoppingBasket, Plus } from 'lucide-react'
import SupportDock from '@/components/SupportDock'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { apiUrl } from '@/lib/api'
import FarmMapCard from '@/components/farmer/FarmMapCard'

export default function BuyerDashboard() {
  const [prices, setPrices] = useState([])
  const [status, setStatus] = useState('Loading government mandi feed...')
  const [farm, setFarm] = useState(null)
  const [showNeedForm, setShowNeedForm] = useState(false)
  const [need, setNeed] = useState({ residueType: 'Paddy straw', quantityQuintals: '', qualityGrade: 'Standard', moisturePercent: '', pickupDistrict: '', priceInr: '', notes: '' })
  const [needMessage, setNeedMessage] = useState('')

  async function loadPrices() {
    setStatus('Loading government mandi feed...')
    try {
      const response = await fetch(apiUrl('/api/mandi'))
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Mandi feed unavailable')
      setPrices(Array.isArray(data.records) ? data.records : [])
      setStatus(data.source === 'government' ? 'Government APMC feed connected' : 'Government mandi feed is not configured')
    } catch (error) {
      setPrices([])
      setStatus(error.message)
    }
  }

  useEffect(() => {
    loadPrices()
    fetch(apiUrl('/api/farms')).then((response) => response.ok ? response.json() : []).then((farms) => setFarm(farms[0] || null)).catch(() => {})
  }, [])

  async function publishNeed(event) {
    event.preventDefault()
    setNeedMessage('')
    const response = await fetch(apiUrl('/api/marketplace/listings'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sellerId: 'buyer@agrovani.in', name: `${need.residueType} residue requirement`, category: 'Residue', listingType: 'residue_need', stockUnits: 0, ...need }) })
    const data = await response.json()
    if (!response.ok) return setNeedMessage(data.error || 'Unable to publish residue requirement')
    setNeedMessage('Requirement published. Farmers will receive a notification in their dashboard.')
    setShowNeedForm(false)
  }

  return (
    <main className="page-seller min-h-screen p-4 text-slate-100 md:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-[24px] border border-white/15 bg-white/10 p-4 backdrop-blur-xl"><Link href="/login" className="flex items-center gap-2 text-sm font-semibold"><ArrowLeft className="h-4 w-4" /> Buyer Console</Link><div className="flex items-center gap-3"><LanguageSwitcher /><Link href="/plans" className="glass-btn">Our Plans</Link></div></header>
        <div className="grid gap-5 md:grid-cols-3"><div className="glass-card border-white/15 bg-white/10"><ShoppingBasket className="h-6 w-6 text-sky-300" /><p className="mt-5 text-xs uppercase tracking-[0.25em] text-slate-300">Supply workspace</p><p className="mt-2 text-3xl font-bold">Farmer network</p></div><div className="glass-card border-white/15 bg-white/10"><BadgeIndianRupee className="h-6 w-6 text-emerald-300" /><p className="mt-5 text-xs uppercase tracking-[0.25em] text-slate-300">Price source</p><p className="mt-2 text-3xl font-bold">APMC / Agmarknet</p></div><div className="glass-card border-white/15 bg-white/10"><p className="text-xs uppercase tracking-[0.25em] text-slate-300">Data status</p><p className="mt-4 text-lg font-semibold text-amber-200">{status}</p></div></div>
        <section className="glass-card mt-6 border-white/15 bg-white/10"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.25em] text-sky-300">Live market</p><h1 className="mt-2 text-3xl font-bold">Government mandi prices</h1></div><button onClick={loadPrices} className="glass-btn"><RefreshCw className="mr-2 h-4 w-4" /> Refresh</button></div>{prices.length ? <div className="mt-6 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-xs uppercase tracking-wider text-slate-400"><tr><th className="pb-3">Commodity</th><th className="pb-3">Market</th><th className="pb-3">Min</th><th className="pb-3">Modal</th><th className="pb-3">Max</th></tr></thead><tbody>{prices.map((item, index) => <tr key={`${item.commodity}-${item.market}-${index}`} className="border-t border-white/10"><td className="py-3 font-semibold">{item.commodity}</td><td className="py-3">{item.market}</td><td className="py-3">₹{item.minPrice}</td><td className="py-3 text-emerald-300">₹{item.modalPrice}</td><td className="py-3">₹{item.maxPrice}</td></tr>)}</tbody></table></div> : <div className="mt-6 rounded-2xl border border-dashed border-white/20 bg-black/10 p-6 text-sm text-slate-300">No prices are shown until a government API endpoint and key are configured. This dashboard does not use mock market values.</div>}</section>
        <section className="glass-card mt-6 border-white/15 bg-white/10"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-300">Farmer supply request</p><h2 className="mt-2 text-2xl font-bold">Post a residue need</h2></div><button onClick={() => setShowNeedForm((value) => !value)} className="glass-btn"><Plus className="mr-2 h-4 w-4" /> New requirement</button></div>{needMessage && <p className="mt-4 rounded-xl bg-emerald-300/15 px-3 py-2 text-sm text-emerald-100">{needMessage}</p>}{showNeedForm && <form onSubmit={publishNeed} className="mt-5 grid gap-3 md:grid-cols-2"><select value={need.residueType} onChange={(event) => setNeed({ ...need, residueType: event.target.value })} className="rounded-xl border border-white/15 bg-slate-900/60 px-3 py-3 text-sm text-white"><option>Paddy straw</option><option>Wheat straw</option><option>Corn residue</option><option>Cotton stalk</option><option>Mixed biomass</option></select><input required type="number" min="0.1" step="0.1" value={need.quantityQuintals} onChange={(event) => setNeed({ ...need, quantityQuintals: event.target.value })} placeholder="Quantity in quintals" className="rounded-xl border border-white/15 bg-white/10 px-3 py-3 text-sm text-white placeholder:text-slate-400" /><select value={need.qualityGrade} onChange={(event) => setNeed({ ...need, qualityGrade: event.target.value })} className="rounded-xl border border-white/15 bg-slate-900/60 px-3 py-3 text-sm text-white"><option>Standard</option><option>Premium</option><option>Industrial</option></select><input type="number" min="0" max="100" step="0.1" value={need.moisturePercent} onChange={(event) => setNeed({ ...need, moisturePercent: event.target.value })} placeholder="Maximum moisture %" className="rounded-xl border border-white/15 bg-white/10 px-3 py-3 text-sm text-white placeholder:text-slate-400" /><input required value={need.pickupDistrict} onChange={(event) => setNeed({ ...need, pickupDistrict: event.target.value })} placeholder="Pickup district" className="rounded-xl border border-white/15 bg-white/10 px-3 py-3 text-sm text-white placeholder:text-slate-400" /><input required type="number" min="1" value={need.priceInr} onChange={(event) => setNeed({ ...need, priceInr: event.target.value })} placeholder="Offer price per unit" className="rounded-xl border border-white/15 bg-white/10 px-3 py-3 text-sm text-white placeholder:text-slate-400" /><textarea value={need.notes} onChange={(event) => setNeed({ ...need, notes: event.target.value })} placeholder="Pickup timing, packaging, contamination limits" className="min-h-24 rounded-xl border border-white/15 bg-white/10 px-3 py-3 text-sm text-white placeholder:text-slate-400 md:col-span-2" /><button className="pill-dark md:col-span-2">Publish requirement to farmers</button></form>}</section>
        <section className="mt-6"><div className="mb-3"><p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-300">Buyer logistics</p><h2 className="mt-2 text-2xl font-bold">Live Crop Position Tracking</h2><p className="mt-2 text-sm text-slate-300">View real farmer or driver coordinates when they explicitly share GPS through the live relay.</p></div><FarmMapCard lat={farm?.latitude} lon={farm?.longitude} mode="residue" title="Live Crop Position Tracking" /></section>
      </div>
      <SupportDock role="buyer" />
    </main>
  )
}
*/
