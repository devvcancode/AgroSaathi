const LANGUAGE_ALIASES = {
  en: 'en', english: 'en',
  hi: 'hi', hindi: 'hi',
  pa: 'pa', punjabi: 'pa',
  ta: 'ta', tamil: 'ta', 'tamil nadu': 'ta',
  te: 'te', telugu: 'te',
  mr: 'mr', marathi: 'mr',
  kn: 'kn', kannada: 'kn',
  bn: 'bn', bengali: 'bn',
  gu: 'gu', gujarati: 'gu',
  ml: 'ml', malayalam: 'ml',
  or: 'or', odia: 'or',
  'rajasthan': 'hi',
  'hindi-english': 'hi',
}

const LANGUAGE_LABELS = {
  en: 'English',
  hi: 'Hindi',
  pa: 'Punjabi',
  ta: 'Tamil',
  te: 'Telugu',
  mr: 'Marathi',
  kn: 'Kannada',
  bn: 'Bengali',
  gu: 'Gujarati',
  ml: 'Malayalam',
  or: 'Odia',
}

function normalizeLanguage(value) {
  const key = String(value || 'en').trim().toLowerCase()
  return LANGUAGE_ALIASES[key] || 'en'
}

function fallbackTranslateText({ text, sourceLanguage = 'ta', targetLanguage = 'hi' } = {}) {
  const source = normalizeLanguage(sourceLanguage)
  const target = normalizeLanguage(targetLanguage)
  const input = String(text || '').trim()
  if (!input) return ''
  if (source === target) return input

  const translations = {
    'ta-hi': 'आज किसान के लिए: "' + input + '" — पहले mandi दर, तुरंत पैकेजिंग, और फसल की स्थिति देखें।',
    'ta-en': 'Farmer summary: "' + input + '" — review current mandi price, crop health, and dispatch timing before deciding.',
    'hi-ta': 'விவசாயி விளக்கம்: "' + input + '" — சந்தை விலை, பயிர் நிலைமை மற்றும் டெலிவரி நேரத்தை முதலில் சரிபார்க்கவும்.',
    'hi-en': 'Farmer summary: "' + input + '" — check current mandi rates, crop health, and dispatch timing first.',
    'en-hi': 'कृषक सारांश: "' + input + '" — पहले बाजार दर, फसल की स्थिति और डिस्पैच समय की पुष्टि करें।',
    'en-ta': 'விவசாயி சுருக்கம்: "' + input + '" — முதலில் சந்தை விலை, பயிர் நிலை மற்றும் டெலிவரி நேரத்தை சரிபார்க்கவும்.',
    'pa-hi': 'किसान सारांश: "' + input + '" — पहले मंडी दर, फसल स्थिति और डिलीवरी समय देखें।',
    'hi-pa': 'ਕਿਸਾਨ ਸੰਖੇਪ: "' + input + '" — ਪਹਿਲਾਂ ਮੰਡੀ ਦਰ, ਫਸਲ ਦੀ ਸਥਿਤੀ ਅਤੇ ਡਿਲੀਵਰੀ ਸਮਾਂ ਨੂੰ ਦੇਖੋ।',
  }

  const general = `Farmer-facing ${LANGUAGE_LABELS[target]} summary: "${input}" — confirm mandi price, crop condition, and pickup timing before action.`
  return translations[`${source}-${target}`] || general
}

async function translateTextForFarmer({ text, sourceLanguage = 'ta', targetLanguage = 'hi' } = {}) {
  const source = normalizeLanguage(sourceLanguage)
  const target = normalizeLanguage(targetLanguage)
  const input = String(text || '').trim()
  if (!input) {
    return { text: '', sourceLanguage: source, targetLanguage: target, translatedText: '', mode: 'empty' }
  }

  if (source === target) {
    return {
      text: input,
      sourceLanguage: source,
      targetLanguage: target,
      translatedText: input,
      mode: 'literal',
      confidence: 1,
    }
  }

  const providerTranslation = await translateWithConfiguredProvider({
    text: input,
    sourceLanguage: source,
    targetLanguage: target,
  })
  if (providerTranslation) {
    return {
      text: input,
      sourceLanguage: source,
      targetLanguage: target,
      translatedText: providerTranslation,
      mode: process.env.TRANSLATION_API_URL ? 'provider' : 'gemini',
      confidence: 0.95,
    }
  }

  const translatedText = fallbackTranslateText({ text: input, sourceLanguage: source, targetLanguage: target })
  return {
    text: input,
    sourceLanguage: source,
    targetLanguage: target,
    translatedText,
    mode: 'fallback',
    confidence: 0.35,
  }
}

async function translateWithConfiguredProvider({ text, sourceLanguage, targetLanguage }) {
  const providerUrl = String(process.env.TRANSLATION_API_URL || '').trim()
  if (providerUrl) {
    try {
      const response = await fetch(providerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.TRANSLATION_API_KEY ? { Authorization: `Bearer ${process.env.TRANSLATION_API_KEY}` } : {}),
        },
        body: JSON.stringify({ text, sourceLanguage, targetLanguage }),
        signal: AbortSignal.timeout(8000),
      })
      const data = await response.json().catch(() => ({}))
      const translatedText = data.translatedText || data.translation || data.text
      if (response.ok && typeof translatedText === 'string' && translatedText.trim()) return translatedText.trim()
    } catch (error) {
      console.error('Configured translation provider unavailable:', error.message)
    }
  }

  if (!process.env.GEMINI_API_KEY) return ''

  try {
    const model = process.env.GEMINI_MODEL || 'gemini-3.6-flash'
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{
            text: `Translate the agricultural buyer message from ${LANGUAGE_LABELS[sourceLanguage] || sourceLanguage} to ${LANGUAGE_LABELS[targetLanguage] || targetLanguage}. Preserve names, crop names, quantities, prices, dates, units, urgency, and negotiation intent. Return only the translation, with no explanation.`,
          }],
        },
        contents: [{ role: 'user', parts: [{ text }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 300 },
      }),
      signal: AbortSignal.timeout(8000),
    })
    const data = await response.json().catch(() => ({}))
    const translatedText = data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim()
    if (response.ok && translatedText) return translatedText
  } catch (error) {
    console.error('Gemini translation unavailable:', error.message)
  }

  return ''
}

function buildAgenticSearchPlan(query, context = {}) {
  const rawQuery = String(query || '').trim()
  const normalized = rawQuery.toLowerCase()
  const cropType = String(context.cropType || 'Rice').trim()

  const moduleMap = [
    {
      kind: 'weather',
      label: 'Weather + irrigation',
      keywords: ['weather', 'rain', 'irrigation', 'temperature', 'humidity', 'storm', 'wind'],
      summary: 'Check field weather, rain risk, and irrigation timing before scheduling operations.',
      actions: ['Open field weather', 'Review irrigation window'],
    },
    {
      kind: 'market',
      label: 'Mandi + pricing',
      keywords: ['mandi', 'price', 'rate', 'market', 'sell', 'buyer', 'price lock'],
      summary: 'Compare mandi price, MSP trend, and buyer demand for the current crop.',
      actions: ['Review mandi rate', 'Check buyer demand'],
    },
    {
      kind: 'residue',
      label: 'Residue + logistics',
      keywords: ['residue', 'stubble', 'pickup', 'haul', 'trash', 'dispatch', 'collection'],
      summary: 'Match residue pickup, equipment, and disposal timing to the field schedule.',
      actions: ['Open residue plan', 'Book pickup route'],
    },
    {
      kind: 'crop',
      label: 'Crop care',
      keywords: ['crop', 'disease', 'leaf', 'spray', 'nutrient', 'fertilizer', 'seed', 'sowing'],
      summary: 'Evaluate crop stress, nutrient balance, and the next field action for the crop cycle.',
      actions: ['Review crop health', 'Check spray window'],
    },
    {
      kind: 'finance',
      label: 'Incentive + yield',
      keywords: ['yield', 'profit', 'incentive', 'payment', 'income', 'revenue', 'finance'],
      summary: 'Check yield forecast, incentive plan, and expected return before sale or input purchase.',
      actions: ['Open yield pulse', 'Review incentives'],
    },
  ]

  const matchedModules = moduleMap.filter((module) => module.keywords.some((keyword) => normalized.includes(keyword)))
  const fallbackModules = matchedModules.length ? matchedModules : [
    moduleMap.find((module) => module.kind === 'crop') || moduleMap[0],
  ]

  const response = fallbackModules.length
    ? `${cropType} update: ${fallbackModules.map((module) => module.label).join(' • ')}. The next action is to prioritize field timing, market value, and logistics before moving to the next step.`
    : `I can help with crop health, mandi pricing, residue pickup, and field logistics for ${cropType}.`

  return {
    query: rawQuery,
    cropType,
    modules: fallbackModules.map((module) => ({
      kind: module.kind,
      label: module.label,
      summary: module.summary,
      actions: module.actions,
    })),
    response,
  }
}

module.exports = {
  LANGUAGE_ALIASES,
  LANGUAGE_LABELS,
  normalizeLanguage,
  translateTextForFarmer,
  translateWithConfiguredProvider,
  buildAgenticSearchPlan,
  fallbackTranslateText,
}
