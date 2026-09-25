'use client'

import Link from 'next/link'
import { ArrowLeft, Check, Leaf, Truck, Store } from 'lucide-react'

const plans = [
  { name: 'Farmer Field', price: 'Free', icon: Leaf, accent: 'emerald', items: ['Farm profile and crop cycle', 'Weather and field alerts', 'Personalized task recommendations', 'Residue earnings workspace'] },
  { name: 'Buyer Network', price: '₹499 / month', icon: Store, accent: 'sky', items: ['Live mandi price feed', 'Verified farmer supply', 'Purchase and pickup coordination', 'Order and settlement history'] },
  { name: 'Dispatch Partner', price: '₹999 / month', icon: Truck, accent: 'amber', items: ['Assigned pickup routes', 'Live driver location', 'Proof of pickup and delivery', 'Earnings and route history'] },
]

export default function PlansPage() {
  return (
    <main className="page-farmer min-h-screen p-4 text-white md:p-8">
      <div className="mx-auto max-w-6xl">
        <Link href="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-200"><ArrowLeft className="h-4 w-4" /> Back to login</Link>
        <header className="mx-auto max-w-3xl py-14 text-center"><p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-300">AgroVani access</p><h1 className="mt-4 text-4xl font-bold tracking-tight md:text-6xl">Our Plans</h1><p className="mt-5 text-lg leading-8 text-slate-300">Choose the workspace that fits your role in the farm-to-market network.</p></header>
        <div className="grid gap-5 lg:grid-cols-3">
          {plans.map(({ name, price, icon: Icon, accent, items }) => <section key={name} className="glass-card border-white/20 bg-white/10 text-white"><div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${accent === 'emerald' ? 'bg-emerald-400 text-slate-950' : accent === 'sky' ? 'bg-sky-300 text-slate-950' : 'bg-amber-300 text-slate-950'}`}><Icon className="h-6 w-6" /></div><h2 className="mt-6 text-2xl font-bold">{name}</h2><p className="mt-3 text-3xl font-bold">{price}</p><ul className="mt-6 space-y-3 text-sm text-slate-200">{items.map((item) => <li key={item} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-emerald-300" />{item}</li>)}</ul></section>)}
        </div>
      </div>
    </main>
  )
}
