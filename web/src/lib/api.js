const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '')

export function apiUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${apiBaseUrl}${normalizedPath}`
}