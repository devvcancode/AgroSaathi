const test = require('node:test')
const assert = require('node:assert/strict')

const { normalizeLanguage, translateTextForFarmer, buildAgenticSearchPlan } = require('../backend/src/services/translationService.js')

test('language normalization resolves buyer and farmer languages to canonical codes', () => {
  assert.equal(normalizeLanguage('Tamil'), 'ta')
  assert.equal(normalizeLanguage('Hindi'), 'hi')
  assert.equal(normalizeLanguage('English'), 'en')
})

test('translation service converts a Tamil buyer query into a farmer-facing Hindi summary', async () => {
  const result = await translateTextForFarmer({
    text: 'எனக்கு 30 கிலோ நெல் இன்று விற்க வேண்டும்',
    sourceLanguage: 'ta',
    targetLanguage: 'hi',
  })

  assert.equal(result.sourceLanguage, 'ta')
  assert.equal(result.targetLanguage, 'hi')
  assert.ok(result.translatedText.length > 0)
  assert.ok(result.translatedText.toLowerCase().includes('धान') || result.translatedText.toLowerCase().includes('आज') || result.translatedText.toLowerCase().includes('बेच'))
})

test('translation service uses the configured provider response when available', async () => {
  const previousUrl = process.env.TRANSLATION_API_URL
  const previousKey = process.env.TRANSLATION_API_KEY
  const previousFetch = global.fetch
  process.env.TRANSLATION_API_URL = 'https://translation.example.test/translate'
  process.env.TRANSLATION_API_KEY = 'test-key'
  global.fetch = async (url, options) => {
    assert.equal(url, process.env.TRANSLATION_API_URL)
    assert.equal(options.headers.Authorization, 'Bearer test-key')
    return { ok: true, json: async () => ({ translatedText: 'आज 30 किलो चावल बेचना है' }) }
  }

  const result = await translateTextForFarmer({
    text: 'I need to sell 30 kg of rice today',
    sourceLanguage: 'en',
    targetLanguage: 'hi',
  })

  assert.equal(result.mode, 'provider')
  assert.equal(result.translatedText, 'आज 30 किलो चावल बेचना है')
  global.fetch = previousFetch
  if (previousUrl === undefined) delete process.env.TRANSLATION_API_URL
  else process.env.TRANSLATION_API_URL = previousUrl
  if (previousKey === undefined) delete process.env.TRANSLATION_API_KEY
  else process.env.TRANSLATION_API_KEY = previousKey
})

test('agentic search groups farmer asks into actionable modules and gives a response', () => {
  const plan = buildAgenticSearchPlan('आज mandi rate and residue pickup for rice', { cropType: 'Rice' })

  assert.ok(plan.modules.length > 0)
  assert.ok(plan.response.length > 0)
  assert.ok(plan.modules.some((item) => ['market', 'residue', 'weather'].includes(item.kind)))
})
