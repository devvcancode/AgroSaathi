'use client'

import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const INDIA_BOUNDS = [[6.5, 68.1], [37.1, 97.5]]

const cropColors = {
  Rice: '#f59e0b',
  Wheat: '#eab308',
  Soybean: '#10b981',
  Cotton: '#a855f7',
  Maize: '#f97316',
}

export default function BuyerFarmerMap({ farms = [], cropFilter = 'All' }) {
  const visibleFarms = farms.filter((farm) => cropFilter === 'All' || farm.cropType === cropFilter)

  return (
    <MapContainer bounds={INDIA_BOUNDS} maxBounds={INDIA_BOUNDS} maxBoundsViscosity={1} minZoom={4} maxZoom={8} scrollWheelZoom style={{ height: '100%', minHeight: 500, width: '100%' }}>
      <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
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
    </MapContainer>
  )
}