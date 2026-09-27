function getDigiLockerConfig(env = process.env) {
  return {
    clientId: env.DIGILOCKER_CLIENT_ID || '',
    clientSecret: env.DIGILOCKER_CLIENT_SECRET || '',
    redirectUri: env.DIGILOCKER_REDIRECT_URI || '',
    authorizationUrl: env.DIGILOCKER_AUTH_URL || 'https://api.digitallocker.gov.in/public/oauth2/1/authorize',
    tokenUrl: env.DIGILOCKER_TOKEN_URL || 'https://api.digitallocker.gov.in/public/oauth2/1/token',
  }
}

function isDigiLockerConfigured(env = process.env) {
  const config = getDigiLockerConfig(env)
  return Boolean(config.clientId && config.clientSecret && config.redirectUri)
}

function createDigiLockerAuthorizationUrl(state, env = process.env) {
  const config = getDigiLockerConfig(env)
  const url = new URL(config.authorizationUrl)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', config.clientId)
  url.searchParams.set('redirect_uri', config.redirectUri)
  url.searchParams.set('state', state)
  return url.toString()
}

async function exchangeDigiLockerCode(code, { env = process.env, fetchImpl = fetch } = {}) {
  const config = getDigiLockerConfig(env)
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
  })
  const response = await fetchImpl(config.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    signal: AbortSignal.timeout(8000),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || !data.access_token) throw new Error(data.error_description || data.error || `DigiLocker returned HTTP ${response.status}`)
  return data
}

module.exports = { getDigiLockerConfig, isDigiLockerConfigured, createDigiLockerAuthorizationUrl, exchangeDigiLockerCode }