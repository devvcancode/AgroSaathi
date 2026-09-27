function getApiBaseUrl() {
  const configuredBase = (process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || '').trim().replace(/\/$/, '')
  if (configuredBase) return configuredBase
  if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin
  return 'http://localhost:3000'
}

export function apiUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${getApiBaseUrl()}${normalizedPath}`
}