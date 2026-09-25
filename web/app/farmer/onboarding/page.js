'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Search, Save, ArrowLeft, ArrowRight, CheckCircle2, MapPin, Sprout } from 'lucide-react'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { apiUrl } from '@/lib/api'

const CROPS = ['Rice', 'Wheat', 'Corn', 'Cotton', 'Soybean']

const EMPTY = {
  name: '', village: '', district: '', state: '',
  cropType: 'Rice', areaInAcres: 5, soilPh: 6.5, nitrogenKgPerHa: 100,
  latitude: 20.5937, longitude: 78.9629, locale: 'en',
}

export default function App() {
  const router = useRouter()
  const { locale, t } = useLanguage()
  const copy = t.onboarding
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(EMPTY)
  const [geoResults, setGeoResults] = useState([])
  const [geoLoading, setGeoLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    try {
      const cached = localStorage.getItem('fv_onboarding')
      if (cached) setForm({ ...EMPTY, ...JSON.parse(cached) })
    } catch (e) {}
  }, [])

  useEffect(() => setForm((current) => ({ ...current, locale })), [locale])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  async function geocode() {
    if (!form.village) return
    setGeoLoading(true)
    try {
      const res = await fetch(apiUrl(`/api/geocode?query=${encodeURIComponent(form.village)}`))
      const data = await res.json()
      setGeoResults(data.results || [])
    } finally {
      setGeoLoading(false)
    }
  }

  function pickGeo(r) {
    set('latitude', r.latitude)
    set('longitude', r.longitude)
    setGeoResults([])
  }

  function saveOffline() {
    localStorage.setItem('fv_onboarding', JSON.stringify(form))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function finish() {
    setSubmitting(true)
    setSubmitError('')
    try {
      const res = await fetch(apiUrl('/api/farms'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok || !data.id) throw new Error(data.detail || data.error || 'Unable to save your farm')
      localStorage.setItem('fv_farmId', data.id)
      localStorage.setItem('fv_onboarding', JSON.stringify(form))
      router.push('/farmer/dashboard')
    } catch (error) {
      setSubmitError(error.message || 'Unable to save your farm. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="page-onboarding min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex w-full items-center justify-between rounded-[24px] border border-white/60 bg-white/45 px-6 py-4 shadow-sm backdrop-blur-md">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" /> AgroVani
          </Link>
          <LanguageSwitcher />
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`h-2 w-10 rounded-full ${step >= s ? 'bg-slate-900' : 'bg-slate-300/80'}`} />
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.45fr_0.95fr]">
          <div className="glass-panel rounded-[32px] p-8 md:p-10">
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">{copy.title}</h1>
              <p className="mt-2 text-sm font-medium text-slate-600">{copy.step(step)}</p>
            </div>

            {step === 1 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">{copy.fullName}</Label>
                  <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder={copy.nameExample} className="h-12 rounded-xl border border-white/70 bg-white/60 px-4 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10" />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">{copy.village}</Label>
                  <div className="flex gap-3">
                    <Input value={form.village} onChange={(e) => set('village', e.target.value)} placeholder={copy.searchVillage} className="h-12 flex-1 rounded-xl border border-white/70 bg-white/60 px-4 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10" />
                    <button type="button" onClick={geocode} className="glass-btn h-12 shrink-0 rounded-xl px-4 text-sm font-semibold text-slate-800">
                      <Search className="mr-1 h-4 w-4" /> {geoLoading ? '...' : copy.locate}
                    </button>
                  </div>
                  {geoResults.length > 0 && (
                    <div className="mt-2 rounded-xl border border-white/80 bg-white/70 shadow-sm">
                      {geoResults.map((r, i) => (
                        <button key={i} onClick={() => pickGeo(r)} className="flex w-full items-start gap-2 border-b border-slate-100 px-3 py-2 text-left text-sm last:border-0 hover:bg-slate-50">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                          <span className="text-slate-700">{r.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-slate-500">{copy.locatedAt} {Number(form.latitude).toFixed(3)}, {Number(form.longitude).toFixed(3)}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">{copy.district}</Label>
                    <Input value={form.district} onChange={(e) => set('district', e.target.value)} placeholder="e.g. Nashik" className="h-12 rounded-xl border border-white/70 bg-white/60 px-4 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">State / UT</Label>
                    <Input value={form.state} onChange={(e) => set('state', e.target.value)} placeholder="e.g. Maharashtra" className="h-12 rounded-xl border border-white/70 bg-white/60 px-4 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10" />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-slate-700">{copy.primaryCrop}</Label>
                  <div className="flex flex-wrap gap-3">
                    {CROPS.map((c) => (
                      <button key={c} type="button" onClick={() => set('cropType', c)} className={`rounded-full px-5 py-2.5 text-sm font-medium transition ${form.cropType === c ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'border border-white/80 bg-white/60 text-slate-700 hover:bg-white/80'}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">{copy.area}</Label>
                    <Input type="number" value={form.areaInAcres} onChange={(e) => set('areaInAcres', e.target.value)} className="h-12 rounded-xl border border-white/70 bg-white/60 px-4 text-slate-900 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">{copy.soilPh}</Label>
                    <Input type="number" step="0.1" value={form.soilPh} onChange={(e) => set('soilPh', e.target.value)} className="h-12 rounded-xl border border-white/70 bg-white/60 px-4 text-slate-900 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">{copy.nitrogen}</Label>
                  <Input type="number" value={form.nitrogenKgPerHa} onChange={(e) => set('nitrogenKgPerHa', e.target.value)} className="h-12 rounded-xl border border-white/70 bg-white/60 px-4 text-slate-900 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10" />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">{copy.review}</p>
                <div className="grid gap-3 rounded-2xl bg-white/60 p-4 text-sm shadow-inner sm:grid-cols-2">
                  <div><span className="text-slate-400">{copy.name}</span><p className="mt-1 font-semibold text-slate-900">{form.name || '—'}</p></div>
                  <div><span className="text-slate-400">{copy.villageShort}</span><p className="mt-1 font-semibold text-slate-900">{form.village || '—'}</p></div>
                  <div><span className="text-slate-400">District</span><p className="mt-1 font-semibold text-slate-900">{form.district}</p></div>
                  <div><span className="text-slate-400">{copy.crop}</span><p className="mt-1 font-semibold text-slate-900">{form.cropType}</p></div>
                  <div><span className="text-slate-400">{copy.area}</span><p className="mt-1 font-semibold text-slate-900">{form.areaInAcres} {copy.acres}</p></div>
                  <div><span className="text-slate-400">Soil pH / N</span><p className="mt-1 font-semibold text-slate-900">{form.soilPh} / {form.nitrogenKgPerHa}</p></div>
                </div>
              </div>
            )}

            <div className="mt-8 flex items-center justify-between border-t border-white/60 pt-6">
              <button type="button" className="flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900 disabled:opacity-50" disabled={step === 1} onClick={() => setStep((s) => s - 1)}>
                <ArrowLeft className="h-4 w-4" /> {copy.back}
              </button>

              {step < 3 ? (
                <button type="button" className="pill-dark" onClick={() => setStep((s) => s + 1)}>
                  {copy.next} <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              ) : (
                <button type="button" className="pill-dark" onClick={finish} disabled={submitting}>
                  {submitting ? copy.saving : copy.finishDashboard}
                </button>
              )}
            </div>
            {submitError && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{submitError}</p>}
          </div>

          <div className="space-y-5">
            <div className="glass-panel rounded-[32px] p-8">
              <div className="mb-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.28em] text-slate-500">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                {copy.livePreview}
              </div>

              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <Sprout className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-900">{form.name || copy.yourName}</p>
                  <p className="text-sm text-slate-500">{form.village || 'Village'}, {form.district}</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-white/60 p-4 shadow-sm">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">{copy.crop}</p>
                  <p className="mt-2 text-lg font-bold text-slate-900">{form.cropType}</p>
                </div>
                <div className="rounded-2xl bg-white/60 p-4 shadow-sm">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">{copy.area}</p>
                  <p className="mt-2 text-lg font-bold text-slate-900">{form.areaInAcres} {copy.acres}</p>
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-[32px] p-8">
              <h4 className="text-xl font-bold text-slate-900">{copy.saveOffline}</h4>
              <p className="mt-2 text-sm text-slate-600">{copy.offlineText}</p>
              <Button onClick={saveOffline} variant="outline" className="mt-4 h-12 w-full rounded-xl border border-white/80 bg-white/60 text-slate-800 hover:bg-white">
                {saved ? <><CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" /> {copy.saved}</> : <><Save className="mr-2 h-4 w-4" /> {copy.saveOffline}</>}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
