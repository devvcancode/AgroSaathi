'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Navigation, MapPinned, Clock3, PackageCheck, AlertCircle, Route, Radio } from 'lucide-react'
import dynamic from 'next/dynamic'

const LeafletMap = dynamic(() => import('@/components/farmer/LeafletMap'), {
  ssr: false,
  loading: () => <div className="flex min-h-[300px] items-center justify-center bg-slate-100 text-slate-400">Loading live route map…</div>,
})

const routeStops = [
  { name: 'Sukhdev Singh', load: '12.4 qtl', eta: '5 min', status: 'Pickup in progress' },
  { name: 'Dharamvir Kaur', load: '8.8 qtl', eta: '11 min', status: 'Residue buyer route' },
  { name: 'Mandeep Singh', load: '7.3 qtl', eta: '18 min', status: 'Seed drop en route' },
]

export default function DriverRoutePage() {
  const [routeState, setRouteState] = useState('En route to farmer collection')
  const [isBroadcasting, setIsBroadcasting] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState('Connecting...')
  const [driverLocation, setDriverLocation] = useState(null)
  const latestLocation = useRef(null)

  useEffect(() => {
    if (!isBroadcasting) {
      setConnectionStatus('Offline')
      setDriverLocation((current) => current ? { ...current, status: 'offline' } : null)
      return undefined
    }

    let watchId = null
    let socket = null
    let reconnectTimer
    let active = true
    let driverId = localStorage.getItem('agrovani_driver_id')
    if (!driverId) {
      driverId = `driver-${window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`
      localStorage.setItem('agrovani_driver_id', driverId)
    }

    const publish = (coords) => {
      const location = {
        type: 'location_update',
        id: driverId,
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        heading: coords.heading,
        speed: coords.speed,
        status: 'active',
      }
      latestLocation.current = location
      setDriverLocation(location)
      if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(location))
    }

    const connect = async () => {
      if (!active) return
      let websocketUrl = process.env.NEXT_PUBLIC_LOCATION_WS_URL
      if (!websocketUrl) {
        try {
          const response = await fetch('/api/location/config')
          websocketUrl = response.ok ? (await response.json()).websocketUrl : ''
        } catch {
          websocketUrl = ''
        }
      }
      if (!active) return
      if (!websocketUrl) {
        setConnectionStatus('Location relay not configured')
        reconnectTimer = window.setTimeout(connect, 10000)
        return
      }
      socket = new WebSocket(websocketUrl)
      socket.onopen = () => {
        setConnectionStatus('Live GPS active')
        if (latestLocation.current) socket.send(JSON.stringify(latestLocation.current))
      }
      socket.onclose = () => {
        if (!active) return
        setConnectionStatus('Reconnecting to location relay')
        reconnectTimer = window.setTimeout(connect, 3000)
      }
      socket.onerror = () => setConnectionStatus('Location relay connection error')
    }

    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => publish(position.coords),
        () => setConnectionStatus('GPS signal unavailable'),
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      )
      connect()
    } else {
      setConnectionStatus('Geolocation is not supported by this device')
    }

    return () => {
      active = false
      if (watchId) navigator.geolocation.clearWatch(watchId)
      window.clearTimeout(reconnectTimer)
      if (socket?.readyState === WebSocket.OPEN && latestLocation.current) {
        socket.send(JSON.stringify({ ...latestLocation.current, status: 'offline' }))
      }
      socket?.close()
    }
  }, [isBroadcasting])

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

            <div className="mt-5 overflow-hidden rounded-[24px] border border-slate-200 bg-white min-h-[360px]">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
                <span>{routeState}</span>
                <span className="flex items-center gap-2 text-xs font-medium text-slate-500"><Radio className="h-3.5 w-3.5" />{connectionStatus}</span>
              </div>
              <LeafletMap lat={driverLocation?.latitude || 30.3398} lon={driverLocation?.longitude || 76.3869} mode="residue" liveLocation={driverLocation} />
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
                <h3 className="text-xl font-bold text-slate-900">Sample pickup queue</h3>
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
