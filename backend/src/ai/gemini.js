function sanitizeJsonBody(raw) {
  if (!raw) return null
  const normalized = raw.trim()
  if (!normalized) return null
  const fenced = normalized.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenced ? fenced[1] : normalized
  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) {
    return JSON.parse(candidate.slice(start, end + 1))
  }
  return JSON.parse(candidate)
}

function buildGeminiVisionPrompt({ cropType = 'Rice', farmName = 'Farm', location = '' } = {}) {
  return [
    'You are AgroVani crop diagnostics assistant for Indian farms.',
    'Analyze the crop image and return only valid JSON with these keys:',
    '{ "issue": "short diagnosis", "severity": "Low|Moderate|High", "confidence": 0.0-1.0, "symptoms": ["primary symptoms"], "explanation": "brief field explanation", "product": "best agronomic product suggestion", "category": "fungicide|insecticide|herbicide|seedcare|biostimulant|disease|nutrient", "recommendation": "practical action for the farmer", "nextSteps": ["step 1", "step 2"] }',
    'Important: Do not invent pesticide labels, dosages, or medical claims.',
    `Crop type: ${cropType}. Farm: ${farmName}. Location: ${location || 'Indian field'}.`,
    'If the image looks like nutrient stress, fungal disease, pest attack, heat/water stress, or leaf discoloration, prioritize the likely field diagnosis and give a safe agronomic recommendation.',
    'Use concise but practical recommendations for Indian farmers and mention the need to validate with local agronomist if symptoms are severe or uncertain.',
  ].join('\n')
}

function parseGeminiResponse(data) {
  const rawText = data?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || ''
  if (!rawText) {
    return {
      issue: 'Unable to assess crop image',
      severity: 'Moderate',
      confidence: 0,
      symptoms: ['No crop symptoms detected in the returned output.'],
      explanation: 'Gemini returned an empty diagnosis payload.',
      product: 'Monitor crop condition and scout field',
      category: 'monitor',
      recommendation: 'Capture a clearer close-up image of the affected leaf and compare symptoms with field scouting.',
      nextSteps: ['Capture a clearer photo', 'Scout nearby plants', 'Confirm with local agronomist if severe'],
      rawText,
    }
  }

  try {
    const parsed = sanitizeJsonBody(rawText)
    return {
      ...parsed,
      rawText,
    }
  } catch (error) {
    return {
      issue: 'Image diagnosis uncertain',
      severity: 'Moderate',
      confidence: 0.1,
      symptoms: [rawText.slice(0, 160)],
      explanation: 'The model returned non-JSON text; the result has been normalized for fallback handling.',
      product: 'Scout before applying any product',
      category: 'scout',
      recommendation: 'Use a clearer leaf image or consult a local agronomist before applying any treatment.',
      nextSteps: ['Capture a sharper photo', 'Inspect the crop canopy', 'Consult local agronomist if symptoms spread'],
      rawText,
    }
  }
}

function mapSymptomsToRecommendation({ cropType = 'Rice', issue = '', symptoms = [] } = {}) {
  const combined = `${issue} ${Array.isArray(symptoms) ? symptoms.join(' ') : symptoms}`.toLowerCase()
  const productMap = [
    { match: /blast|leaf spot|rust|fungal|fungus|powdery|downy|blight|scab|lesion/i, product: 'Amistar Top', category: 'fungicide', rationale: 'Fungal leaf spotting or blast-like lesions need a quality fungicide and field scouting.' },
    { match: /aphid|whitefly|thrips|jassid|bollworm|caterpillar|borer|pest|insect|leafhopper/i, product: 'Virtako', category: 'insecticide', rationale: 'Active insect pressure suggests crop protection against sucking or chewing pests.' },
    { match: /weed|broadleaf|grass|herb|non-crop/i, product: 'Rifit', category: 'herbicide', rationale: 'Weed competition should be checked before treatment; choose a crop-safe herbicide based on label registration.' },
    { match: /chlorosis|yellow|nitrogen|nutrient|deficiency|water|drought|heat|wilting/i, product: 'Isabion', category: 'biostimulant', rationale: 'Stress and nutrient-related symptoms are best managed with stress relief and nutritional support, not a blanket spray.' },
  ]

  const matched = productMap.find((entry) => entry.match.test(combined)) || {
    product: cropType === 'Rice' ? 'Amistar Top' : 'Isabion',
    category: 'monitor',
    rationale: 'The field symptoms need a closer diagnosis before choosing a product.',
  }

  return {
    product: matched.product,
    category: matched.category,
    recommendation: matched.rationale,
  }
}

module.exports = {
  buildGeminiVisionPrompt,
  parseGeminiResponse,
  mapSymptomsToRecommendation,
}
