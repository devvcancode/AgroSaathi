'use client'

import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const INDIA_BOUNDS = [[6.5, 68.1], [37.1, 97.5]]

function colorForTemperature(value) {
  if (value == null) return '#64748b'
  if (value >= 34) return '#dc2626'
  if (value >= 29) return '#f59e0b'
  if (value >= 23) return '#10b981'
  return '#0ea5e9'
}

export default function IndiaWeatherMap({ points = [] }) {
  return (
    <MapContainer bounds={INDIA_BOUNDS} maxBounds={INDIA_BOUNDS} maxBoundsViscosity={1} minZoom={4} maxZoom={8} scrollWheelZoom style={{ height: '100%', minHeight: 430, width: '100%' }}>
      <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {points.map((point) => (
        <CircleMarker
          key={`${point.name}-${point.latitude}`}
          center={[point.latitude, point.longitude]}
          radius={10}
          pathOptions={{ color: '#ffffff', weight: 2, fillColor: colorForTemperature(point.temperatureC), fillOpacity: 0.9 }}
        >
          <Popup>
            <strong>{point.name}, {point.state}</strong>
            <br />
            {point.temperatureC ?? '—'}°C · {point.condition}
            <br />
            Humidity {point.humidityPct ?? '—'}% · Wind {point.windKph ?? '—'} km/h
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}