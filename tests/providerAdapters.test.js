const test = require('node:test')
const assert = require('node:assert/strict')
const { generateGroqReply, generateGroqVisionReply, transcribeGroqAudio } = require('../backend/src/ai/groq')
const { createDigiLockerAuthorizationUrl, exchangeDigiLockerCode } = require('../backend/src/services/digilocker')

test('Groq chat adapter returns completion text and exposes provider failures', async () => {
  const reply = await generateGroqReply({
    apiKey: 'test-key',
    systemInstruction: 'Be concise',
    message: 'How should I check my crop?',
    fetchImpl: async (url, options) => {
      assert.match(url, /api\.groq\.com/)
      assert.equal(options.headers.Authorization, 'Bearer test-key')
      return { ok: true, json: async () => ({ choices: [{ message: { content: 'Scout the field first.' } }] }) }
    },
  })
  assert.equal(reply, 'Scout the field first.')

  await assert.rejects(generateGroqReply({
    apiKey: 'test-key',
    systemInstruction: 'Be concise',
    message: 'Hello',
    fetchImpl: async () => ({ ok: false, status: 503, json: async () => ({ error: { message: 'Unavailable' } }) }),
  }), /Unavailable/)
})

test('Groq vision adapter sends an image and returns structured diagnosis text', async () => {
  const reply = await generateGroqVisionReply({
    apiKey: 'test-key',
    prompt: 'Return a cautious crop diagnosis as JSON',
    imageBase64: 'cGxhbnQ=',
    fetchImpl: async (url, options) => {
      const body = JSON.parse(options.body)
      assert.match(url, /api\.groq\.com/)
      assert.match(body.messages[0].content[1].image_url.url, /data:image\/jpeg;base64,cGxhbnQ=/)
      return { ok: true, json: async () => ({ choices: [{ message: { content: '{"issue":"uncertain"}' } }] }) }
    },
  })
  assert.equal(reply, '{"issue":"uncertain"}')
})

test('Groq audio transcription uploads browser audio and returns transcript text', async () => {
  const transcript = await transcribeGroqAudio({
    apiKey: 'test-key',
    audioBase64: 'YXVkaW8=',
    language: 'hi',
    fetchImpl: async (url, options) => {
      assert.match(url, /audio\/transcriptions/)
      assert.equal(options.headers.Authorization, 'Bearer test-key')
      assert.equal(options.body.get('model'), 'whisper-large-v3-turbo')
      assert.equal(options.body.get('language'), 'hi')
      return { ok: true, json: async () => ({ text: 'Check the rice field.' }) }
    },
  })
  assert.equal(transcript, 'Check the rice field.')
})

test('DigiLocker authorization URL carries state and the registered callback', () => {
  const authorizationUrl = new URL(createDigiLockerAuthorizationUrl('state-value', {
    DIGILOCKER_CLIENT_ID: 'client-id',
    DIGILOCKER_AUTH_URL: 'https://digilocker.example/authorize',
    DIGILOCKER_REDIRECT_URI: 'https://app.example/api/verification/digilocker/callback',
  }))

  assert.equal(authorizationUrl.searchParams.get('client_id'), 'client-id')
  assert.equal(authorizationUrl.searchParams.get('state'), 'state-value')
  assert.equal(authorizationUrl.searchParams.get('redirect_uri'), 'https://app.example/api/verification/digilocker/callback')
})

test('DigiLocker code exchange requires an access token and keeps its secret server-side', async () => {
  const token = await exchangeDigiLockerCode('auth-code', {
    env: { DIGILOCKER_CLIENT_ID: 'client-id', DIGILOCKER_CLIENT_SECRET: 'secret', DIGILOCKER_REDIRECT_URI: 'https://app.example/callback', DIGILOCKER_TOKEN_URL: 'https://digilocker.example/token' },
    fetchImpl: async (url, options) => {
      assert.equal(url, 'https://digilocker.example/token')
      assert.match(String(options.body), /client_secret=secret/)
      return { ok: true, json: async () => ({ access_token: 'opaque-test-token' }) }
    },
  })
  assert.equal(token.access_token, 'opaque-test-token')
})