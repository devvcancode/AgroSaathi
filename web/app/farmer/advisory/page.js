'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, ExternalLink, Loader2, Search, Send, TrendingDown, TrendingUp } from 'lucide-react'

const crops = ['Rice', 'Wheat', 'Cotton', 'Soybean']

function money(value) { return value == null ? 'insufficient data' : `₹${Math.round(value).toLocaleString('en-IN')}` }
function statusTone(value) { return value === 'High' || value === 'Stale data' ? 'text-red-700 bg-red-50' : value === 'Medium' ? 'text-amber-700 bg-amber-50' : 'text-emerald-700 bg-emerald-50' }

export default function AdvisoryPage() {
  const [crop, setCrop] = useState('Rice')
  const [area, setArea] = useState('5')
  const [state, setState] = useState('Punjab')
  const [market, setMarket] = useState('')
  const [yieldData, setYieldData] = useState(null)
  const [mandiData, setMandiData] = useState(null)
  const [mspData, setMspData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reportLoading, setReportLoading] = useState(false)
  const [shareText, setShareText] = useState('')

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const [yieldResponse, mandiResponse] = await Promise.all([
        fetch('/api/yield-prediction', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ crop, areaInAcres: Number(area), soilPh: 6.4, nitrogenKgPerHa: 95, rainfallMm: 640 }) }),
        fetch(`/api/mandi?commodity=${encodeURIComponent(crop)}&state=${encodeURIComponent(state)}${market ? `&market=${encodeURIComponent(market)}` : ''}`),
      ])
      const [nextYield, nextMandi] = await Promise.all([yieldResponse.json(), mandiResponse.json()])
      if (!yieldResponse.ok) throw new Error(nextYield.error || 'Yield estimate unavailable')
      setYieldData(nextYield)
      setMandiData(nextMandi)
      if (nextMandi.latestModalPrice != null) {
        const mspResponse = await fetch(`/api/msp?commodity=${encodeURIComponent(crop)}&modalPrice=${nextMandi.latestModalPrice}`)
        setMspData(await mspResponse.json())
      } else setMspData(null)
    } catch (loadError) {
      setError(loadError.message || 'Unable to load advisory data')
    } finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [crop, state, market])

  async function downloadReport() {
    setReportLoading(true)
    try {
      const response = await fetch('/api/report/pdf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        farmName: 'My farm', crop, areaInAcres: area,
        yieldRange: yieldData ? `${yieldData.predictedYieldRangeTonsPerAcre.lower}-${yieldData.predictedYieldRangeTonsPerAcre.upper} t/acre` : null,
        estimatedRevenueGain: yieldData?.treatmentScenarioYieldTonsPerAcre && yieldData?.baseline?.pricePerQuintal ? (yieldData.treatmentScenarioYieldTonsPerAcre - yieldData.expectedYieldTonsPerAcre) * 10 * yieldData.baseline.pricePerQuintal * Number(area) : null,
        productCost: yieldData?.baseline?.costPerAcre ? yieldData.baseline.costPerAcre * Number(area) : null,
        netProfitEstimate: null, mspComparison: mspData?.premiumDiscountPercent == null ? 'insufficient data' : `${mspData.premiumDiscountPercent}% vs MSP`,
        dataTimestamp: mandiData?.latest?.observedAt || new Date().toISOString(), assumptions: yieldData?.assumptions,
      }) })
      if (!response.ok) throw new Error('Report could not be generated')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a'); link.href = url; link.download = 'agrovani-farm-report.pdf'; link.click(); URL.revokeObjectURL(url)
    } catch (reportError) { setError(reportError.message) } finally { setReportLoading(false) }
  }

  async function prepareShare() {
    const response = await fetch('/api/report/whatsapp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ crop, market: mandiData?.latest?.market, yieldRange: yieldData ? `${yieldData.predictedYieldRangeTonsPerAcre.lower}-${yieldData.predictedYieldRangeTonsPerAcre.upper} t/acre` : null, estimatedRevenueGain: null, productCost: null, netProfitEstimate: null, mspComparison: mspData?.premiumDiscountPercent == null ? 'insufficient data' : `${mspData.premiumDiscountPercent}% vs MSP`, dataTimestamp: mandiData?.latest?.observedAt }) })
    const data = await response.json(); setShareText(data.text || '')
  }

  return <main className="min-h-screen px-4 py-6 sm:px-8">
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/farmer/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"><ArrowLeft className="h-4 w-4" /> Farmer dashboard</Link>
        <span className="rounded-full bg-emerald-700 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white">Farm advisory</span>
      </header>
      <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-700">Yield and market view</p>
          <h1 className="mt-3 max-w-2xl text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">Make today&apos;s farm decision with clearer numbers.</h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">A plain-language estimate for your crop and a fresh mandi view. Missing or old data is shown clearly instead of guessed.</p>
        </div>
        <div className="glass-card">
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="text-sm font-semibold text-slate-700">Crop<select value={crop} onChange={(event) => setCrop(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal">{crops.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="text-sm font-semibold text-slate-700">Area (acres)<input value={area} onChange={(event) => setArea(event.target.value)} type="number" min="0.1" className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal" /></label>
            <label className="text-sm font-semibold text-slate-700">State<select value={state} onChange={(event) => setState(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal"><option>Punjab</option><option>Madhya Pradesh</option><option>Maharashtra</option></select></label>
          </div>
        </div>
      </section>
      {error && <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
      {loading ? <div className="glass-card mt-6 flex items-center gap-3"><Loader2 className="h-5 w-5 animate-spin" /> Loading your advisory...</div> : <>
        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="glass-card">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-slate-500">Yield estimate</p><h2 className="mt-2 text-2xl font-bold text-slate-900">{yieldData.expectedYieldTonsPerAcre} t/acre expected</h2></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${statusTone(yieldData.riskLevel)}`}>{yieldData.riskLevel} uncertainty</span></div>
            <div className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Predicted range</p><p className="mt-2 text-xl font-bold">{yieldData.predictedYieldRangeTonsPerAcre.lower}-{yieldData.predictedYieldRangeTonsPerAcre.upper} t</p></div><div className="rounded-xl bg-emerald-50 p-4"><p className="text-xs text-emerald-700">Treatment scenario</p><p className="mt-2 text-xl font-bold text-emerald-800">+{yieldData.estimatedTreatmentAdvantagePercent}%</p></div></div>
            <p className="mt-4 text-sm text-slate-600">Confidence score: <b>{Math.round(yieldData.confidenceScore * 100)}%</b>. This is an observational model, not proof that treatment caused a change.</p>
            <details className="mt-4 text-sm text-slate-600"><summary className="cursor-pointer font-semibold text-slate-900">Advanced details</summary><p className="mt-3">Model: {yieldData.model}. {yieldData.modelStatus}</p><ul className="mt-2 list-disc pl-5">{yieldData.assumptions.map((item) => <li key={item}>{item}</li>)}</ul></details>
          </div>
          <div className="glass-card">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-slate-500">Mandi price tracker</p><h2 className="mt-2 text-2xl font-bold text-slate-900">{mandiData.latestModalPrice == null ? 'insufficient data' : money(mandiData.latestModalPrice)} / quintal</h2></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${statusTone(mandiData.dataFreshness?.label)}`}>{mandiData.dataFreshness?.label}</span></div>
            <div className="mt-6 flex flex-wrap gap-2"><label className="sr-only" htmlFor="market">Search market</label><div className="flex min-w-[220px] flex-1 items-center rounded-xl border border-slate-200 bg-white px-3"><Search className="h-4 w-4 text-slate-400" /><input id="market" value={market} onChange={(event) => setMarket(event.target.value)} placeholder="Market, e.g. Patiala" className="w-full border-0 px-2 py-3 text-sm outline-none" /></div></div>
            <div className="mt-5 rounded-xl bg-slate-50 p-4">{mspData?.message ? <p className="text-sm text-slate-600">MSP comparison: insufficient data</p> : <><p className="text-sm text-slate-500">MSP comparison</p><p className="mt-1 flex items-center gap-2 text-lg font-bold">{mspData.premiumDiscountPercent >= 0 ? <TrendingUp className="h-5 w-5 text-emerald-600" /> : <TrendingDown className="h-5 w-5 text-amber-600" />}{Math.abs(mspData.premiumDiscountPercent)}% {mspData.premiumDiscountPercent >= 0 ? 'premium' : 'discount'} · {mspData.signal}</p><p className="mt-1 text-xs text-slate-500">Confidence {Math.round(mspData.confidenceScore * 100)}%. Soft recommendation only, not financial advice.</p></>}</div>
            <p className="mt-4 text-xs text-slate-500">Source: {mandiData.source.label}</p>
          </div>
        </section>
        <section className="mt-6 flex flex-wrap gap-3"><button onClick={downloadReport} disabled={reportLoading} className="pill-dark"><Download className="mr-2 h-4 w-4" />{reportLoading ? 'Preparing PDF...' : 'Download farm report'}</button><button onClick={prepareShare} className="pill-outline"><Send className="mr-2 h-4 w-4" />Prepare WhatsApp text</button><a href="https://agmarknet.gov.in/" target="_blank" rel="noreferrer" className="pill-outline"><ExternalLink className="mr-2 h-4 w-4" />Official market source</a></section>
        {shareText && <textarea readOnly value={shareText} aria-label="WhatsApp share text" className="mt-4 min-h-40 w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700" />}
      </>}
    </div>
  </main>
}
