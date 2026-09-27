const http = require('node:http')
const { WebSocketServer } = require('ws')
const { createClient } = require('redis')

const port = Number(process.env.PORT || process.env.LOCATION_WS_PORT || 8787)
const clients = new Set()
const locations = new Map()
const trails = new Map()
const redis = process.env.REDIS_URL ? createClient({ url: process.env.REDIS_URL }) : null
let persistenceReady = false

if (redis) redis.on('error', (error) => console.error('Location Redis error:', error.message))

async function persistLocation(location) {
  if (!persistenceReady) return
  const serialized = JSON.stringify(location)
  await Promise.all([
    redis.hSet('driver:locations', location.id, serialized),
    redis.sAdd('driver:ids', location.id),
    redis.rPush(`driver:${location.id}:trail`, serialized),
    redis.lTrim(`driver:${location.id}:trail`, -500, -1),
    redis.expire(`driver:${location.id}:trail`, 60 * 60 * 24 * 30),
  ])
}

async function getTrail(driverId, limit = 200) {
  if (trails.has(driverId)) return trails.get(driverId).slice(-limit)
  if (!persistenceReady) return []
  const serialized = await redis.lRange(`driver:${driverId}:trail`, -limit, -1)
  const points = serialized.flatMap((item) => {
    try { return [JSON.parse(item)] } catch { return [] }
  })
  trails.set(driverId, points)
  return points
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url, 'http://localhost')
  const locationMatch = url.pathname.match(/^\/api\/locations\/([^/]+)$/)
  response.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': process.env.CORS_ORIGINS || '*' })
  if (locationMatch && request.method === 'GET') {
    const driverId = decodeURIComponent(locationMatch[1])
    Promise.all([Promise.resolve(locations.get(driverId) || null), getTrail(driverId, Math.min(500, Number(url.searchParams.get('limit')) || 200))])
      .then(([location, trail]) => response.end(JSON.stringify({ location, trail })))
      .catch(() => {
        response.writeHead(503)
        response.end(JSON.stringify({ error: 'Location history is unavailable' }))
      })
    return
  }
  response.end(JSON.stringify({ status: 'ok', clients: clients.size, locations: locations.size, persistence: persistenceReady ? 'redis' : 'memory' }))
})

const webSocketServer = new WebSocketServer({ server })

function broadcast(message) {
  const serialized = JSON.stringify(message)
  for (const client of clients) {
    if (client.readyState === 1) client.send(serialized)
  }
}

webSocketServer.on('connection', (socket) => {
  clients.add(socket)
  socket.send(JSON.stringify({ type: 'location_snapshot', locations: [...locations.values()] }))

  socket.on('message', (raw) => {
    try {
      const message = JSON.parse(raw.toString())
      if (message.type !== 'location_update') return
      const latitude = Number(message.latitude)
      const longitude = Number(message.longitude)
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return
      const location = {
        id: String(message.id || 'driver-demo'),
        latitude,
        longitude,
        accuracy: Number.isFinite(Number(message.accuracy)) ? Number(message.accuracy) : null,
        heading: Number.isFinite(Number(message.heading)) ? Number(message.heading) : null,
        speed: Number.isFinite(Number(message.speed)) ? Number(message.speed) : null,
        status: String(message.status || 'active'),
        updatedAt: new Date().toISOString(),
      }
      locations.set(location.id, location)
      const trail = trails.get(location.id) || []
      trail.push(location)
      if (trail.length > 500) trail.shift()
      trails.set(location.id, trail)
      persistLocation(location).catch((error) => console.error('Unable to persist driver location:', error.message))
      broadcast({ type: 'location_update', location })
    } catch {
      // Ignore malformed telemetry packets.
    }
  })

  socket.on('close', () => clients.delete(socket))
  socket.on('error', () => clients.delete(socket))
})

async function start() {
  if (redis) {
    try {
      await redis.connect()
      persistenceReady = true
      const ids = await redis.sMembers('driver:ids')
      for (const id of ids) {
        const serialized = await redis.hGet('driver:locations', id)
        if (serialized) locations.set(id, JSON.parse(serialized))
        await getTrail(id)
      }
    } catch (error) {
      console.error('Location Redis unavailable; tracking is memory-only:', error.message)
    }
  }
  server.listen(port, '0.0.0.0', () => {
    console.log(`AgroSaathi location WebSocket server listening on port ${port}`)
  })
}

start()
