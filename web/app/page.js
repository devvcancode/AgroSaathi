'use client'

import Link from 'next/link'
import { Wind, Droplet, Leaf, ArrowRight, Sparkles, Sprout } from 'lucide-react'
import dynamic from 'next/dynamic'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import InstallAppButton from '@/components/InstallAppButton'
const SpatialFieldScene = dynamic(() => import('@/components/farmer/SpatialFieldSceneClient'), { ssr: false })
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { seedCatalog } from '@/lib/data/seedCatalog'

const impactCards = [
  { title: 'Reduce stubble burning', description: 'Protect air quality with residue alternatives and local machinery support.', icon: Wind },
  { title: 'Beat abiotic stress', description: 'Live heat, frost and drought scores drive precise biostimulant decisions.', icon: Droplet },
  { title: 'Create residue income', description: 'Find buyers and processing plants for stubble off-take and steady income.', icon: Leaf },
]

const residueSignals = [
  { label: 'Residue recovered', value: '84%' },
  { label: 'Burn risk', value: 'Low' },
  { label: 'Buyer demand', value: 'High' },
  { label: 'Next crop', value: 'Planned' },
]

const driverFleet = [
  { name: 'Harjit Singh', status: 'Available', eta: '18 min', load: 'Baler pickup' },
  { name: 'Ravi Kumar', status: 'On route', eta: '32 min', load: 'Residue collection' },
  { name: 'Amanpreet Kaur', status: 'Available', eta: '24 min', load: 'Seed delivery' },
]

export default function App() {
  const { t } = useLanguage()
  const location = 'India'

  return (
    <main className="page-home bg-image min-h-screen text-white">
      <nav className="sticky top-0 z-50 border-b border-white/20 bg-slate-950/35 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-lg text-white shadow-sm shadow-emerald-600/25">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight text-white">{t.brand}</p>
            </div>
          </div>

          <div className="hidden items-center gap-8 md:flex">
            <a href="#" className="text-sm font-medium text-slate-200 transition hover:text-white">{t.nav.residue}</a>
            <a href="#" className="text-sm font-medium text-slate-200 transition hover:text-white">{t.nav.machinery}</a>
            <a href="#" className="text-sm font-medium text-slate-200 transition hover:text-white">{t.nav.crop}</a>
            <a href="#" className="text-sm font-medium text-slate-200 transition hover:text-white">{t.nav.advisory}</a>
          </div>

          <div className="flex items-center gap-3">
            <InstallAppButton compact />
            <LanguageSwitcher />
          </div>
        </div>
      </nav>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.2fr_0.95fr] lg:items-center lg:px-8 lg:py-24">
        <div className="z-10 flex flex-col gap-8">
          <div className="inline-flex w-max items-center gap-2 rounded-full border border-white/70 bg-white/70 px-4 py-2 text-sm font-medium text-slate-700 shadow-[0_4px_12px_rgba(0,0,0,0.04)] backdrop-blur-md">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
            {t.heroBadge}
          </div>

          <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-emerald-700">Residue-first farm operations</p>

          <h1 className="max-w-3xl text-4xl font-bold leading-[1.05] tracking-[-0.05em] text-slate-950 sm:text-6xl">
            {t.heroTitle(location)}
          </h1>

          <p className="max-w-xl text-lg leading-8 text-slate-700">
            {t.heroSubtitle} Turn every harvested field into a coordinated pickup, a market-linked residue sale, and a better next-crop decision.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link href="/login" className="pill-dark">
              Get started <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link href="/farmer/dashboard" className="pill-outline">
              Explore the demo dashboard
            </Link>
          </div>

          <div className="grid gap-4 pt-8 sm:grid-cols-3">
            {impactCards.map((card) => {
              const Icon = card.icon
              return (
                <div key={card.title} className="glass-card card-3d">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-emerald-600 shadow-inner">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-4 text-[18px] font-semibold leading-6 text-slate-950">{card.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{card.description}</p>
                </div>
              )
            })}
          </div>
        </div>

        <div className="relative mt-8 lg:mt-0">
          <div className="glass-card market-shell relative overflow-hidden p-4 md:p-6">
            <div className="market-glow absolute -right-16 -top-16 h-52 w-52 rounded-full bg-emerald-200/40 blur-3xl" />
            <div className="market-glow absolute -bottom-16 -left-16 h-52 w-52 rounded-full bg-sky-200/40 blur-3xl" />

            <div className="relative overflow-hidden rounded-[24px] border border-white/60 shadow-[inset_0_2px_8px_rgba(0,0,0,0.08),0_12px_30px_rgba(0,0,0,0.08)]">
              <img
                src="https://images.unsplash.com/photo-1560493676-04071c5f467b?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YWdyaWN1bHR1cmV8ZW58MHx8MHx8fDA%3D"
                alt="Rows of green crops at sunset"
                className="h-56 w-full object-cover md:h-64"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>

            <div className="relative mt-4 flex items-center justify-between rounded-2xl border border-white/80 bg-white/70 p-5 backdrop-blur-md">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-500">Residue command center</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">Field to circular value</h2>
              </div>
              <span className="badge-green">50K+ farms</span>
            </div>

            <div className="relative mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/80 bg-white/70 p-5 shadow-[0_6px_20px_rgba(0,0,0,0.04)] backdrop-blur-md">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">Residue Forecast</p>
                <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">3.4 <span className="text-lg text-slate-500">t/acre</span></p>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/70 p-5 shadow-[0_6px_20px_rgba(0,0,0,0.04)] backdrop-blur-md">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">Driver ETA</p>
                <p className="mt-3 text-3xl font-bold tracking-tight text-emerald-600">5 <span className="text-lg text-slate-500">min</span></p>
              </div>
            </div>

            <div className="relative mt-4 grid grid-cols-3 gap-2 rounded-2xl border border-white/80 bg-slate-950/90 p-3 text-white shadow-[0_12px_30px_rgba(15,23,42,0.16)]">
              <div><p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">Burn risk</p><p className="mt-1 text-sm font-bold text-emerald-300">Low</p></div>
              <div><p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">Buyer demand</p><p className="mt-1 text-sm font-bold text-amber-300">High</p></div>
              <div><p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">Next crop</p><p className="mt-1 text-sm font-bold text-sky-300">Planned</p></div>
            </div>
            <div className="relative mt-4 rounded-[24px] border border-white/20 bg-slate-950/70 p-2">
              <SpatialFieldScene stressScore={2.4} />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="glass-card border border-emerald-200/80 bg-white/85 p-6 md:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div><div className="flex items-center gap-3 text-emerald-700"><Sprout className="h-6 w-6" /><p className="text-[10px] font-bold uppercase tracking-[0.3em]">Seed marketplace</p></div><h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">Start with the right seed</h2><p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">Explore trusted seed varieties for rice, wheat, maize, cotton, mustard and vegetables.</p></div>
            <Link href="/login" className="pill-dark">Shop seeds <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </div>
        </div>
        <div className="glass-card relative overflow-hidden border border-emerald-100/70 bg-white/75">
          <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-r from-emerald-300/20 via-emerald-100/10 to-sky-300/20" />
          <div className="relative">
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-600">AgriLoop</p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">Live Crop Position Tracking for residue-first farming</h2>
              </div>
              <span className="badge-green">12–22% embedded incentives</span>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_1.3fr]">
              <div className="rounded-[28px] border border-emerald-100 bg-emerald-50/90 p-5 shadow-[0_20px_45px_rgba(16,185,129,0.08)]">
                <div className="flex items-center justify-between text-sm text-slate-700">
                  <span className="rounded-full bg-white px-3 py-1 font-semibold text-emerald-700">Seed seller</span>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                  <span className="rounded-full bg-white px-3 py-1 font-semibold text-emerald-700">Driver</span>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                  <span className="rounded-full bg-white px-3 py-1 font-semibold text-emerald-700">Farmer</span>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="route-panel rounded-[24px] border border-white/80 bg-white/80 p-4">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
                      <span>Live route</span>
                      <span className="text-emerald-600">Tracking</span>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="dot-green h-3 w-3 rounded-full" />
                        <span className="text-sm font-medium text-slate-700">Seed co-op</span>
                      </div>
                      <span className="text-sm text-slate-500">7.2 km</span>
                    </div>
                    <div className="route-line my-4" />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="dot-amber h-3 w-3 rounded-full" />
                        <span className="text-sm font-medium text-slate-700">Farmer field</span>
                      </div>
                      <span className="text-sm text-slate-500">On schedule</span>
                    </div>
                  </div>

                  <div className="rounded-[22px] border border-white/80 bg-white/80 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">Circular loop</p>
                    <div className="mt-4 grid gap-3 text-sm text-slate-700">
                      <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"><span>Seeds</span><span>Input + discount</span></div>
                      <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"><span>Residue</span><span>Collection + value</span></div>
                      <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"><span>Drivers</span><span>Pickup + logistics</span></div>
                      <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"><span>Buyback</span><span>Compost + reuse</span></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  {residueSignals.map((signal) => (
                    <div key={signal.label} className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
                      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">{signal.label}</p>
                      <p className="mt-4 text-2xl font-bold tracking-tight text-slate-900">{signal.value}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">Live driver fleet</p>
                      <h3 className="mt-2 text-2xl font-bold text-slate-900">Ready to dispatch</h3>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">12 active</span>
                  </div>

                  <div className="mt-5 space-y-3">
                    {driverFleet.map((driver) => (
                      <div key={driver.name} className="driver-card flex items-center justify-between rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3">
                        <div>
                          <p className="text-base font-semibold text-slate-900">{driver.name}</p>
                          <p className="text-xs text-slate-500">{driver.status}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">ETA</p>
                          <p className="mt-1 text-base font-semibold text-emerald-700">{driver.eta}</p>
                          <p className="text-xs text-slate-500">{driver.load}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {seedCatalog.map((seed) => <div key={seed.name} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-center justify-between gap-3"><p className="font-bold text-slate-900">{seed.name}</p><span className="text-xs font-semibold text-emerald-700">{seed.crop}</span></div><p className="mt-2 text-sm text-slate-600">{seed.note}</p></div>)}
          </div>
        </div>
      </section>

    </main>
  )
}
