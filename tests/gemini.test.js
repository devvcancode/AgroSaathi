const test = require('node:test')
const assert = require('node:assert/strict')

const {
  buildGeminiVisionPrompt,
  parseGeminiResponse,
  mapSymptomsToRecommendation,
} = require('../backend/src/ai/gemini')
const { getSupabaseServerClient } = require('../backend/src/supabase')

test('buildGeminiVisionPrompt includes crop and diagnosis instructions', () => {
  const prompt = buildGeminiVisionPrompt({ cropType: 'Rice', farmName: 'Farm A' })
  assert.match(prompt, /Rice/)
  assert.match(prompt, /JSON/i)
  assert.match(prompt, /product/i)
})

test('parseGeminiResponse extracts JSON from Gemini markdown output', () => {
  const parsed = parseGeminiResponse({
    candidates: [{
      content: { parts: [{ text: '```json\n{"issue":"Leaf blast","severity":"Moderate","confidence":0.86}\n```' }], },
    }],
  })

  assert.equal(parsed.issue, 'Leaf blast')
  assert.equal(parsed.severity, 'Moderate')
  assert.equal(parsed.confidence, 0.86)
})

test('mapSymptomsToRecommendation chooses an agronomic product based on symptom cues', () => {
  const recommendation = mapSymptomsToRecommendation({
    cropType: 'Rice',
    issue: 'Rice blast',
    symptoms: 'Spindle-shaped lesions on leaves and neck blast',
  })

  assert.match(recommendation.product, /Amistar|Revus|Folio|Score|Amistar Top/i)
  assert.match(recommendation.category, /fungicide|disease/i)
})

test('Supabase server client stays disabled when service role is absent', () => {
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const previousAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const previousService = process.env.SUPABASE_SERVICE_ROLE_KEY

  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
  delete process.env.SUPABASE_SERVICE_ROLE_KEY

  try {
    const client = getSupabaseServerClient()
    assert.equal(client, null)
  } finally {
    if (previousUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL
    else process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl

    if (previousAnon === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = previousAnon

    if (previousService === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY
    else process.env.SUPABASE_SERVICE_ROLE_KEY = previousService
  }
})
