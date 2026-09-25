'use client'

import dynamic from 'next/dynamic'
import { MapPin, Radio } from 'lucide-react'
import { useLiveLocation } from '@/hooks/useLiveLocation'

const SpatialFieldScene = dynamic(() => import('./SpatialFieldSceneClient'), { ssr: false })

const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[360px] w-full items-center justify-center rounded-xl bg-slate-100 text-slate-400">
      Loading map…
    </div>
  ),
})

export default function FarmMapCard({ lat, lon, mode = 'residue', stressScore = 0, title }) {
  const { location, connection } = useLiveLocation({ latitude: lat, longitude: lon, enabled: Boolean(lat && lon) })

  return (
    <div className="glass-card card-3d">
      <div className="mb-4 flex items-center gap-2">
        <MapPin className="h-5 w-5 text-emerald-500" />
        <h3 className="text-lg font-semibold text-slate-900">{title || 'Farm Map'}</h3>
        <span className="ml-auto flex items-center gap-2 rounded-full bg-slate-900/5 px-3 py-1 text-xs font-medium text-slate-500">
          <Radio className={`h-3 w-3 ${connection === 'connected' ? 'text-emerald-500' : 'text-amber-500'}`} />
          {connection === 'connected' ? 'Live GPS' : 'GPS unavailable'}
        </span>
      </div>
      <div className="overflow-hidden rounded-xl">
        {lat && lon ? (
          <LeafletMap lat={lat} lon={lon} liveLocation={location} mode={mode} stressScore={stressScore} />
        ) : (
          <div className="flex h-[360px] items-center justify-center bg-slate-100 text-slate-400">No location set</div>
        )}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[24px] border border-white/20 bg-slate-950/80 p-4 text-white">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Spatial field view</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">Rotate the field surface to inspect stress intensity and the active location beacon.</p>
        </div>
        <SpatialFieldScene stressScore={stressScore} />
      </div>
    </div>
  )
}
