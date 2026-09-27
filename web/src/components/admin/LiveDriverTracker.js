'use client'

import dynamic from 'next/dynamic'
import { Radio } from 'lucide-react'

const BuyerFarmerMap = dynamic(() => import('@/components/buyer/BuyerFarmerMap'), {
  ssr: false,
  loading: () => <div className="flex h-[430px] items-center justify-center text-slate-400">Loading driver map…</div>,
})

export default function LiveDriverTracker() {
  return (
    <section className="mt-6 overflow-hidden rounded-[20px] border border-slate-800 bg-[#101a2c] p-5 text-white shadow-[0_20px_50px_rgba(15,23,42,0.2)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-300">Operations control</p>
          <h2 className="mt-1 text-xl font-bold">Live driver tracking</h2>
        </div>
        <span className="flex items-center gap-2 text-xs font-semibold text-emerald-300"><Radio className="h-3.5 w-3.5 animate-pulse" /> GPS relay</span>
      </div>
      <BuyerFarmerMap farms={[]} cropFilter="All" />
    </section>
  )
}
