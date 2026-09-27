import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'

async function loadModule(relativePath) {
  const filePath = new URL(relativePath, import.meta.url)
  const source = await fs.readFile(filePath, 'utf8')
  const wrapped = `${source.replace(/export\s+function\s+apiUrl/, 'function apiUrl')}
export { apiUrl }`
  return await import(`data:text/javascript;base64,${Buffer.from(wrapped).toString('base64')}`)
}

test('apiUrl falls back to current origin when no API base is configured', async () => {
  const apiModule = await loadModule('../web/src/lib/api.js')
  const previous = process.env.NEXT_PUBLIC_API_BASE_URL
  delete process.env.NEXT_PUBLIC_API_BASE_URL
  globalThis.window = { location: { origin: 'https://app.example.com' } }

  try {
    assert.equal(apiModule.apiUrl('/api/farms'), 'https://app.example.com/api/farms')
  } finally {
    globalThis.window = undefined
    if (previous === undefined) delete process.env.NEXT_PUBLIC_API_BASE_URL
    else process.env.NEXT_PUBLIC_API_BASE_URL = previous
  }
})

test('apiUrl respects an explicit API base URL override', async () => {
  const apiModule = await loadModule('../web/src/lib/api.js')
  const previous = process.env.NEXT_PUBLIC_API_BASE_URL
  process.env.NEXT_PUBLIC_API_BASE_URL = 'https://api.example.com'

  try {
    assert.equal(apiModule.apiUrl('/api/farms'), 'https://api.example.com/api/farms')
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_API_BASE_URL
    else process.env.NEXT_PUBLIC_API_BASE_URL = previous
  }
})

test('apiUrl ignores a localhost override when the app is open on a remote origin', async () => {
  const apiModule = await loadModule('../web/src/lib/api.js')
  const previous = process.env.NEXT_PUBLIC_API_BASE_URL
  process.env.NEXT_PUBLIC_API_BASE_URL = 'http://localhost:3000'
  globalThis.window = { location: { origin: 'https://codespace-3000.example.dev' } }

  try {
    assert.equal(apiModule.apiUrl('/api/farms'), 'https://codespace-3000.example.dev/api/farms')
  } finally {
    globalThis.window = undefined
    if (previous === undefined) delete process.env.NEXT_PUBLIC_API_BASE_URL
    else process.env.NEXT_PUBLIC_API_BASE_URL = previous
  }
})
