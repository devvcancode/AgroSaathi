'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wheat, IndianRupee, Calendar, Clock, TrendingUp, TrendingDown,
  Minus, CheckCircle2, AlertTriangle, ChevronRight, Sprout, Tractor, Package, Lock
} from 'lucide-react'

const CROP_DURATIONS = {
  Rice: { daysToHarvest: 120, residueFactor: 1.5 },
  Wheat: { daysToHarvest: 145, residueFactor: 1.3 },
  Maize: { daysToHarvest: 90, residueFactor: 1.1 },
  Cotton: { daysToHarvest: 180, residueFactor: 0.8 },
  Sugarcane: { daysToHarvest: 365, residueFactor: 0.5 },
  default: { daysToHarvest: 120, residueFactor: 1.2 },
}

function computeTimeline(sowingDate, cropType) {
  const crop = CROP_DURATIONS[cropType] || CROP_DURATIONS.default
  const sow = new Date(sowingDate)

  const addDays = (d, days) => {
    const result = new Date(d)
    result.setDate(result.getDate() + days)
    return result
  }

  const stages = [
    { label: 'Sowing', icon: Sprout, color: '#10b981', pct: 0, dayOffset: 0 },
    { label: 'Vegetative Growth', icon: Wheat, color: '#f59e0b', pct: 30, dayOffset: Math.round(crop.daysToHarvest * 0.3) },
    { label: 'Reproductive Stage', icon: Wheat, color: '#f97316', pct: 60, dayOffset: Math.round(crop.daysToHarvest * 0.6) },
    { label: 'Harvest Ready', icon: Tractor, color: '#7c3aed', pct: 95, dayOffset: crop.daysToHarvest - 5 },
    { label: 'Residue Collection', icon: Package, color: '#3b82f6', pct: 100, dayOffset: crop.daysToHarvest + 10 },
  ]

  const today = new Date()
  const elapsedDays = Math.floor((today - sow) / (1000 * 60 * 60 * 24))
  const totalDays = crop.daysToHarvest

  return stages.map((stage) => {
    const stageDate = addDays(sow, stage.dayOffset)
    const isPast = elapsedDays >= stage.dayOffset
    const isActive = elapsedDays >= stage.dayOffset && (stages[stages.indexOf(stage) + 1]?.dayOffset > elapsedDays || !stages[stages.indexOf(stage) + 1])
    return {
      ...stage,
      date: stageDate,
      isPast,
      isActive,
      daysFromNow: Math.round((stageDate - today) / (1000 * 60 * 60 * 24)),
    }
  })
}

function StageNode({ stage, index, isLast }) {
  return (
    <div className="relative flex gap-4">
      {/* Vertical connector line */}
      {!isLast && (
        <div
          className={`absolute left-[17px] top-9 h-full w-0.5 ${stage.isPast ? 'bg-emerald-300' : 'bg-slate-200'}`}
        />
      )}
      {/* Circle icon */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: index * 0.08 }}
        className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 shadow-sm ${
          stage.isActive
            ? 'border-violet-500 bg-violet-50 shadow-[0_0_0_6px_rgba(124,58,237,0.12)]'
            : stage.isPast
            ? 'border-emerald-400 bg-emerald-50'
            : 'border-slate-200 bg-white'
        }`}
      >
        <stage.icon
          className={`h-4 w-4 ${stage.isActive ? 'text-violet-600' : stage.isPast ? 'text-emerald-600' : 'text-slate-400'}`}
        />
        {stage.isActive && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-violet-400"
            animate={{ scale: [1, 1.4, 1], opacity: [1, 0, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
        )}
      </motion.div>

      <div className="flex-1 pb-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className={`text-sm font-bold ${stage.isActive ? 'text-violet-700' : stage.isPast ? 'text-slate-700' : 'text-slate-400'}`}>
              {stage.label}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              {new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(stage.date)}
            </p>
          </div>
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] ${
              stage.isActive
                ? 'bg-violet-100 text-violet-700'
                : stage.isPast
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            {stage.isActive ? 'Active' : stage.isPast ? 'Done' : stage.daysFromNow > 0 ? `In ${stage.daysFromNow}d` : 'Overdue'}
          </span>
        </div>
      </div>
    </div>
  )
}

function MandiPriceCompare({ mandiPricePerQtl, lockedPricePerQtl, quantity, onLockedPriceChange }) {
  const total = quantity > 0 && lockedPricePerQtl > 0 ? (lockedPricePerQtl * quantity) : 0
  const mandiTotal = quantity > 0 && mandiPricePerQtl > 0 ? (mandiPricePerQtl * quantity) : 0
  const diff = total - mandiTotal
  const pct = mandiTotal > 0 ? ((diff / mandiTotal) * 100).toFixed(1) : null

  return (
    <div className="rounded-[24px] border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur-md">
      <div className="flex items-center gap-2">
        <Lock className="h-4 w-4 text-violet-600" />
        <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-600">Price Lock-In vs Mandi</h4>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Current Mandi</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            ₹{mandiPricePerQtl > 0 ? mandiPricePerQtl.toLocaleString('en-IN') : '—'}
            <span className="ml-1 text-xs font-medium text-slate-400">/qtl</span>
          </p>
        </div>
        <div className="rounded-2xl bg-violet-50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-violet-400">Your Lock-In Price</p>
          <div className="mt-2 flex items-center gap-1">
            <span className="text-sm font-bold text-violet-600">₹</span>
            <input
              type="number"
              min="0"
              step="10"
              value={lockedPricePerQtl}
              onChange={(e) => onLockedPriceChange(Number(e.target.value))}
              className="w-full bg-transparent text-2xl font-bold text-violet-700 outline-none"
              placeholder="0"
            />
          </div>
          <p className="text-[10px] text-violet-400">/qtl</p>
        </div>
      </div>

      {diff !== 0 && pct && quantity > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-4 flex items-center justify-between rounded-2xl p-3 text-sm ${
            diff > 0 ? 'bg-emerald-50' : 'bg-red-50'
          }`}
        >
          <span className={`font-semibold ${diff > 0 ? 'text-emerald-700' : 'text-red-700'}`}>
            {diff > 0 ? (
              <TrendingUp className="mr-1 inline h-4 w-4" />
            ) : (
              <TrendingDown className="mr-1 inline h-4 w-4" />
            )}
            {diff > 0 ? '+' : ''}₹{Math.abs(diff).toLocaleString('en-IN')} vs mandi
          </span>
          <span className={`font-bold ${diff > 0 ? 'text-emerald-800' : 'text-red-800'}`}>
            {diff > 0 ? '+' : ''}{pct}%
          </span>
        </motion.div>
      )}

      {total > 0 && (
        <div className="mt-3 rounded-2xl bg-slate-900 p-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Projected Income ({quantity} qtl)</p>
          <p className="mt-1 text-2xl font-bold text-white">₹{total.toLocaleString('en-IN')}</p>
        </div>
      )}
    </div>
  )
}

export default function ResiduePanel({ farm, residue, onSave }) {
  const cropType = farm?.cropType || 'Rice'
  const cropDuration = CROP_DURATIONS[cropType] || CROP_DURATIONS.default

  const [profile, setProfile] = useState({
    residueType: 'Paddy straw',
    qualityGrade: 'Standard',
    quantityQuintals: farm?.areaInAcres ? Math.round(farm.areaInAcres * cropDuration.residueFactor * 10) : '',
    moisturePercent: '',
    packaging: 'Loose',
    pickupReadyDate: '',
    notes: '',
    sowingDate: '',
    lockedPricePerQtl: '',
    targetBuyer: 'Any',
  })

  const [saveMessage, setSaveMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [mandiPrice, setMandiPrice] = useState(0)
  const [activeSubTab, setActiveSubTab] = useState('timeline')

  const timeline = profile.sowingDate ? computeTimeline(profile.sowingDate, cropType) : []

  // Auto-load mandi price from residue API data
  useEffect(() => {
    if (residue?.mandiPricePerQtl) {
      setMandiPrice(residue.mandiPricePerQtl)
    } else {
      // Fallback demo price per residue type
      const prices = { 'Paddy straw': 280, 'Wheat straw': 320, 'Corn residue': 260, 'Cotton stalk': 310, 'Mixed biomass': 240 }
      setMandiPrice(prices[profile.residueType] || 280)
    }
  }, [residue, profile.residueType])

  async function handleSave(e) {
    e.preventDefault()
    if (!farm) return
    setSaving(true)
    try {
      const body = { ...profile, farmId: farm.id, cropType }
      const res = await fetch('/api/residue/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      setSaveMessage(res.ok ? '✓ Residue profile updated for buyers.' : data.error || 'Unable to save.')
      if (res.ok && onSave) onSave({ ...profile, ...data })
    } catch {
      setSaveMessage('Unable to save — please try again.')
    } finally {
      setSaving(false)
      setTimeout(() => setSaveMessage(''), 4000)
    }
  }

  const subTabs = [
    { key: 'timeline', label: 'Crop Timeline' },
    { key: 'profile', label: 'Residue Profile' },
    { key: 'pricing', label: 'Price Lock-In' },
  ]

  return (
    <div className="glass-card card-3d lg:col-span-3">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-600">Residue Management System</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">Tell buyers what your field has</h2>
          <p className="mt-1 text-sm text-slate-500">
            Track your crop lifecycle, calculate residue volume, and lock in your selling price vs the mandi rate.
          </p>
        </div>
        <AnimatePresence>
          {saveMessage && (
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-800"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {saveMessage}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Sub-tabs */}
      <div className="mt-5 flex gap-2 overflow-x-auto rounded-2xl bg-slate-100/80 p-1">
        {subTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveSubTab(tab.key)}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
              activeSubTab === tab.key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSave}>
        <AnimatePresence mode="wait">
          {/* ── Timeline Tab ── */}
          {activeSubTab === 'timeline' && (
            <motion.div
              key="timeline"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="mt-6 grid gap-6 lg:grid-cols-2"
            >
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                  <Sprout className="mr-1.5 inline h-3.5 w-3.5 text-emerald-500" />
                  When did you sow this crop?
                </label>
                <input
                  type="date"
                  value={profile.sowingDate}
                  onChange={(e) => setProfile({ ...profile, sowingDate: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
                <p className="mt-2 text-xs text-slate-400">
                  We'll auto-calculate stages for {cropType} ({cropDuration.daysToHarvest} days to harvest).
                </p>
              </div>

              <div className="rounded-[22px] border border-slate-200 bg-white/80 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Residue Volume Estimate</p>
                <p className="mt-3 text-4xl font-bold text-slate-900">
                  {farm?.areaInAcres
                    ? (farm.areaInAcres * cropDuration.residueFactor).toFixed(1)
                    : '—'}
                  <span className="ml-1 text-base font-medium text-slate-400">tons</span>
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Based on {farm?.areaInAcres ?? '—'} acres × {cropDuration.residueFactor} t/acre factor for {cropType}
                </p>
              </div>

              {/* Timeline stepper */}
              {timeline.length > 0 ? (
                <div className="lg:col-span-2">
                  <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                    <Calendar className="mr-1.5 inline h-3.5 w-3.5" />
                    Crop Stage Timeline
                  </p>
                  <div className="space-y-0">
                    {timeline.map((stage, i) => (
                      <StageNode key={stage.label} stage={stage} index={i} isLast={i === timeline.length - 1} />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-200 p-5 text-sm text-slate-400 lg:col-span-2">
                  <Calendar className="h-5 w-5 shrink-0" />
                  Enter your sowing date above to generate the full crop stage timeline.
                </div>
              )}
            </motion.div>
          )}

          {/* ── Profile Tab ── */}
          {activeSubTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3"
            >
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Residue Type</label>
                <select
                  value={profile.residueType}
                  onChange={(e) => setProfile({ ...profile, residueType: e.target.value })}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm shadow-sm"
                >
                  {['Paddy straw', 'Wheat straw', 'Corn residue', 'Cotton stalk', 'Mixed biomass'].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Quality Grade</label>
                <select
                  value={profile.qualityGrade}
                  onChange={(e) => setProfile({ ...profile, qualityGrade: e.target.value })}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm shadow-sm"
                >
                  {['Standard', 'Premium', 'Industrial'].map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Quantity (Quintals)</label>
                <input
                  required
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={profile.quantityQuintals}
                  onChange={(e) => setProfile({ ...profile, quantityQuintals: e.target.value })}
                  placeholder="e.g. 120"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm shadow-sm"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Moisture %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={profile.moisturePercent}
                  onChange={(e) => setProfile({ ...profile, moisturePercent: e.target.value })}
                  placeholder="e.g. 14"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm shadow-sm"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Packaging</label>
                <select
                  value={profile.packaging}
                  onChange={(e) => setProfile({ ...profile, packaging: e.target.value })}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm shadow-sm"
                >
                  {['Loose', 'Baled', 'Bagged'].map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Pickup Ready Date</label>
                <input
                  type="date"
                  value={profile.pickupReadyDate}
                  onChange={(e) => setProfile({ ...profile, pickupReadyDate: e.target.value })}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm shadow-sm"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Preferred Buyer</label>
                <select
                  value={profile.targetBuyer}
                  onChange={(e) => setProfile({ ...profile, targetBuyer: e.target.value })}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm shadow-sm"
                >
                  {['Any', 'Biomass Plant', 'Custom Hiring Center', 'Biogas Unit', 'Paper Mill'].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1 md:col-span-2 lg:col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Quality Notes / Access Instructions</label>
                <textarea
                  value={profile.notes}
                  onChange={(e) => setProfile({ ...profile, notes: e.target.value })}
                  placeholder="e.g. No contamination, field accessible from north gate, baler on-site available"
                  className="min-h-[80px] rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm shadow-sm"
                />
              </div>
            </motion.div>
          )}

          {/* ── Pricing Tab ── */}
          {activeSubTab === 'pricing' && (
            <motion.div
              key="pricing"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="mt-6 grid gap-5 lg:grid-cols-2"
            >
              <MandiPriceCompare
                mandiPricePerQtl={mandiPrice}
                lockedPricePerQtl={Number(profile.lockedPricePerQtl) || 0}
                quantity={Number(profile.quantityQuintals) || 0}
                onLockedPriceChange={(val) => setProfile({ ...profile, lockedPricePerQtl: val })}
              />

              <div className="space-y-4">
                <div className="rounded-[22px] border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.15em] text-amber-700">Live Mandi Reference</p>
                      <p className="mt-1 text-sm text-amber-800">
                        Current Agmarknet rate for <strong>{profile.residueType}</strong> is approximately{' '}
                        <strong>₹{mandiPrice}/qtl</strong>. Lock-in price above this to secure a premium from direct buyers.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[22px] border border-slate-200 bg-white p-4 space-y-3 text-sm text-slate-700">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Pricing Tips</p>
                  <div className="flex items-center gap-2"><ChevronRight className="h-3.5 w-3.5 text-emerald-500 shrink-0" /><span>Premium grade gets <strong>15–20%</strong> above mandi</span></div>
                  <div className="flex items-center gap-2"><ChevronRight className="h-3.5 w-3.5 text-emerald-500 shrink-0" /><span>Baled packaging commands <strong>+₹30–50/qtl</strong></span></div>
                  <div className="flex items-center gap-2"><ChevronRight className="h-3.5 w-3.5 text-emerald-500 shrink-0" /><span>Biomass plants accept wet residue at <strong>−10%</strong></span></div>
                  <div className="flex items-center gap-2"><ChevronRight className="h-3.5 w-3.5 text-emerald-500 shrink-0" /><span>Lock-in 2 weeks before harvest for best rates</span></div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
          <button
            type="submit"
            disabled={saving}
            className="pill-dark flex items-center gap-2 disabled:opacity-60"
          >
            {saving ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {saving ? 'Saving…' : 'Update Residue Availability'}
          </button>
          <span className="text-xs text-slate-400">
            Buyers browsing the marketplace will see your updated profile instantly.
          </span>
        </div>
      </form>
    </div>
  )
}
