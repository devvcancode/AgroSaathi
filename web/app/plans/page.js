'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, BadgeCheck, Check, CreditCard, Sprout } from 'lucide-react'
import RazorpayButton from '@/components/RazorpayButton'
import { plans } from '@/lib/data/plans'

const priceFormatter = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })

const roleLabels = {
  farmer: 'Farmer',
  buyer: 'Buyer',
  seller: 'Seller',
  driver: 'Driver',
  admin: 'Administrator',
}

const dashboardPaths = {
  farmer: '/farmer/dashboard',
  buyer: '/buyer/dashboard',
  seller: '/seller/dashboard',
  driver: '/driver/dashboard',
  admin: '/admin/dashboard',
}

export default function PlansPage() {
  const [role, setRole] = useState('farmer')

  useEffect(() => {
    try {
      setRole(JSON.parse(localStorage.getItem('agrovani_user') || '{}').role || 'farmer')
    } catch {
      setRole('farmer')
    }
  }, [])

  const isFarmer = role === 'farmer'
  const roleLabel = roleLabels[role] || 'Account'
  const dashboardPath = dashboardPaths[role] || '/login'
  const includedPlan = isFarmer ? plans.find((plan) => plan.farmerPriceInr === 0) : null

  return (
    <main className="min-h-screen bg-[#0b171c] px-4 py-5 text-slate-100 md:px-8 md:py-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
          <Link href={dashboardPath} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back to {roleLabel.toLowerCase()} dashboard
          </Link>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300">
            <BadgeCheck className="h-4 w-4 text-emerald-300" /> {roleLabel} account
          </span>
        </header>

        <section className="grid gap-8 border-b border-white/10 py-8 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-300">Membership & billing</p>
            <h1 className="mt-3 text-3xl font-bold text-white md:text-4xl">Plans for your work</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Compare access for your account and continue to checkout when you’re ready.</p>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3">
            <CreditCard className="h-5 w-5 text-emerald-300" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Billing</p>
              <p className="mt-0.5 text-sm font-semibold text-white">One-time checkout</p>
            </div>
          </div>
        </section>

        <section className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 py-5" aria-label="Current plan status">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-300">
              <Sprout className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{isFarmer ? `${includedPlan?.name || 'Farmer access'} included` : 'No paid plan selected'}</p>
              <p className="mt-1 text-sm text-slate-400">{isFarmer ? 'Farmer platform access is free.' : 'Select a plan below to start a one-time checkout.'}</p>
            </div>
          </div>
          <a href="#available-plans" className="inline-flex items-center rounded-md border border-white/15 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10">Compare plans</a>
        </section>

        <section id="available-plans" className="py-7">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white">Available plans</h2>
              <p className="mt-1 text-sm text-slate-400">Prices shown for {roleLabel.toLowerCase()} accounts.</p>
            </div>
            <p className="text-xs text-slate-400">Recurring billing is not enabled.</p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {plans.map((plan) => {
              const priceInr = isFarmer ? Number(plan.farmerPriceInr ?? 0) : Number(plan.priceInr)
              const isFree = priceInr === 0
              return (
                <article key={plan.id} className={`flex min-h-[390px] flex-col rounded-lg border p-5 ${plan.highlight ? 'border-emerald-300/50 bg-emerald-300/10' : 'border-white/10 bg-white/[0.035]'}`}>
                  <div className="flex min-h-7 items-start justify-between gap-3">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-300">{plan.name}</p>
                    {plan.highlight && <span className="rounded-sm bg-emerald-300 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#0b171c]">Popular</span>}
                  </div>
                  <div className="mt-6">
                    <p className="text-4xl font-bold text-white">₹{priceFormatter.format(priceInr)}</p>
                    <p className="mt-1 text-xs text-slate-400">{isFree ? 'Included' : 'One-time purchase'}</p>
                  </div>
                  <p className="mt-4 min-h-10 text-sm leading-5 text-slate-300">{plan.note}</p>
                  <ul className="mt-5 space-y-3 border-t border-white/10 pt-5 text-sm text-slate-200">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto pt-6">
                    <RazorpayButton plan={{ ...plan, priceInr }} />
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <footer className="border-t border-white/10 py-5 text-xs leading-5 text-slate-400">
          Payment confirmation is handled by Razorpay when configured. Paid plan activation is not yet saved to an account record in this prototype.
        </footer>
      </div>
    </main>
  )
}
