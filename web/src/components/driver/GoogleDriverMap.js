'use client'

import { useEffect, useRef, useState } from 'react'

const PATIALA_CENTER = { lat: 30.3398, lng: 76.3869 }
const DRIVER_STOPS = [
  { label: 'Depot', position: { lat: 30.3398, lng: 76.3869 } },
  { label: 'Farmer pickup', position: { lat: 30.3515, lng: 76.4021 } },
  { label: 'Buyer hub', position: { lat: 30.3282, lng: 76.3714 } },
  { label: 'Return hub', position: { lat: 30.3168, lng: 76.4056 } },
]

function loadGoogleMaps(apiKey) {
  return new Promise((resolve, reject) => {
    if (window.google?.maps) return resolve(window.google.maps)
    const existing = document.getElementById('google-maps-script')
    if (existing) {
      existing.addEventListener('load', () => resolve(window.google.maps), { once: true })
      existing.addEventListener('error', () => reject(new Error('Google Maps failed to load')), { once: true })
      return
    }
    const script = document.createElement('script')
    script.id = 'google-maps-script'
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly`
    script.async = true
    script.defer = true
    script.onload = () => resolve(window.google.maps)
    script.onerror = () => reject(new Error('Google Maps failed to load'))
    document.head.appendChild(script)
  })
}

export default function GoogleDriverMap() {
  const mapRef = useRef(null)
  const [error, setError] = useState('')
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  useEffect(() => {
    if (!apiKey || !mapRef.current) return undefined
    let active = true
    loadGoogleMaps(apiKey)
      .then((maps) => {
        if (!active || !mapRef.current) return
        const map = new maps.Map(mapRef.current, { center: PATIALA_CENTER, zoom: 13, mapTypeControl: false, streetViewControl: false, fullscreenControl: true })
        const path = DRIVER_STOPS.map((stop) => stop.position)
        new maps.Polyline({ path, geodesic: true, strokeColor: '#7c3aed', strokeOpacity: 0.9, strokeWeight: 5, map })
        DRIVER_STOPS.forEach((stop, index) => new maps.Marker({ map, position: stop.position, label: String(index + 1), title: stop.label }))
      })
      .catch((loadError) => { if (active) setError(loadError.message) })
    return () => { active = false }
  }, [apiKey])

  if (!apiKey) {
    return <div className="flex min-h-[300px] items-center justify-center rounded-[20px] bg-slate-900 p-6 text-center text-sm text-slate-300">Google Maps is ready for driver navigation. Add <span className="mx-1 font-semibold text-white">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</span> to enable the live map.</div>
  }

  if (error) return <div className="flex min-h-[300px] items-center justify-center rounded-[20px] bg-red-50 p-6 text-sm text-red-700">{error}. Check the Google Maps key and enabled Maps JavaScript API.</div>
  return <div ref={mapRef} className="min-h-[300px] w-full rounded-[20px]" aria-label="Google Maps driver route" />
}
