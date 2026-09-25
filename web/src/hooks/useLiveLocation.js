'use client'

import { useEffect, useRef, useState } from 'react'

export function useLiveLocation({ id = 'driver-demo', latitude, longitude, enabled = true }) {
  const [location, setLocation] = useState({ latitude, longitude, status: 'unavailable' })
  const [connection, setConnection] = useState('unavailable')
  const socketRef = useRef(null)

  useEffect(() => {
    setLocation((current) => ({ ...current, latitude, longitude }))
  }, [latitude, longitude])

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return undefined
    const websocketUrl = process.env.NEXT_PUBLIC_LOCATION_WS_URL
    if (!websocketUrl) {
      setConnection('unavailable')
      return undefined
    }

    const socket = new WebSocket(websocketUrl)
    socketRef.current = socket
    socket.onopen = () => setConnection('connected')
    socket.onclose = () => setConnection('unavailable')
    socket.onerror = () => setConnection('reconnecting')
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        if (message.type === 'location_update' && message.location?.id === id) {
          setLocation(message.location)
        }
      } catch {
        // Ignore malformed telemetry packets.
      }
    }

    return () => {
      socket.close()
      socketRef.current = null
    }
  }, [enabled, id])

  return { location, connection }
}
