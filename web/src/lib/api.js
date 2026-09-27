function getApiBaseUrl() {
  const configuredBase = (process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || '').trim().replace(/\/$/, '')
  if (typeof window !== 'undefined' && window.location?.origin) {
    if (configuredBase) {
      try {
        const configuredHost = new URL(configuredBase).hostname
        const pageHost = new URL(window.location.origin).hostname
        const isLoopback = (host) => host === 'localhost' || host === '127.0.0.1' || host === '::1'
        if (!isLoopback(configuredHost) || isLoopback(pageHost)) return configuredBase
      } catch {
        return configuredBase
      }
    }
    return window.location.origin
  }
  if (configuredBase) return configuredBase
  return 'http://localhost:3000'
}

export function apiUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${getApiBaseUrl()}${normalizedPath}`
}