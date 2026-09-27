async function generateGroqReply({ apiKey, model = 'llama-3.3-70b-versatile', systemInstruction, message, fetchImpl = fetch }) {
  if (!apiKey) throw new Error('Groq API key is not configured')

  const response = await fetchImpl('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: message || '' },
      ],
      temperature: 0.3,
      max_tokens: 300,
    }),
    signal: AbortSignal.timeout(8000),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error?.message || `Groq returned HTTP ${response.status}`)

  const reply = data.choices?.[0]?.message?.content?.trim()
  if (!reply) throw new Error('Groq returned an empty response')
  return reply
}

async function generateGroqVisionReply({ apiKey, model = 'meta-llama/llama-4-scout-17b-16e-instruct', prompt, imageBase64, mimeType = 'image/jpeg', fetchImpl = fetch }) {
  if (!apiKey) throw new Error('Groq API key is not configured')

  const response = await fetchImpl('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
        ],
      }],
      temperature: 0.2,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    }),
    signal: AbortSignal.timeout(12000),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error?.message || `Groq returned HTTP ${response.status}`)

  const reply = data.choices?.[0]?.message?.content?.trim()
  if (!reply) throw new Error('Groq returned an empty response')
  return reply
}

async function transcribeGroqAudio({ apiKey, audioBase64, mimeType = 'audio/webm', language, fetchImpl = fetch }) {
  if (!apiKey) throw new Error('Groq API key is not configured')
  const base64 = String(audioBase64 || '').replace(/^data:[^,]+,/, '')
  const form = new FormData()
  form.append('file', new Blob([Buffer.from(base64, 'base64')], { type: mimeType }), 'question.webm')
  form.append('model', 'whisper-large-v3-turbo')
  if (language) form.append('language', language)

  const response = await fetchImpl('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
    signal: AbortSignal.timeout(12000),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error?.message || `Groq returned HTTP ${response.status}`)
  const transcript = data.text?.trim()
  if (!transcript) throw new Error('Groq returned an empty transcript')
  return transcript
}

module.exports = { generateGroqReply, generateGroqVisionReply, transcribeGroqAudio }