'use client'

import { useEffect, useState } from 'react'
import { Clock3, MapPin, Radio, Truck } from 'lucide-react'

const cityOptions = {
  Patiala: { state: 'Punjab', depot: 'Patiala Depot', hub: 'Patiala Buyer Hub' },
  Jaipur: { state: 'Rajasthan', depot: 'Jaipur Agri Depot', hub: 'Jaipur Buyer Hub' },
  Indore: { state: 'Madhya Pradesh', depot: 'Indore Agri Depot', hub: 'Indore Buyer Hub' },
  Nagpur: { state: 'Maharashtra', depot: 'Nagpur Crop Depot', hub: 'Nagpur Buyer Hub' },
  Bengaluru: { state: 'Karnataka', depot: 'Bengaluru Farm Depot', hub: 'Bengaluru Buyer Hub' },
}

const routePoints = [
  [118, 222],
  [170, 188],
  [224, 202],
  [286, 158],
  [344, 174],
  [411, 124],
  [486, 146],
  [554, 94],
]

function routePosition(progress) {
  const scaled = (progress / 100) * (routePoints.length - 1)
  const index = Math.min(routePoints.length - 2, Math.floor(scaled))
  const local = scaled - index
  const start = routePoints[index]
  const end = routePoints[index + 1]
  return [start[0] + (end[0] - start[0]) * local, start[1] + (end[1] - start[1]) * local]
}

const routePath = `M ${routePoints.map(([x, y]) => `${x} ${y}`).join(' L ')}`

export default function LiveDriverTracker() {
  const [progress, setProgress] = useState(42)
  const [city, setCity] = useState('Patiala')

  useEffect(() => {
    const timer = window.setInterval(() => {
      setProgress((current) => (current >= 94 ? 18 : current + 1))
    }, 1600)
    return () => window.clearInterval(timer)
  }, [])

  const eta = Math.max(2, Math.ceil((100 - progress) / 9))
  const status = progress > 78 ? 'Arriving at buyer hub' : progress > 55 ? 'Passing farmer collection point' : 'En route to farmer'
  const [driverX, driverY] = routePosition(progress)
  const selectedCity = cityOptions[city]

  return (
    <section className="mt-6 overflow-hidden rounded-[28px] border border-slate-800 bg-[#101a2c] p-6 text-white shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-300">Operations control</p>
          <h2 className="mt-2 text-2xl font-bold">Live driver tracking</h2>
          <p className="mt-1 text-sm text-slate-400">A simple delivery-style view of the active route.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-300">City
            <select value={city} onChange={(event) => setCity(event.target.value)} className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs text-white outline-none">
              {Object.keys(cityOptions).map((option) => <option className="text-slate-900" key={option}>{option}</option>)}
            </select>
          </label>
          <span className="flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300"><Radio className="h-3.5 w-3.5 animate-pulse" /> Live GPS demo</span>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="relative min-h-[270px] overflow-hidden rounded-[24px] border border-white/10 bg-[#17243b] p-3">
          <svg viewBox="0 0 680 300" className="h-full min-h-[270px] w-full" role="img" aria-label="Mock India live driver map">
            <defs>
              <linearGradient id="indiaLand" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#203d52" /><stop offset="1" stopColor="#15283c" /></linearGradient>
              <filter id="driverGlow"><feGaussianBlur stdDeviation="5" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>
            <path d="M184 34L238 22 286 39 337 29 386 48 438 43 487 68 522 103 559 123 574 157 550 177 564 211 535 235 509 229 487 260 448 247 420 277 382 264 351 286 319 265 286 275 261 247 227 239 214 210 184 190 169 154 177 119 159 88Z" fill="url(#indiaLand)" stroke="#42627b" strokeWidth="2" opacity="0.95" />
            <path d="M201 78Q286 111 347 76T493 111M178 132Q276 163 355 133T548 164M224 194Q316 218 382 181T530 203M270 45Q283 115 264 177T310 263M390 51Q373 123 406 182T454 250" fill="none" stroke="#304c63" strokeWidth="2" strokeDasharray="5 7" />
            <path d={routePath} fill="none" stroke="#08121f" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
            <path d={routePath} fill="none" stroke="#22d3ee" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="10 8" />
            <circle cx="118" cy="222" r="8" fill="#34d399" stroke="#d1fae5" strokeWidth="3" />
            <circle cx="554" cy="94" r="8" fill="#fbbf24" stroke="#fef3c7" strokeWidth="3" />
            <g transform={`translate(${driverX - 13} ${driverY - 13})`} filter="url(#driverGlow)">
              <rect width="26" height="22" rx="7" fill="#67e8f9" stroke="#ecfeff" strokeWidth="2" />
              <path d="M5 16h16M8 6h10l4 6H4z" fill="#0e7490" />
              <circle cx="7" cy="21" r="3" fill="#020617" /><circle cx="19" cy="21" r="3" fill="#020617" />
            </g>
            <text x="88" y="250" fill="#cbd5e1" fontSize="11" fontWeight="700">{selectedCity.depot.toUpperCase()}</text>
            <text x="523" y="76" fill="#fde68a" fontSize="11" fontWeight="700">BUYER HUB</text>
            <text x="275" y="293" fill="#94a3b8" fontSize="10" letterSpacing="2">{city.toUpperCase()} · INDIA · LIVE ROAD DEMO</text>
          </svg>
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Driver</p><p className="mt-2 text-lg font-bold">Sandeep Kumar</p><p className="mt-1 text-sm text-slate-400">PB-07-AX 7312 · AG-2041 · {selectedCity.state}</p></div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Current status</p><p className="mt-2 font-semibold text-cyan-200">{status}</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-cyan-300 transition-all duration-700" style={{ width: `${progress}%` }} /></div></div>
          <div className="grid grid-cols-2 gap-3"><div className="rounded-2xl border border-white/10 bg-white/5 p-4"><Clock3 className="h-4 w-4 text-amber-300" /><p className="mt-2 text-2xl font-bold">{eta} min</p><p className="text-xs text-slate-400">ETA</p></div><div className="rounded-2xl border border-white/10 bg-white/5 p-4"><MapPin className="h-4 w-4 text-emerald-300" /><p className="mt-2 text-2xl font-bold">12.4</p><p className="text-xs text-slate-400">km remaining</p></div></div>
        </div>
      </div>
    </section>
  )
}
