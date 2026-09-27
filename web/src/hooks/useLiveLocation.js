'use client'

import { useEffect, useRef, useState } from 'react'

export function useLiveLocation({ id = 'driver-demo', latitude, longitude, enabled = true }) {
  const [location, setLocation] = useState({ latitude, longitude, status: 'unavailable' })
  const [locations, setLocations] = useState([])
  const [connection, setConnection] = useState('unavailable')
  const socketRef = useRef(null)

  useEffect(() => {
    setLocation((current) => ({ ...current, latitude, longitude }))
  }, [latitude, longitude])

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return undefined
    let active = true
    let reconnectTimer
    let allLocationsUrl = null

    const applyLocations = (nextLocations) => {
      if (!active || !Array.isArray(nextLocations)) return
      setLocations(nextLocations)
      const current = id
        ? nextLocations.find((item) => item.id === id)
        : [...nextLocations].sort((left, right) => Date.parse(right.updatedAt || 0) - Date.parse(left.updatedAt || 0))[0]
      if (current) setLocation(current)
    }

    const refreshLocations = async () => {
      if (!allLocationsUrl) return
      try {
        const response = await fetch(allLocationsUrl)
        if (response.ok) applyLocations((await response.json()).locations)
      } catch {
        // The websocket remains the primary transport when REST polling is unavailable.
      }
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
        setConnection('unavailable')
        reconnectTimer = window.setTimeout(connect, 10000)
        return
      }
      allLocationsUrl = new URL(websocketUrl)
      allLocationsUrl.protocol = allLocationsUrl.protocol === 'wss:' ? 'https:' : 'http:'
      allLocationsUrl.pathname = '/api/locations'
      allLocationsUrl.search = ''
      refreshLocations()
      const socket = new WebSocket(websocketUrl)
      socketRef.current = socket
      socket.onopen = () => { if (active) setConnection('connected') }
      socket.onclose = () => {
        if (!active) return
        setConnection('reconnecting')
        reconnectTimer = window.setTimeout(connect, 3000)
      }
      socket.onerror = () => { if (active) setConnection('reconnecting') }
      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          if (message.type === 'location_snapshot') applyLocations(message.locations)
          if (message.type === 'location_update' && message.location) {
            const updated = message.location
            setLocations((current) => [...current.filter((item) => item.id !== updated.id), updated])
            if (!id || updated.id === id) setLocation(updated)
          }
        } catch {
          // Ignore malformed telemetry packets.
        }
      }
    }

    connect()
    const pollTimer = window.setInterval(() => {
      if (socketRef.current?.readyState !== WebSocket.OPEN) refreshLocations()
      const staleAfter = 2 * 60 * 1000
      const markStale = (item) => item.status === 'active' && Date.now() - Date.parse(item.updatedAt || 0) > staleAfter
        ? { ...item, status: 'stale' }
        : item
      setLocations((current) => current.map(markStale))
      setLocation((current) => current && markStale(current))
    }, 5000)

    return () => {
      active = false
      window.clearTimeout(reconnectTimer)
      window.clearInterval(pollTimer)
      socketRef.current?.close()
      socketRef.current = null
    }
  }, [enabled, id])

  return { location, locations, connection }
}
