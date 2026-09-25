const http = require('node:http')
const { WebSocketServer } = require('ws')

const port = Number(process.env.LOCATION_WS_PORT || 8787)
const clients = new Set()
const locations = new Map()

const server = http.createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'application/json' })
  response.end(JSON.stringify({ status: 'ok', clients: clients.size, locations: locations.size }))
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
        status: String(message.status || 'active'),
        updatedAt: new Date().toISOString(),
      }
      locations.set(location.id, location)
      broadcast({ type: 'location_update', location })
    } catch {
      // Ignore malformed telemetry packets.
    }
  })

  socket.on('close', () => clients.delete(socket))
  socket.on('error', () => clients.delete(socket))
})

server.listen(port, '0.0.0.0', () => {
  console.log(`AgroVani location WebSocket server listening on ws://0.0.0.0:${port}`)
})
