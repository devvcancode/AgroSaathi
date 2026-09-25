'use client'

import Link from 'next/link'
import { ArrowLeft, MapPinned, Navigation, Clock3, Truck, PackageCheck, Route, AlertCircle } from 'lucide-react'
import dynamic from 'next/dynamic'
import SupportDock from '@/components/SupportDock'

const LeafletMap = dynamic(() => import('@/components/farmer/LeafletMap'), {
  ssr: false,
  loading: () => <div className="flex min-h-[300px] items-center justify-center bg-slate-100 text-slate-400">Loading live route map…</div>,
})

const metrics = [
  { label: 'Assigned trips', value: '18', detail: '6 active' },
  { label: 'Distance today', value: '132 km', detail: '+12% vs avg' },
  { label: 'On-time rate', value: '96%', detail: '4 delays' },
  { label: 'Fuel spend', value: '₹3,420', detail: 'Within budget' },
]

const routes = [
  { id: 'AG-2041', farmer: 'Sukhdev Singh', crop: 'Rice', load: '12.4 qtl', eta: '5 min', status: 'Pickup in progress', priority: 'High', color: 'emerald' },
  { id: 'AG-2047', farmer: 'Dharamvir Kaur', crop: 'Wheat', load: '8.8 qtl', eta: '11 min', status: 'Residue buyer route', priority: 'Medium', color: 'amber' },
  { id: 'AG-2058', farmer: 'Mandeep Singh', crop: 'Maize', load: '7.3 qtl', eta: '18 min', status: 'Seed drop en route', priority: 'Low', color: 'sky' },
]

export default function DriverDashboard() {
  return (
    <main className="page-farmer min-h-screen p-4 text-slate-800 md:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-col gap-4 rounded-[24px] border border-white/80 bg-white/70 p-4 shadow-sm backdrop-blur-md md:flex-row md:items-center md:justify-between">
          <Link href="/login" className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" /> AgroVani Driver Console
          </Link>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-violet-700">Driver</span>
            <Link href="/driver/route" className="pill-dark">Open live route</Link>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-[28px] border border-white/80 bg-white/80 p-6 shadow-sm backdrop-blur-md">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">{metric.label}</p>
              <p className="mt-3 text-4xl font-bold text-slate-900">{metric.value}</p>
              <p className="mt-2 text-sm text-slate-600">{metric.detail}</p>
            </div>
          ))}
        </div>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-white/80 bg-white/75 p-6 shadow-sm backdrop-blur-md">
            <div className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-violet-600" />
              <h2 className="text-2xl font-bold text-slate-900">Today’s route plan</h2>
            </div>

            <div className="mt-6 space-y-4">
              {routes.map((route) => (
                <div key={route.id} className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <p className="text-lg font-bold text-slate-900">{route.id}</p>
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${route.color === 'emerald' ? 'bg-emerald-100 text-emerald-700' : route.color === 'amber' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'}`}>
                          {route.priority}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">{route.farmer} · {route.crop}</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">{route.status}</span>
                  </div>

                  <div className="mt-4 flex items-center justify-between rounded-2xl bg-white p-3 text-sm text-slate-700">
                    <span>Load</span>
                    <span className="font-semibold text-slate-900">{route.load}</span>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                    <span className="flex items-center gap-2"><Clock3 className="h-4 w-4" /> ETA</span>
                    <span className="font-semibold text-slate-900">{route.eta}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[28px] border border-white/80 bg-white/75 p-6 shadow-sm backdrop-blur-md">
              <div className="flex items-center gap-2">
                <MapPinned className="h-5 w-5 text-emerald-600" />
                <h3 className="text-xl font-bold text-slate-900">Current zone</h3>
              </div>
              <div className="mt-4 rounded-[24px] bg-gradient-to-br from-slate-900 to-slate-700 p-4 text-white">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-300">Patiala cluster</p>
                <p className="mt-3 text-2xl font-bold">12.4 km to next pickup</p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15">
                  <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-emerald-400 to-violet-400" />
                </div>
              </div>
              <div className="mt-4 overflow-hidden rounded-[20px] border border-slate-200 min-h-[300px]">
                <LeafletMap lat={30.3398} lon={76.3869} mode="residue" />
              </div>
            </div>

            <div className="rounded-[28px] border border-white/80 bg-white/75 p-6 shadow-sm backdrop-blur-md">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-violet-600" />
                <h3 className="text-xl font-bold text-slate-900">Vehicle status</h3>
              </div>
              <div className="mt-5 space-y-4 text-sm text-slate-700">
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"><span>Vehicle</span><span className="font-semibold text-slate-900">PB-07-AX 7312</span></div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"><span>Capacity</span><span className="font-semibold text-slate-900">1.8 tons</span></div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"><span>Fuel</span><span className="font-semibold text-emerald-700">68%</span></div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"><span>Alerts</span><span className="font-semibold text-amber-700">2 pending</span></div>
              </div>
            </div>
          </div>
        </section>
      </div>
      <SupportDock role="driver" />
    </main>
  )
}
