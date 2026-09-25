'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Navigation, MapPinned, Clock3, PackageCheck, AlertCircle, Route, Radio } from 'lucide-react'
import dynamic from 'next/dynamic'

const LeafletMap = dynamic(() => import('@/components/farmer/LeafletMap'), {
  ssr: false,
  loading: () => <div className="flex min-h-[300px] items-center justify-center bg-slate-100 text-slate-400">Loading live route map…</div>,
})

const checkpoints = [
  { name: 'Seed depot', time: '08:20', status: 'Complete' },
  { name: 'Farmer collection', time: '08:45', status: 'Live' },
  { name: 'Residue buyer', time: '09:10', status: 'Queued' },
  { name: 'Return hub', time: '09:35', status: 'Upcoming' },
]

const routeStops = [
  { name: 'Sukhdev Singh', load: '12.4 qtl', eta: '5 min', status: 'Pickup in progress' },
  { name: 'Dharamvir Kaur', load: '8.8 qtl', eta: '11 min', status: 'Residue buyer route' },
  { name: 'Mandeep Singh', load: '7.3 qtl', eta: '18 min', status: 'Seed drop en route' },
]

export default function DriverRoutePage() {
  const [progress, setProgress] = useState(48)
  const [routeState, setRouteState] = useState('En route to farmer collection')
  const [isBroadcasting, setIsBroadcasting] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState('Connecting...')
  const [driverLocation, setDriverLocation] = useState(null)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setProgress((current) => current >= 92 ? 48 : current + 1)
    }, 1800)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!isBroadcasting) {
      setConnectionStatus('Offline')
      return undefined
    }

    const websocketUrl = process.env.NEXT_PUBLIC_LOCATION_WS_URL
    if (!websocketUrl) return undefined

    const socket = new WebSocket(websocketUrl)
    let watchId = null

    const publish = (latitude, longitude) => {
      setDriverLocation({ latitude, longitude, status: 'active' })
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'location_update', id: 'driver-demo', latitude, longitude, status: 'active' }))
      }
    }

    socket.onopen = () => {
      setConnectionStatus('Live GPS active')
      if (!navigator.geolocation) return
      watchId = navigator.geolocation.watchPosition(
        (position) => publish(position.coords.latitude, position.coords.longitude),
        () => { setConnectionStatus('GPS signal lost') },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      )
    }

    socket.onclose = () => setConnectionStatus('Disconnected')
    socket.onerror = () => setConnectionStatus('Connection error')

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId)
      socket.close()
    }
  }, [isBroadcasting])

  const liveCheckpoints = checkpoints.map((stop, index) => ({
    ...stop,
    status: progress > 78 && index === 1 ? 'Complete' : index === 1 ? 'Live' : stop.status,
  }))

  return (
    <main className="page-farmer min-h-screen p-4 text-slate-800 md:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-col gap-4 rounded-[24px] border border-white/80 bg-white/70 p-4 shadow-sm backdrop-blur-md md:flex-row md:items-center md:justify-between">
          <Link href="/driver/dashboard" className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" /> Back to driver dashboard
          </Link>
          <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-violet-700">Live route</span>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-white/80 bg-white/75 p-6 shadow-sm backdrop-blur-md">
            <div className="flex items-center gap-2">
              <MapPinned className="h-5 w-5 text-violet-600" />
              <h2 className="text-2xl font-bold text-slate-900">Route map</h2>
            </div>

            <div className="mt-5 overflow-hidden rounded-[24px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-800 to-slate-700 p-6 text-white">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-300">
                <span>Patiala Cluster</span>
                <span className={`flex items-center gap-2 ${isBroadcasting ? 'text-emerald-300' : 'text-slate-400'}`}>
                  {isBroadcasting && <Radio className="h-3.5 w-3.5 animate-pulse" />} 
                  {connectionStatus}
                </span>
              </div>
              <div className="relative mt-8 h-56 overflow-hidden rounded-[20px] border border-white/10 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.2),transparent_36%),linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.01))] p-4">
                <div className="relative h-full w-full">
                  <div className="absolute left-[17%] top-[31%] h-[2px] w-[55%] rotate-[18deg] bg-gradient-to-r from-emerald-400 via-violet-400 to-amber-400 opacity-80" />
                  <div className="absolute left-[35%] top-[52%] h-[2px] w-[28%] rotate-[15deg] bg-gradient-to-r from-violet-400 to-sky-400 opacity-80" />
                  <div className="absolute left-[16%] top-[30%] h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_0_10px_rgba(52,211,153,0.12)]" />
                  <div className="absolute top-[42%] h-3 w-3 rounded-full bg-violet-400 shadow-[0_0_0_10px_rgba(168,85,247,0.12)] transition-all duration-1000" style={{ left: `${Math.min(75, 18 + progress * 0.55)}%` }} />
                  <div className="absolute left-[70%] top-[20%] h-3 w-3 rounded-full bg-amber-400 shadow-[0_0_0_10px_rgba(251,191,36,0.12)]" />
                  <div className="absolute left-[32%] top-[60%] h-3 w-3 rounded-full bg-sky-400 shadow-[0_0_0_10px_rgba(59,130,246,0.12)]" />
                  <span className="absolute left-[12%] top-[38%] text-[10px] font-bold uppercase tracking-[0.15em] text-slate-300">Depot</span>
                  <span className="absolute right-[9%] top-[10%] text-[10px] font-bold uppercase tracking-[0.15em] text-slate-300">Buyer</span>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm"><span className="text-slate-300">{routeState}</span><span className="font-bold text-emerald-300">{progress}%</span></div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-violet-400 transition-all duration-1000" style={{ width: `${progress}%` }} /></div>
            </div>

            <div className="mt-5 overflow-hidden rounded-[24px] border border-slate-200 bg-white min-h-[300px]">
              <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">Live navigation map</div>
              <LeafletMap lat={driverLocation?.latitude || 30.3398} lon={driverLocation?.longitude || 76.3869} mode="residue" liveLocation={driverLocation} />
            </div>

            <div className="mt-6 space-y-3">
              {liveCheckpoints.map((stop, index) => (
                <div key={stop.name} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${index === 1 ? 'bg-violet-600 text-white' : 'bg-white text-slate-700'}`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{stop.name}</p>
                    <p className="text-xs text-slate-500">{stop.time}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${stop.status === 'Complete' ? 'bg-emerald-100 text-emerald-700' : stop.status === 'Live' ? 'bg-violet-100 text-violet-700' : stop.status === 'Queued' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                    {stop.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[28px] border border-white/80 bg-white/75 p-6 shadow-sm backdrop-blur-md">
              <div className="flex items-center gap-2">
                <Radio className="h-5 w-5 text-emerald-600" />
                <h3 className="text-xl font-bold text-slate-900">Location settings</h3>
              </div>
              <div className="mt-5 flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                <div>
                  <p className="font-semibold text-slate-900">Live broadcasting</p>
                  <p className="text-sm text-slate-500">{connectionStatus}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBroadcasting(!isBroadcasting)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isBroadcasting ? 'bg-emerald-500' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isBroadcasting ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/80 bg-white/75 p-6 shadow-sm backdrop-blur-md">
              <div className="flex items-center gap-2">
                <Route className="h-5 w-5 text-violet-600" />
                <h3 className="text-xl font-bold text-slate-900">Current pickups</h3>
              </div>

              <div className="mt-5 space-y-3">
                {routeStops.map((stop) => (
                  <div key={stop.name} className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{stop.name}</p>
                        <p className="text-xs text-slate-500">{stop.status}</p>
                      </div>
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">{stop.load}</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                      <span className="flex items-center gap-2"><Clock3 className="h-4 w-4" /> ETA</span>
                      <span className="font-semibold text-slate-900">{stop.eta}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/80 bg-white/75 p-6 shadow-sm backdrop-blur-md">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <h3 className="text-xl font-bold text-slate-900">Route notes</h3>
              </div>

              <ul className="mt-5 space-y-3 text-sm text-slate-700">
                <li className="rounded-2xl bg-amber-50 px-4 py-3 text-amber-800">Road condition: slight delay on village approach road.</li>
                <li className="rounded-2xl bg-emerald-50 px-4 py-3 text-emerald-800">Residue buyer capacity available at 09:10 slot.</li>
                <li className="rounded-2xl bg-sky-50 px-4 py-3 text-sky-800">Seed drop confirmed at next delivery hub.</li>
              </ul>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setRouteState('Arrived at farmer collection')} className="rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"><PackageCheck className="mr-2 inline h-4 w-4" /> Mark arrived</button>
                <button type="button" onClick={() => setRouteState('Navigation refreshed')} className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"><Navigation className="mr-2 inline h-4 w-4" /> Refresh route</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
