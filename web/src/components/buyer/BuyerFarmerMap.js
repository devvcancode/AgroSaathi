'use client'

import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useLiveLocation } from '@/hooks/useLiveLocation'

const INDIA_BOUNDS = [[6.5, 68.1], [37.1, 97.5]]
const mapTileUrl = process.env.NEXT_PUBLIC_MAP_TILE_URL || 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
const mapAttribution = process.env.NEXT_PUBLIC_MAP_TILE_ATTRIBUTION || '&copy; OpenStreetMap contributors &copy; CARTO'

const cropColors = {
  Rice: '#f59e0b',
  Wheat: '#eab308',
  Soybean: '#10b981',
  Cotton: '#a855f7',
  Maize: '#f97316',
}

export default function BuyerFarmerMap({ farms = [], cropFilter = 'All' }) {
  const { locations, connection } = useLiveLocation({ id: null, latitude: 20.5937, longitude: 78.9629 })
  const visibleFarms = farms.filter((farm) => cropFilter === 'All' || farm.cropType === cropFilter)
  const activeDrivers = locations.filter((item) => item.status === 'active' && Number.isFinite(Number(item.latitude)) && Number.isFinite(Number(item.longitude)))

  return (
    <div className="relative h-full">
      <MapContainer bounds={INDIA_BOUNDS} maxBounds={INDIA_BOUNDS} maxBoundsViscosity={1} minZoom={4} maxZoom={8} scrollWheelZoom style={{ height: '100%', minHeight: 500, width: '100%' }}>
        <TileLayer attribution={mapAttribution} url={mapTileUrl} />
        {visibleFarms.map((farm, index) => (
          <CircleMarker key={`${farm.id}-${index}`} center={[farm.latitude, farm.longitude]} radius={11} pathOptions={{ color: '#fff', weight: 2, fillColor: cropColors[farm.cropType] || '#0f766e', fillOpacity: 0.9 }}>
            <Popup>
              <strong>{farm.cropType} farmer network</strong>
              <br />
              {farm.district}, {farm.state}
              <br />
              Crop availability: {farm.availability}
              <br />
              Residue quantity is shared only after a buyer request is matched.
            </Popup>
          </CircleMarker>
        ))}
        {activeDrivers.map((driver) => (
          <CircleMarker key={`driver-${driver.id}`} center={[Number(driver.latitude), Number(driver.longitude)]} radius={8} pathOptions={{ color: '#fff', weight: 2, fillColor: '#0284c7', fillOpacity: 1 }}>
            <Popup>
              <strong>Live driver</strong>
              <br />
              Updated {driver.updatedAt ? new Date(driver.updatedAt).toLocaleTimeString() : 'just now'}
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
      <div className="absolute left-3 top-3 z-[1000] flex items-center gap-2 rounded-md bg-white/95 px-3 py-2 text-xs font-semibold text-slate-700 shadow">
        <span className={`h-2 w-2 rounded-full ${connection === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
        {connection === 'connected' ? `${activeDrivers.length} live driver${activeDrivers.length === 1 ? '' : 's'}` : 'Live location feed unavailable'}
      </div>
    </div>
  )
}