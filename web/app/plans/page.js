'use client'

import Link from 'next/link'
import { ArrowLeft, Check } from 'lucide-react'
import { plans } from '@/src/lib/data/plans'

const priceFormatter = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })

const statCards = [
  { label: 'Stations', value: '11', tone: 'light' },
  { label: 'Warmest', value: '34°C', tone: 'mint' },
  { label: 'Coverage', value: 'India only', tone: 'light' },
]

export default function PlansPage() {
  return (
    <main className="min-h-screen bg-[#081d2d] px-4 py-4 text-white md:px-6 md:py-6">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link href="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-200 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back to login
          </Link>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {plans.map(({ id, name, priceInr, note, features, highlight, buttonLabel }) => {
            const isFree = priceInr === 0
            const isHighlight = Boolean(highlight)
            const priceValue = isFree ? '₹0' : `₹${priceFormatter.format(priceInr)}`

            return (
              <section
                key={id}
                className={[
                  'relative flex min-h-[540px] flex-col rounded-[28px] border p-0',
                  isHighlight
                    ? 'border-[#b6dac5] bg-[#dfece2] text-slate-900 shadow-[0_20px_40px_rgba(16,185,129,0.10)]'
                    : 'border-[#43657c] bg-[#f1f0ee] text-slate-900 shadow-[0_18px_28px_rgba(2,6,23,0.12)]',
                ].join(' ')}
              >
                <div className="flex flex-1 flex-col px-6 py-5 md:px-7 md:py-6">
                  <div className="mb-5 flex min-h-[58px] items-center justify-between gap-3">
                    <p className={['text-[0.72rem] font-bold uppercase tracking-[0.22em]', isHighlight ? 'text-[#2e4138]' : 'text-slate-500'].join(' ')}>
                      {name.toUpperCase()}
                    </p>
                    {isHighlight && (
                      <span className="inline-flex items-center rounded-full bg-[#12b98d] px-4 py-2 text-[0.7rem] font-bold uppercase tracking-[0.18em] text-white shadow-md shadow-emerald-600/20">
                        Best value
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex items-end gap-2">
                    <span className={['text-[3.6rem] font-black leading-none tracking-[-0.06em]', isHighlight ? 'text-slate-900' : 'text-slate-900'].join(' ')}>
                      {priceValue}
                    </span>
                    <span className={['mb-2 text-[1.45rem] font-medium leading-none', isHighlight ? 'text-slate-600' : 'text-slate-500'].join(' ')}>/mo</span>
                  </div>

                  <p className={['mt-5 text-lg', isHighlight ? 'text-slate-600' : 'text-slate-600'].join(' ')}>
                    {isFree ? 'Base app access' : note}
                  </p>

                  <ul className={['mt-7 space-y-5 text-[1.05rem]', isHighlight ? 'text-slate-700' : 'text-slate-700'].join(' ')}>
                    {features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3">
                        <span className={['inline-flex h-4 w-4 items-center justify-center rounded-full', isHighlight ? 'bg-[#0d1f1c]' : 'bg-[#0d1f1c]'].join(' ')}>
                          <Check className="h-3 w-3 text-white" />
                        </span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto pt-7">
                    <button
                      type="button"
                      className={[
                        'flex w-full items-center justify-center rounded-full px-5 py-4 text-[1.1rem] font-bold transition hover:translate-y-[-1px]',
                        isHighlight ? 'bg-[#12b98d] text-white shadow-[0_14px_26px_rgba(18,185,141,0.28)]' : 'bg-[#f4f4f4] text-slate-900 ring-1 ring-slate-200/80',
                      ].join(' ')}
                    >
                      {buttonLabel}
                    </button>
                  </div>
                </div>
              </section>
            )
          })}
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          {statCards.map(({ label, value, tone }) => (
            <div
              key={label}
              className={[
                'flex min-h-[140px] items-center justify-between rounded-[24px] border px-6 py-5',
                tone === 'mint' ? 'border-[#b8dcc6] bg-[#dfece2] text-slate-900' : 'border-[#d7d3ce] bg-[#f2f1ef] text-slate-900',
              ].join(' ')}
            >
              <div className="text-[0.72rem] font-bold uppercase tracking-[0.22em] text-slate-500">{label}</div>
              <div className="text-[2.5rem] font-black tracking-[-0.06em] text-slate-900">{value}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 overflow-hidden rounded-[28px] border border-[#d7d3ce] bg-[#eae8e5]">
          <div className="relative h-[220px] overflow-hidden bg-[radial-gradient(circle_at_20%_28%,rgba(255,255,255,0.7),transparent_18%),radial-gradient(circle_at_60%_40%,rgba(104,200,169,0.28),transparent_18%),linear-gradient(180deg,#dfe7db_0%,#cdd6d7_100%)]">
            <div className="absolute inset-x-0 bottom-0 top-16 bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.45)_35%,transparent_100%)]" />
            <div className="absolute left-8 top-10 h-14 w-14 rounded-full bg-white/30 blur-xl" />
            <div className="absolute right-16 top-16 h-16 w-16 rounded-full bg-[#b4d5cf]/60 blur-xl" />
            <div className="absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(180deg,transparent,rgba(110,137,146,0.18))]" />
            <div className="absolute left-[12%] top-[28%] h-28 w-28 rotate-[-12deg] rounded-full border border-[#8c8e7c]/30 bg-[#cad7bc]/40" />
            <div className="absolute left-[28%] top-[18%] h-20 w-20 rotate-[18deg] rounded-full border border-[#8c8e7c]/35 bg-[#d7e7d4]/40" />
            <div className="absolute right-[18%] top-[20%] h-24 w-24 rounded-full border border-[#8c8e7c]/35 bg-[#c9d9d1]/45" />
            <div className="absolute left-[58%] bottom-[22%] h-24 w-24 rotate-[18deg] rounded-full border border-[#8c8e7c]/35 bg-[#cae1d8]/40" />
            <div className="absolute bottom-[24%] left-[10%] h-[2px] w-[72%] rotate-[10deg] border-t border-[#6b7c79]/40" />
            <div className="absolute bottom-[28%] left-[20%] h-[2px] w-[58%] rotate-[-8deg] border-t border-[#6b7c79]/40" />
            <div className="absolute bottom-[20%] right-[12%] h-[2px] w-[28%] rotate-[14deg] border-t border-[#6b7c79]/40" />
          </div>
        </div>
      </div>
    </main>
  )
}
