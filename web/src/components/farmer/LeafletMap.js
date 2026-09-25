'use client'

import { useEffect, useRef } from 'react'
import { useSpring } from 'framer-motion'
import { MapContainer, TileLayer, Marker, Popup, Polygon, Circle, LayersControl } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const { BaseLayer } = LayersControl

const streetTileUrl = process.env.NEXT_PUBLIC_MAP_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const streetAttribution = process.env.NEXT_PUBLIC_MAP_TILE_ATTRIBUTION || '&copy; OpenStreetMap contributors'
const satelliteTileUrl = process.env.NEXT_PUBLIC_MAP_SATELLITE_TILE_URL || 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
const satelliteAttribution = process.env.NEXT_PUBLIC_MAP_SATELLITE_ATTRIBUTION || 'Tiles &copy; Esri'

function pin(color) {
  return L.divIcon({
    className: 'fv-pin',
    html: `<svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg"><path d="M15 0C6.7 0 0 6.7 0 15c0 10 15 25 15 25s15-15 15-25C30 6.7 23.3 0 15 0z" fill="${color}"/><circle cx="15" cy="15" r="6" fill="white"/></svg>`,
    iconSize: [30, 40],
    iconAnchor: [15, 40],
    popupAnchor: [0, -38],
  })
}

const ICONS = {
  green: pin('#10b981'),
  slate: pin('#0f172a'),
  amber: pin('#f59e0b'),
  red: pin('#ef4444'),
  blue: pin('#3b82f6'),
}

function offset(lat, lon, dLat, dLon) {
  return [lat + dLat, lon + dLon]
}

function AnimatedMarker({ position, icon, children }) {
  const markerRef = useRef(null)
  const latSpring = useSpring(position[0], { stiffness: 60, damping: 15 })
  const lngSpring = useSpring(position[1], { stiffness: 60, damping: 15 })

  useEffect(() => {
    latSpring.set(position[0])
    lngSpring.set(position[1])
  }, [position, latSpring, lngSpring])

  useEffect(() => {
    const unsubscribeLat = latSpring.on('change', (v) => {
      if (markerRef.current) markerRef.current.setLatLng([v, lngSpring.get()])
    })
    const unsubscribeLng = lngSpring.on('change', (v) => {
      if (markerRef.current) markerRef.current.setLatLng([latSpring.get(), v])
    })
    return () => {
      unsubscribeLat()
      unsubscribeLng()
    }
  }, [latSpring, lngSpring])

  return (
    <Marker ref={markerRef} position={position} icon={icon}>
      {children}
    </Marker>
  )
}

export default function LeafletMap({ lat, lon, liveLocation, mode = 'residue', stressScore = 0 }) {
  const center = [lat, lon]
  const liveCenter = liveLocation?.latitude && liveLocation?.longitude
    ? [liveLocation.latitude, liveLocation.longitude]
    : center
  const boundary = [
    offset(lat, lon, 0.012, -0.014),
    offset(lat, lon, 0.012, 0.014),
    offset(lat, lon, -0.012, 0.014),
    offset(lat, lon, -0.012, -0.014),
  ]

  const residueMarkers = [
    { pos: offset(lat, lon, 0.02, 0.02), icon: 'slate', title: 'Custom Hiring Center', desc: 'Happy Seeder, Baler, Mulcher available' },
    { pos: offset(lat, lon, -0.025, 0.015), icon: 'green', title: 'Biomass Processing Plant', desc: 'Accepting stubble off-take • High demand' },
    { pos: offset(lat, lon, 0.018, -0.028), icon: 'amber', title: 'Stubble Hotspot', desc: 'Active residue clearing zone' },
    { pos: offset(lat, lon, -0.02, -0.022), icon: 'red', title: 'Stubble Hotspot', desc: 'High burning alert this week' },
  ]

  const cropMarkers = [
    { pos: offset(lat, lon, 0.022, 0.018), icon: 'green', title: 'Syngenta Retail Hub', desc: 'Authorized biological input dealer' },
    { pos: offset(lat, lon, -0.024, 0.02), icon: 'red', title: 'Disease Outbreak', desc: 'Fungal cluster reported nearby' },
    { pos: offset(lat, lon, 0.02, -0.026), icon: 'red', title: 'Pest Outbreak', desc: 'Regional pest alert' },
  ]

  const markers = mode === 'crop' ? cropMarkers : residueMarkers
  const heatColor = stressScore > 6 ? '#ef4444' : stressScore > 3 ? '#f59e0b' : '#10b981'

  return (
    <MapContainer center={center} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%', minHeight: 360 }}>
      <LayersControl position="topright">
        <BaseLayer checked name="Streets">
          <TileLayer attribution={streetAttribution} url={streetTileUrl} />
        </BaseLayer>
        <BaseLayer name="Satellite">
          <TileLayer attribution={satelliteAttribution} url={satelliteTileUrl} />
        </BaseLayer>
      </LayersControl>

      <Polygon positions={boundary} pathOptions={{ color: '#0f172a', weight: 2, fillColor: '#38bdf8', fillOpacity: 0.15 }}>
        <Popup>Your farm boundary</Popup>
      </Polygon>

      {mode === 'crop' && (
        <Circle center={center} radius={900} pathOptions={{ color: heatColor, fillColor: heatColor, fillOpacity: 0.22, weight: 1 }}>
          <Popup>Heat stress overlay • score {stressScore}/9</Popup>
        </Circle>
      )}

      <Marker position={center} icon={ICONS.blue}>
        <Popup>Your farm</Popup>
      </Marker>

      {liveLocation?.status === 'active' && <AnimatedMarker position={liveCenter} icon={ICONS.green}>
        <Popup>Live driver location · active</Popup>
      </AnimatedMarker>}

      {markers.map((m, i) => (
        <Marker key={i} position={m.pos} icon={ICONS[m.icon]}>
          <Popup>
            <strong>{m.title}</strong>
            <br />
            {m.desc}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
