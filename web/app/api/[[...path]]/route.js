import { createHmac, timingSafeEqual } from 'node:crypto'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import { AccessToken } from 'livekit-server-sdk'
import { fetchWeather } from '@/backend/adapters/weather'
import { fetchSprayWindow, fetchHydricStress, geocodeLocation } from '@/backend/adapters/cehub'
import { computeStressDiagnostic, computeFarmEconomics, CROP_LIST, PRODUCT_CATALOG, recommendProduct } from '@/science/cropRecommendation'
import { computeResidue, computeFieldReadiness, DISTRICT_DATA, getDistrictData } from '@/science/residueRecommendation'
import { calculateIncentivePlan, buildCropCalendar, calculateYieldProjection } from '@/science/agriLoop'
import { buildGeminiVisionPrompt, parseGeminiResponse, mapSymptomsToRecommendation } from '@/backend/ai/gemini'
import { connectToDatabase } from '@/backend/database'
import { predictYield } from '@/backend/services/yieldModel'
import { compareMsp, lookupMandiPrices } from '@/backend/services/mandiService'
import { buildFarmReportPdf, createWhatsAppText } from '@/backend/services/reportService'
import { fetchIndiaWeather } from '@/backend/adapters/cloudNextWeather'
import { plans } from '@/lib/data/plans'
import { farmCreateSchema, listingCreateSchema, orderCreateSchema, validationError } from '@/contracts/api'
import { buildResidueOperations, generateResiduePlan } from '@/backend/services/residueService'
import { residuePlanSchema } from '@/contracts/api'

function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || process.env.NEXT_PUBLIC_BASE_URL || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

function ok(data, status = 200) {
  return handleCORS(NextResponse.json(data, { status }))
}

function pdf(data) {
  const response = new NextResponse(data, { status: 200 })
  response.headers.set('Content-Type', 'application/pdf')
  response.headers.set('Content-Disposition', 'inline; filename="agrovani-farm-report.pdf"')
  return handleCORS(response)
}

function buildProductRecommendation({ crop, state, areaInAcres, usedProducts = [], diagnostic = {} }) {
  const usedNames = new Set(usedProducts.map((name) => String(name).trim().toLowerCase()).filter(Boolean))
  const compatible = PRODUCT_CATALOG.filter((product) => !product.crops || product.crops.includes(crop))
  const used = compatible.filter((product) => usedNames.has(product.name.toLowerCase()))
  const available = compatible.filter((product) => !usedNames.has(product.name.toLowerCase()))
  const stressRecommendation = recommendProduct({
    diurnal: Number(diagnostic.scores?.diurnal) || 0,
    night: Number(diagnostic.scores?.night) || 0,
    frost: Number(diagnostic.scores?.frost) || 0,
    di: diagnostic.droughtIndex,
    crop,
    areaInAcres,
    state,
  })
  const primary = available.find((product) => product.name === stressRecommendation.product)
    || available.find((product) => product.category === (stressRecommendation.category === 'stress' ? 'biostimulant' : 'seedcare'))
    || available[0]
    || null
  const alternatives = available.filter((product) => product.name !== primary?.name).slice(0, 4).map((product) => ({
    name: product.name,
    type: product.type,
    category: product.category,
    targets: product.targets,
  }))

  return {
    crop,
    usedProducts: used.map((product) => ({ name: product.name, type: product.type, category: product.category })),
    ignoredProducts: usedProducts.filter((name) => !used.some((product) => product.name.toLowerCase() === String(name).trim().toLowerCase())),
    recommendation: primary ? {
      name: primary.name,
      type: primary.type,
      category: primary.category,
      composition: primary.composition,
      targets: primary.targets,
      dosage: primary.dosage || null,
      guidance: primary.dosage
        ? `${primary.dosage.rateMlPerLitre} ml/L × ${primary.dosage.waterLitresPerAcre} L water/acre. Confirm the current registered India label and crop target before use.`
        : 'Confirm the crop, target, formulation, dose, safety interval, and current India label before use.',
    } : null,
    alternatives,
    rationale: primary
      ? `${used.length} previously used product${used.length === 1 ? '' : 's'} considered. ${stressRecommendation.rationale}`
      : 'No unused compatible catalog product is available. Scout the crop and consult a qualified agronomist before repeating a product.',
    safety: 'This is a decision-support recommendation, not a prescription. Do not mix products or spray without confirming the registered label and local agronomist guidance.',
  }
}

async function createYieldPrediction(body) {
  const values = {
    soil_pH: Number(body.soil_pH),
    nitrogen_ppm: Number(body.nitrogen_ppm),
    seasonal_rainfall_mm: Number(body.seasonal_rainfall_mm),
    avg_temp_c: Number(body.avg_temp_c),
    ndvi_peak: Number(body.ndvi_peak),
  }
  if (Object.values(values).some((value) => !Number.isFinite(value))) return ok({ error: 'All yield model features must be finite numbers.' }, 400)
  if (values.soil_pH < 0 || values.soil_pH > 14 || values.nitrogen_ppm < 0 || values.seasonal_rainfall_mm < 0 || values.ndvi_peak < 0 || values.ndvi_peak > 1) {
    return ok({ error: 'Yield model inputs are outside the accepted ranges.' }, 400)
  }

  const modelApiUrl = process.env.YIELD_MODEL_API_URL
  if (modelApiUrl) {
    try {
      const response = await fetch(modelApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
        signal: AbortSignal.timeout(5000),
      })
      const data = await response.json()
      if (!response.ok || data.success === false) return ok({ error: data.error || 'Yield model service failed.' }, 502)
      return ok({ ...data, source: data.source || 'random_forest_service' })
    } catch (error) {
      console.error('Yield model service unavailable:', error.message)
      return ok({ error: 'Yield model service is unavailable. Start the Codespaces model service or remove YIELD_MODEL_API_URL for local fallback.' }, 503)
    }
  }

  const soilScore = Math.max(0, 1 - Math.abs(values.soil_pH - 6.5) / 6.5)
  const nitrogenScore = Math.min(1, values.nitrogen_ppm / 120)
  const rainfallScore = Math.max(0, 1 - Math.abs(values.seasonal_rainfall_mm - 800) / 1200)
  const temperatureScore = Math.max(0, 1 - Math.abs(values.avg_temp_c - 25) / 30)
  const predictedYield = Math.round(Math.max(0, Math.min(100, (soilScore + nitrogenScore + rainfallScore + temperatureScore + values.ndvi_peak) * 20)) * 100) / 100
  return ok({ success: true, predicted_yield_percent: predictedYield, source: 'next_fallback_heuristic', features: values })
}

export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

const SEED_FARMS = [
  { id: '00000000-0000-4000-8000-000000000001', ownerId: 'farmer@agrovani.in', name: 'Gurpreet Singh', village: 'Patiala', district: 'Patiala', state: 'Punjab', cropType: 'Rice', areaInAcres: 6, latitude: 30.3398, longitude: 76.3869, soilPh: 6.4, nitrogenKgPerHa: 95 },
  { id: '00000000-0000-4000-8000-000000000002', ownerId: 'farmer@agrovani.in', name: 'Harjinder Kaur', village: 'Ludhiana', district: 'Ludhiana', state: 'Punjab', cropType: 'Wheat', areaInAcres: 8, latitude: 30.901, longitude: 75.8573, soilPh: 6.8, nitrogenKgPerHa: 110 },
  { id: '00000000-0000-4000-8000-000000000003', ownerId: 'farmer@agrovani.in', name: 'Ramesh Patel', village: 'Indore', district: 'Indore', state: 'Madhya Pradesh', cropType: 'Soybean', areaInAcres: 5, latitude: 22.7196, longitude: 75.8577, soilPh: 6.2, nitrogenKgPerHa: 80 },
  { id: '00000000-0000-4000-8000-000000000004', ownerId: 'farmer@agrovani.in', name: 'Vijay Deshmukh', village: 'Nagpur', district: 'Nagpur', state: 'Maharashtra', cropType: 'Cotton', areaInAcres: 7, latitude: 21.1458, longitude: 79.0882, soilPh: 7.1, nitrogenKgPerHa: 105 },
  { id: '00000000-0000-4000-8000-000000000005', ownerId: 'farmer@agrovani.in', name: 'Lakshmi Reddy', village: 'Guntur', district: 'Guntur', state: 'Andhra Pradesh', cropType: 'Rice', areaInAcres: 9, latitude: 16.3067, longitude: 80.4365, soilPh: 6.6, nitrogenKgPerHa: 120 },
]

const SEED_MACHINERY = [
  { type: 'Happy Seeder', provider: 'Patiala Agri Co-op', district: 'Patiala', pricePerAcre: 1200, available: true, lat: 30.35, lon: 76.40 },
  { type: 'Baler', provider: 'Green Fields Custom Hiring', district: 'Ludhiana', pricePerAcre: 1500, available: true, lat: 30.91, lon: 75.86 },
  { type: 'Mulcher', provider: 'Malwa Machinery Hub', district: 'Patiala', pricePerAcre: 1000, available: true, lat: 30.31, lon: 76.36 },
  { type: 'Boom Sprayer', provider: 'AgroSpray Services', district: 'Indore', pricePerAcre: 600, available: true, lat: 22.72, lon: 75.86 },
  { type: 'Happy Seeder', provider: 'Vidarbha Farm Tech', district: 'Nagpur', pricePerAcre: 1300, available: true, lat: 21.15, lon: 79.09 },
]

async function seedDb(db) {
  const farmsCol = db.collection('farms')
  const farmCount = await farmsCol.countDocuments()
  let seededFarms = false
  if (farmCount === 0) {
    const now = new Date()
    const farms = SEED_FARMS.map((farm) => ({ ...farm, createdAt: now }))
    await farmsCol.insertMany(farms)
    seededFarms = true
  }

  const machineryCol = db.collection('machinery')
  if (await machineryCol.countDocuments() === 0) {
    await machineryCol.insertMany(SEED_MACHINERY.map((item) => ({ id: uuidv4(), ...item })))
  }
  const metricsCol = db.collection('district_metrics')
  if (await metricsCol.countDocuments() === 0) {
    const metrics = Object.entries(DISTRICT_DATA).map(([district, values]) => ({ id: uuidv4(), district, ...values }))
    await metricsCol.insertMany(metrics)
  }
  const listingsCol = db.collection('marketplace_listings')
  if (await listingsCol.countDocuments() === 0) {
    const now = new Date()
    await listingsCol.insertMany([
      { id: '00000000-0000-4000-8000-000000000101', sellerId: 'seller-patiala@agrovani.in', sellerName: 'Patiala Seed & Residue Co-op', sellerState: 'Punjab', sellerPlace: 'Patiala', name: 'Paddy straw bales', category: 'Residue', priceInr: 4200, stockUnits: 120, status: 'active', expectedDeliveryDays: 3, createdAt: now, updatedAt: now },
      { id: '00000000-0000-4000-8000-000000000102', sellerId: 'seller-ludhiana@agrovani.in', sellerName: 'Ludhiana Farm Collective', sellerState: 'Punjab', sellerPlace: 'Ludhiana', name: 'Wheat straw bundles', category: 'Residue', priceInr: 3900, stockUnits: 90, status: 'active', expectedDeliveryDays: 4, createdAt: now, updatedAt: now },
      { id: '00000000-0000-4000-8000-000000000103', sellerId: 'seller-indore@agrovani.in', sellerName: 'Malwa Biomass Network', sellerState: 'Madhya Pradesh', sellerPlace: 'Indore', name: 'Soybean residue loads', category: 'Residue', priceInr: 4600, stockUnits: 75, status: 'active', expectedDeliveryDays: 6, createdAt: now, updatedAt: now },
      { id: '00000000-0000-4000-8000-000000000104', sellerId: 'seller-nagpur@agrovani.in', sellerName: 'Vidarbha Crop Circle', sellerState: 'Maharashtra', sellerPlace: 'Nagpur', name: 'Cotton stalk bundles', category: 'Residue', priceInr: 3500, stockUnits: 60, status: 'active', expectedDeliveryDays: 7, createdAt: now, updatedAt: now },
    ])
  }
  return { seeded: seededFarms, referenceDataReady: true }
}

function localAssistantReply(body) {
  const message = String(body.message || '').toLowerCase()
  const reply = message.includes('weather')
    ? 'Live weather is available from the farm weather page. Check rainfall, temperature, soil moisture, and the verification status before scheduling field work.'
    : message.includes('mandi') || message.includes('price')
      ? 'Mandi prices will appear when the government data provider is configured. Until then, AgroVani will not invent a market price.'
      : message.includes('dispatch') || message.includes('driver')
        ? 'Dispatch requests are shared through the driver network. Add a task or booking with a pickup location so a third-party driver can be assigned.'
        : 'I can help turn a crop recommendation into a task, explain a field action, or coordinate a buyer, seller, and driver. Tell me what you need next.'
  return ok({ reply, source: 'local_fallback' })
}

async function createAssistantReply(db, body) {
  if (!process.env.GEMINI_API_KEY) return localAssistantReply(body)

  const farm = body.farmId ? await db.collection('farms').findOne({ id: body.farmId }) : null
  if (body.farmId && !farm) return ok({ error: 'Farm not found' }, 404)

  const farmContext = farm
    ? `Farmer: ${farm.name}. Location: ${farm.village}, ${farm.district}, ${farm.state}. Crop: ${farm.cropType}. Area: ${farm.areaInAcres} acres. Soil pH: ${farm.soilPh ?? 'unknown'}. Nitrogen: ${farm.nitrogenKgPerHa ?? 'unknown'} kg/ha.`
    : 'No farm profile is available yet.'
  const liveContext = body.context ? `Current dashboard data (may be stale): ${JSON.stringify(body.context)}` : ''
  const language = body.locale === 'hi' ? 'Hindi' : body.locale === 'pa' ? 'Punjabi' : 'English'
  const systemInstruction = [
    'You are AgroVani, a concise and practical agricultural voice advisor for Indian farmers.',
    `Speak in ${language}. If the farmer speaks another supported Indian language, follow their language.`,
    'Use simple words, short sentences, and quantities with units. Ask one clarifying question when essential.',
    'Never invent weather, disease diagnoses, pesticide doses, or prices. Recommend consulting a local agronomist for high-risk chemical or medical questions.',
    farmContext,
    liveContext,
  ].join('\n')
  const model = process.env.GEMINI_MODEL || 'gemini-3.6-flash'
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: 'user', parts: [{ text: body.message || '' }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 300 },
    }),
  })

  const data = await response.json()
  if (!response.ok) {
    console.error('Gemini assistant error:', data)
    if (response.status === 401 || response.status === 403) {
      return localAssistantReply(body)
    }
    return ok({ error: 'Unable to get an assistant response. Please try again.' }, 502)
  }
  const reply = data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim()
  return reply ? ok({ reply }) : ok({ error: 'Assistant returned an empty response' }, 502)
}

async function createGeminiAudioReply(db, body) {
  if (!process.env.GEMINI_API_KEY) return ok({ error: 'Gemini voice assistant is not configured' }, 503)

  const audioData = typeof body?.audio === 'string' ? body.audio : ''
  if (!audioData) return ok({ error: 'Please record a voice question first.' }, 400)

  const farm = body.farmId ? await db.collection('farms').findOne({ id: body.farmId }) : null
  const farmContext = farm
    ? `Farmer: ${farm.name}. Location: ${farm.village}, ${farm.district}, ${farm.state}. Crop: ${farm.cropType}. Area: ${farm.areaInAcres} acres. Soil pH: ${farm.soilPh ?? 'unknown'}. Nitrogen: ${farm.nitrogenKgPerHa ?? 'unknown'} kg/ha.`
    : 'No farm profile is available yet.'
  const language = body.locale === 'hi' ? 'Hindi' : body.locale === 'pa' ? 'Punjabi' : 'English'
  const instruction = [
    'You are AgroVani, a concise and practical agricultural voice advisor for Indian farmers.',
    `Understand the recorded farmer question and answer in ${language}, or in the language spoken by the farmer.`,
    'Return only the spoken answer as plain text, with short sentences and no markdown.',
    'Never invent weather, disease diagnoses, pesticide doses, or prices. Recommend a local agronomist for high-risk chemical questions.',
    farmContext,
    body.context ? `Current dashboard data: ${JSON.stringify(body.context)}` : '',
  ].filter(Boolean).join('\n')
  const mimeType = typeof body.mimeType === 'string' && body.mimeType.startsWith('audio/') ? body.mimeType : 'audio/webm'
  const base64 = audioData.includes('base64,') ? audioData.split('base64,')[1] : audioData
  const model = process.env.GEMINI_MODEL || 'gemini-3.6-flash'

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: instruction }] },
      contents: [{ role: 'user', parts: [{ inline_data: { mime_type: mimeType, data: base64 } }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 300 },
    }),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    console.error('Gemini audio assistant error:', data)
    return ok({ error: 'Gemini could not understand the recording. Please try again.' }, 502)
  }
  const reply = data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim()
  return reply ? ok({ reply }) : ok({ error: 'Gemini returned an empty voice response' }, 502)
}

async function createGeminiVisionDiagnosis(body) {
  if (!process.env.GEMINI_API_KEY) {
    return ok({ error: 'Gemini API is not configured. Add GEMINI_API_KEY to the server environment.' }, 503)
  }

  const imageData = typeof body?.image === 'string' ? body.image : ''
  if (!imageData) {
    return ok({ error: 'Please upload a crop image before running the diagnosis.' }, 400)
  }

  const mimeType = typeof body?.mimeType === 'string' && body.mimeType.startsWith('image/') ? body.mimeType : 'image/jpeg'
  const base64 = imageData.includes('base64,') ? imageData.split('base64,')[1] : imageData
  const model = process.env.GEMINI_VISION_MODEL || process.env.GEMINI_MODEL || 'gemini-3.6-flash'

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        role: 'user',
        parts: [
          { text: buildGeminiVisionPrompt({ cropType: body?.cropType || 'Rice', farmName: body?.farmName || 'Farmer', location: body?.location || '' }) },
          { inline_data: { mime_type: mimeType, data: base64 } },
        ],
      }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 500,
        responseMimeType: 'application/json',
      },
    }),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    console.error('Gemini vision error:', data)
    return ok({ error: 'Gemini crop diagnosis failed. Check the image payload and GEMINI_API_KEY.' }, 502)
  }

  const parsed = parseGeminiResponse(data)
  const mapped = mapSymptomsToRecommendation({ cropType: body?.cropType || 'Rice', issue: parsed.issue, symptoms: parsed.symptoms || [parsed.issue] })
  const matchedProduct = PRODUCT_CATALOG.find((product) => product.name.toLowerCase() === String(parsed.product || mapped.product).toLowerCase())
  const dosageGuidance = matchedProduct
    ? `No dose is inferred from an image alone. Confirm ${matchedProduct.name} is registered for this crop and target, then follow the current India label for formulation, dose, water volume, and safety interval.`
    : 'No product dose is inferred from an image alone. Confirm the diagnosis with field scouting and follow the current registered India label.'

  return ok({
    ...parsed,
    mappedRecommendation: mapped,
    detectedIssue: parsed.issue || mapped.product,
    recommendation: parsed.recommendation || mapped.recommendation,
    product: parsed.product || mapped.product,
    category: parsed.category || mapped.category,
    confidence: Number(parsed.confidence ?? 0.7),
    dosageGuidance,
  })
}

async function handleRoute(request, { params }) {
  const { path = [] } = await params
  const route = `/${path.join('/')}`
  const method = request.method
  const { searchParams } = new URL(request.url)

  try {
    if (route === '/livekit/token' && method === 'POST') {
      if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET || !process.env.LIVEKIT_URL) {
        return ok({ error: 'LiveKit is not configured. Add LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET.' }, 503)
      }
      const room = `agrovani-${uuidv4()}`
      const identity = `farmer-${uuidv4()}`
      const token = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, { identity })
      token.addGrant({ roomJoin: true, room, canPublish: true, canSubscribe: true })
      return ok({ token: await token.toJwt(), url: process.env.LIVEKIT_URL, room })
    }

    if (route === '/crop-diagnose' && method === 'POST') {
      return createGeminiVisionDiagnosis(await request.json())
    }

    if (route === '/products' && method === 'GET') {
      const category = searchParams.get('category')
      const crop = searchParams.get('crop')
      const products = PRODUCT_CATALOG.filter((product) => !category || product.category === category)
        .filter((product) => !crop || !product.crops || product.crops.includes(crop))
        .map((product) => ({
          ...product,
          dosage: product.dosage || null,
          dosageGuidance: product.dosage
            ? `${product.dosage.rateMlPerLitre} ml/L. Verify the current registered India label after confirming the crop, target, formulation, water volume, and safety interval.`
            : 'Verify the current registered India label after confirming the crop, target, formulation, water volume, and safety interval. The API never invents a chemical dose.',
        }))
      return ok({ products, count: products.length })
    }

    if (route === '/mandi' && method === 'GET') {
      return ok(lookupMandiPrices({
        commodity: searchParams.get('commodity') || '',
        state: searchParams.get('state') || '',
        market: searchParams.get('market') || '',
      }))
    }

    if (route === '/msp' && method === 'GET') {
      const commodity = searchParams.get('commodity') || ''
      const modalPrice = searchParams.get('modalPrice')
      return ok(compareMsp({ commodity, modalPrice: modalPrice == null ? null : Number(modalPrice) }))
    }

    if (route === '/yield-prediction' && method === 'POST') {
      const body = await request.json()
      if (!body.crop || Number(body.areaInAcres) <= 0) return ok({ error: 'crop and a positive areaInAcres are required' }, 400)
      return ok(predictYield(body))
    }

    if (route === '/report/whatsapp' && method === 'POST') {
      return ok({ text: createWhatsAppText(await request.json()) })
    }

    if (route === '/report/pdf' && method === 'POST') {
      return pdf(buildFarmReportPdf(await request.json()))
    }

    if (route === '/payments/razorpay/order' && method === 'POST') {
      if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        return ok({ error: 'Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.' }, 503)
      }
      const body = await request.json()
      const plan = plans.find((item) => item.id === body.planId)
      if (!plan) return ok({ error: 'Unknown pricing plan' }, 400)
      if (plan.priceInr <= 0) return ok({ error: 'This plan does not require payment' }, 400)

      const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: plan.priceInr * 100,
          currency: 'INR',
          receipt: `agrovani-${plan.id}-${Date.now()}`.slice(0, 40),
          notes: { planId: plan.id, userEmail: body.userEmail || '', userRole: body.userRole || '' },
        }),
      })
      const order = await razorpayResponse.json().catch(() => ({}))
      if (!razorpayResponse.ok || !order.id) return ok({ error: order.error?.description || 'Razorpay order creation failed' }, 502)
      return ok({ orderId: order.id, amount: order.amount, currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID, planId: plan.id })
    }

    if (route === '/payments/razorpay/verify' && method === 'POST') {
      if (!process.env.RAZORPAY_KEY_SECRET) return ok({ error: 'Razorpay is not configured.' }, 503)
      const body = await request.json()
      const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = body
      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) return ok({ error: 'Incomplete Razorpay payment details' }, 400)
      const expected = createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(`${razorpayOrderId}|${razorpayPaymentId}`).digest('hex')
      const valid = expected.length === razorpaySignature.length && timingSafeEqual(Buffer.from(expected), Buffer.from(razorpaySignature))
      if (!valid) return ok({ error: 'Invalid Razorpay payment signature' }, 400)
      return ok({ verified: true, paymentId: razorpayPaymentId, orderId: razorpayOrderId, planId: body.planId || null })
    }

    if (route === '/recommendations' && method === 'POST') {
      const body = await request.json()
      const crop = body.crop || 'Rice'
      return ok(buildProductRecommendation({
        crop,
        state: body.state || 'India',
        areaInAcres: body.areaInAcres,
        usedProducts: Array.isArray(body.usedProducts) ? body.usedProducts : [],
        diagnostic: body.diagnostic || {},
      }))
    }

    if (route === '/yield-predict' && method === 'POST') {
      return createYieldPrediction(await request.json())
    }

    const db = await connectToDatabase()

    if (route === '/assistant' && method === 'POST') {
      return createAssistantReply(db, await request.json())
    }

    if (route === '/assistant/audio' && method === 'POST') {
      return createGeminiAudioReply(db, await request.json())
    }

    if ((route === '/' || route === '/root') && method === 'GET') {
      return ok({ message: 'AgroVani API', crops: CROP_LIST })
    }

    if (route === '/tasks' && method === 'GET') {
      const ownerId = searchParams.get('ownerId')
      const routeDb = await connectToDatabase()
      const tasks = await routeDb.collection('tasks').find(ownerId ? { ownerId } : {}).toArray()
      return ok(tasks)
    }

    if (route === '/tasks' && method === 'POST') {
      const body = await request.json()
      const task = { id: uuidv4(), ownerId: body.ownerId || 'farmer-local', title: body.title || 'Field check', instructions: body.instructions || '', dueDate: body.dueDate || new Date().toISOString().slice(0, 10), status: 'open', source: body.source || 'local_recommendation', createdAt: new Date() }
      const routeDb = await connectToDatabase()
      await routeDb.collection('tasks').insertOne(task)
      return ok(task, 201)
    }

    if (route === '/tasks' && method === 'PATCH') {
      const body = await request.json()
      const db = await connectToDatabase()
      const task = await db.collection('tasks').findOne({ id: body.id })
      if (!task) return ok({ error: 'Task not found' }, 404)
      task.status = body.status === 'done' ? 'done' : 'open'
      await db.collection('tasks').updateOne({ id: task.id }, { $set: task })
      return ok(task)
    }

    if (route === '/messages' && method === 'GET') {
      const routeDb = await connectToDatabase()
      const messages = await routeDb.collection('messages').find({}).toArray()
      return ok(messages)
    }

    if (route === '/messages' && method === 'POST') {
      const body = await request.json()
      const message = { id: uuidv4(), senderId: body.senderId || 'local-user', recipientId: body.recipientId || 'network', text: body.text || '', sourceLanguage: body.sourceLanguage || 'en', targetLanguage: body.targetLanguage || body.sourceLanguage || 'en', translatedText: body.text || '', createdAt: new Date() }
      const routeDb = await connectToDatabase()
      await routeDb.collection('messages').insertOne(message)
      return ok(message, 201)
    }

    if (route === '/earnings' && method === 'GET') {
      const ownerId = searchParams.get('ownerId')
      const routeDb = await connectToDatabase()
      const earnings = await routeDb.collection('earnings').find(ownerId ? { ownerId } : {}).toArray()
      return ok({ source: 'local_fallback', earnings, totalInr: earnings.reduce((sum, item) => sum + Number(item.amountInr || 0), 0) })
    }

    if (route === '/dispatch' && method === 'GET') {
      const routeDb = await connectToDatabase()
      const dispatch = await routeDb.collection('dispatch').find({}).toArray()
      return ok({ source: 'local_fallback', dispatch })
    }

    if (route === '/translate' && method === 'POST') {
      const body = await request.json()
      return ok({ source: process.env.TRANSLATION_API_URL ? 'provider' : 'local_fallback', sourceLanguage: body.sourceLanguage || 'auto', targetLanguage: body.targetLanguage || 'en', originalText: body.text || '', translatedText: body.text || '', message: process.env.TRANSLATION_API_URL ? 'Translation provider adapter is ready for implementation.' : 'Translation provider is not configured; original text is preserved.' })
    }

    if (route === '/satellite' && method === 'GET') {
      return ok({ source: process.env.ISRO_SATELLITE_API_URL ? 'provider' : 'local_fallback', status: process.env.ISRO_SATELLITE_API_URL ? 'configured' : 'not_configured', message: 'Satellite adapter is ready for an authorized ISRO/Bhuvan endpoint; no synthetic satellite reading is returned.' })
    }

    if (route === '/seed' && method === 'POST') {
      const result = await seedDb(db)
      return ok(result)
    }

    if (route === '/geocode' && method === 'GET') {
      const query = searchParams.get('query') || ''
      if (!query) return ok({ results: [] })
      const results = await geocodeLocation(query)
      return ok({ results })
    }

    if (route === '/farms' && method === 'POST') {
      const body = await request.json()
      const parsedBody = farmCreateSchema.safeParse(body)
      if (!parsedBody.success) return ok({ error: validationError(parsedBody) }, 400)
      const farmInput = parsedBody.data
      const farm = {
        id: uuidv4(), ownerId: farmInput.ownerId || farmInput.email || null,
        name: farmInput.name || 'Farmer', village: farmInput.village || '',
        district: farmInput.district || 'India', state: farmInput.state || '',
        cropType: farmInput.cropType || 'Rice', areaInAcres: farmInput.areaInAcres || 1,
        latitude: farmInput.latitude ?? 20.5937, longitude: farmInput.longitude ?? 78.9629,
        soilPh: farmInput.soilPh ?? null, nitrogenKgPerHa: farmInput.nitrogenKgPerHa ?? null,
        locale: farmInput.locale || 'en',
        createdAt: new Date(),
      }
      await db.collection('farms').insertOne(farm)
      const { _id, ...clean } = farm
      return ok(clean)
    }

    if (route === '/farms' && method === 'GET') {
      const id = searchParams.get('id')
      if (id) {
        const farm = await db.collection('farms').findOne({ id })
        if (!farm) return ok({ error: 'Farm not found' }, 404)
        const { _id, ...clean } = farm
        return ok(clean)
      }
      await seedDb(db)
      const farms = await db.collection('farms').find({}).limit(100).toArray()
      return ok(farms.map(({ _id, ...rest }) => rest))
    }

    if (route === '/buyer/farm-map' && method === 'GET') {
      await seedDb(db)
      const farms = await db.collection('farms').find({}).limit(1000).toArray()
      const uniqueFarms = [...new Map(farms.map((farm) => [farm.id, farm])).values()]
      return ok({
        country: 'India',
        farms: uniqueFarms.filter((farm) => farm.latitude && farm.longitude).map((farm) => ({
          id: farm.id,
          district: farm.district,
          state: farm.state,
          cropType: farm.cropType,
          latitude: farm.latitude,
          longitude: farm.longitude,
          availability: 'Available for buyer enquiry',
        })),
      })
    }

    if (route === '/buyer/needs' && method === 'GET') {
      const buyerId = searchParams.get('buyerId') || 'buyer@agrovani.in'
      const needs = await db.collection('buyer_needs').find({ buyerId }).sort({ createdAt: -1 }).limit(100).toArray()
      return ok(needs.map(({ _id, ...need }) => need))
    }

    if (route === '/buyer/needs' && method === 'POST') {
      const body = await request.json()
      if (!body.buyerId || !body.cropType || !body.residueType || Number(body.quantity) <= 0) {
        return ok({ error: 'buyerId, cropType, residueType and a positive quantity are required' }, 400)
      }
      const need = {
        id: uuidv4(),
        buyerId: body.buyerId,
        cropType: String(body.cropType).trim(),
        residueType: String(body.residueType).trim(),
        quantity: Number(body.quantity),
        useCase: String(body.useCase || 'Biomass processing').trim(),
        region: String(body.region || 'India').trim(),
        urgency: String(body.urgency || 'This month').trim(),
        notes: String(body.notes || '').trim(),
        status: 'open',
        createdAt: new Date(),
      }
      await db.collection('buyer_needs').insertOne(need)
      return ok(need, 201)
    }

    if (route === '/buyer/sellers' && method === 'GET') {
      await seedDb(db)
      const listings = await db.collection('marketplace_listings').find({ status: 'active', category: 'Residue' }).limit(200).toArray()
      const uniqueListings = [...new Map(listings.map((listing) => [listing.id, listing])).values()]
      return ok(uniqueListings.map(({ _id, ...listing }) => listing))
    }

    if (route === '/agri-loop' && method === 'GET') {
      const farmId = searchParams.get('farmId')
      const requestedArea = Number(searchParams.get('areaInAcres')) || Number(searchParams.get('area')) || 5
      let farm = null
      let area = requestedArea
      let district = searchParams.get('district') || 'Patiala'
      let cropType = searchParams.get('crop') || 'Rice'

      if (farmId) {
        farm = await db.collection('farms').findOne({ id: farmId })
        if (!farm) return ok({ error: 'Farm not found' }, 404)
        area = Number(farm.areaInAcres) || area
        district = farm.district || district
        cropType = farm.cropType || cropType
      }

      const stressDiagnostics = {
        scores: {
          diurnal: Number(searchParams.get('diurnal') || 2.4),
          night: Number(searchParams.get('night') || 3.1),
          frost: Number(searchParams.get('frost') || 0),
        },
        droughtIndex: { value: Number(searchParams.get('droughtIndex') || 1.15) },
      }

      const residue = computeResidue({ areaInAcres: area, district, cropType })
      const cropEconomics = computeFarmEconomics({
        crop: cropType,
        areaInAcres: area,
        diagnostic: stressDiagnostics,
      })
      const incentive = calculateIncentivePlan({
        orderValue: Number(searchParams.get('orderValue') || residue.totalValueINR || cropEconomics.grossRevenue || 100000),
        repeatBuyerDiscountPct: Number(searchParams.get('repeatBuyerDiscountPct') || 8),
        seedSellerBuybackPct: Number(searchParams.get('seedSellerBuybackPct') || 12),
        residualSellerIncentivePct: Number(searchParams.get('residualSellerIncentivePct') || 7),
        logisticsIncentivePct: Number(searchParams.get('logisticsIncentivePct') || 5),
        buyerRepeatCount: Number(searchParams.get('buyerRepeatCount') || 4),
      })
      const calendar = buildCropCalendar({
        cropType,
        sowingDate: searchParams.get('sowingDate') || '2026-06-15',
        weatherDelayDays: Number(searchParams.get('weatherDelayDays') || 0),
        harvestWindowDays: Number(searchParams.get('harvestWindowDays') || (cropType === 'Rice' ? 120 : 110)),
      })
      const yieldProjection = calculateYieldProjection({
        areaInAcres: area,
        expectedYieldTonsPerAcre: cropEconomics.expectedYieldTonsPerAcre,
        weatherDelayDays: Number(searchParams.get('weatherDelayDays') || 0),
        stressIndex: Number(searchParams.get('stressIndex') || 0.18),
        yieldLossPct: Number(searchParams.get('yieldLossPct') || 6),
      })

      return ok({
        farm: farm ? { id: farm.id, name: farm.name, cropType, district, areaInAcres: area } : null,
        residue,
        cropEconomics,
        incentive,
        cropCalendar: calendar,
        yieldProjection,
        network: {
          seedSeller: 'Seed seller / input partner',
          logistics: '3rd-party driver / aggregator',
          farmer: 'Farmer pickup & delivery',
          residueSeller: 'Residue buyer / biogas / compost partner',
        },
      })
    }

    if (route === '/marketplace/listings' && method === 'GET') {
      const sellerId = searchParams.get('sellerId')
      const query = sellerId ? { sellerId } : {}
      const listings = await db.collection('marketplace_listings').find(query).sort({ createdAt: -1 }).limit(200).toArray()
      return ok(listings.map(({ _id, ...rest }) => rest))
    }

    if (route === '/marketplace/listings' && method === 'POST') {
      const body = await request.json()
      const parsedBody = listingCreateSchema.safeParse(body)
      if (!parsedBody.success) return ok({ error: validationError(parsedBody) }, 400)
      const listingInput = parsedBody.data
      const listing = {
        id: uuidv4(), sellerId: listingInput.sellerId, name: listingInput.name, category: listingInput.category || 'Other',
        sellerName: listingInput.sellerName || listingInput.sellerId, sellerState: listingInput.sellerState || 'India', sellerPlace: listingInput.sellerPlace || 'India',
        expectedDeliveryDays: listingInput.expectedDeliveryDays || 7, listingType: listingInput.listingType || 'input',
        residueType: listingInput.residueType || null, qualityGrade: listingInput.qualityGrade || null,
        moisturePercent: listingInput.moisturePercent ?? null, quantityQuintals: listingInput.quantityQuintals ?? null,
        pickupDistrict: listingInput.pickupDistrict || '', notes: listingInput.notes || '', priceInr: listingInput.priceInr,
        stockUnits: listingInput.stockUnits || 0, status: 'active',
        createdAt: new Date(), updatedAt: new Date(),
      }
      await db.collection('marketplace_listings').insertOne(listing)
      if (listing.listingType === 'residue_need') {
        await db.collection('notifications').insertOne({
          id: uuidv4(), audience: 'farmer', type: 'buyer_listing', title: 'New buyer residue requirement',
          message: `${listing.sellerId} needs ${listing.quantityQuintals || 'available'} quintals of ${listing.residueType || 'crop residue'} in ${listing.pickupDistrict || 'your area'}.`,
          listingId: listing.id, read: false, createdAt: new Date(),
        })
      }
      return ok(listing, 201)
    }

    if (route === '/notifications' && method === 'GET') {
      const audience = searchParams.get('audience') || 'farmer'
      const notifications = await db.collection('notifications').find({ audience }).sort({ createdAt: -1 }).limit(100).toArray()
      return ok(notifications)
    }

    if (route === '/notifications' && method === 'PATCH') {
      const body = await request.json()
      const notification = await db.collection('notifications').findOne({ id: body.id })
      if (!notification) return ok({ error: 'Notification not found' }, 404)
      notification.read = true
      await db.collection('notifications').updateOne({ id: notification.id }, { $set: notification })
      return ok(notification)
    }

    if (route === '/marketplace/orders' && method === 'GET') {
      const sellerId = searchParams.get('sellerId')
      const buyerId = searchParams.get('buyerId')
      const query = sellerId ? { sellerId } : buyerId ? { buyerId } : {}
      const orders = await db.collection('marketplace_orders').find(query).sort({ createdAt: -1 }).limit(200).toArray()
      return ok(orders.map(({ _id, ...rest }) => rest))
    }

    if (route === '/marketplace/orders' && method === 'POST') {
      const body = await request.json()
      const parsedBody = orderCreateSchema.safeParse(body)
      if (!parsedBody.success) return ok({ error: validationError(parsedBody) }, 400)
      const orderInput = parsedBody.data
      const quantity = orderInput.quantity
      const listing = await db.collection('marketplace_listings').findOne({ id: orderInput.listingId })
      if (!listing) return ok({ error: 'Listing not found' }, 404)
      if (listing.status !== 'active') return ok({ error: 'This listing is no longer active' }, 409)
      if (Number(listing.stockUnits) < quantity) return ok({ error: `Only ${listing.stockUnits} units remain in this listing` }, 409)
      listing.stockUnits = Number(listing.stockUnits) - quantity
      listing.updatedAt = new Date()
      await db.collection('marketplace_listings').updateOne({ id: listing.id }, { $set: listing })
      const order = {
        id: uuidv4(), listingId: orderInput.listingId, farmId: orderInput.farmId || null, buyerId: orderInput.buyerId || null,
        sellerId: orderInput.sellerId, sellerName: listing.sellerName || orderInput.sellerName || orderInput.sellerId,
        sellerState: listing.sellerState || orderInput.sellerState || 'India', sellerPlace: listing.sellerPlace || orderInput.sellerPlace || 'India',
        expectedDeliveryDays: Number(listing.expectedDeliveryDays || orderInput.expectedDeliveryDays || 7),
        expectedDeliveryAt: new Date(Date.now() + Number(listing.expectedDeliveryDays || orderInput.expectedDeliveryDays || 7) * 86400000),
        listingName: listing.name, quantity, totalInr: orderInput.totalInr || Number(listing.priceInr) * quantity,
        status: 'new', createdAt: new Date(), updatedAt: new Date(),
      }
      await db.collection('marketplace_orders').insertOne(order)
      return ok(order, 201)
    }

    if (route === '/marketplace/orders' && method === 'PATCH') {
      const body = await request.json()
      const order = await db.collection('marketplace_orders').findOne({ id: body.id })
      if (!order) return ok({ error: 'Order not found' }, 404)
      const nextStatus = body.status || 'packed'
      if (!['new', 'packed', 'out_for_delivery', 'delivered'].includes(nextStatus)) return ok({ error: 'Invalid order status' }, 400)
      order.status = nextStatus
      order.updatedAt = new Date()
      if (db.collection('marketplace_orders').updateOne) await db.collection('marketplace_orders').updateOne({ id: order.id }, { $set: order })
      return ok(order)
    }

    if (route === '/admin/overview' && method === 'GET') {
      const [farms, bookings, logs, metrics] = await Promise.all([
        db.collection('farms').find({}).limit(1000).toArray(),
        db.collection('bookings').find({}).limit(1000).toArray(),
        db.collection('stress_diagnostic_logs').find({}).limit(1000).toArray(),
        db.collection('district_metrics').find({}).limit(1000).toArray(),
      ])
      const districts = metrics.map((metric) => {
        const districtFarms = farms.filter((farm) => farm.state === metric.state || farm.district === metric.district)
        return { ...metric, farmers: districtFarms.length, coverage: districtFarms.length ? Math.min(100, Math.round((districtFarms.filter((farm) => farm.latitude && farm.longitude).length / districtFarms.length) * 100)) : 0 }
      })
      return ok({ farmers: farms.length, bookings: bookings.length, diagnostics: logs.length, districts })
    }

    if (route === '/admin/reviews' && method === 'GET') {
      const reviews = await db.collection('admin_reviews').find({}).sort({ createdAt: -1 }).limit(200).toArray()
      const farms = await db.collection('farms').find({}).limit(1000).toArray()
      const reviewRows = reviews.length ? reviews : farms.map((farm) => ({ id: `farm-${farm.id}`, farmId: farm.id, reviewType: 'Farm verification', status: 'open', createdAt: farm.createdAt }))
      return ok(reviewRows.map((review) => ({ ...review, farm: farms.find((farm) => farm.id === review.farmId) || null })))
    }

    if (route === '/admin/reviews' && method === 'PATCH') {
      const body = await request.json()
      const review = await db.collection('admin_reviews').findOne({ id: body.id })
      if (!review && String(body.id || '').startsWith('farm-')) {
        const farmId = String(body.id).slice(5)
        const farm = await db.collection('farms').findOne({ id: farmId })
        if (farm) {
          const createdReview = { id: uuidv4(), farmId, reviewType: 'Farm verification', status: 'reviewed', createdAt: new Date(), reviewedAt: new Date() }
          await db.collection('admin_reviews').insertOne(createdReview)
          return ok(createdReview)
        }
      }
      if (!review) return ok({ error: 'Review not found' }, 404)
      review.status = body.status === 'reviewed' ? 'reviewed' : 'open'
      review.reviewedAt = review.status === 'reviewed' ? new Date() : null
      if (db.collection('admin_reviews').updateOne) await db.collection('admin_reviews').updateOne({ id: review.id }, { $set: review })
      return ok(review)
    }

    if (route === '/weather-map' && method === 'GET') {
      return ok(await fetchIndiaWeather())
    }

    if (route === '/stress' && method === 'GET') {
      const farmId = searchParams.get('farmId')
      let lat, lon, crop, area, soilPh, nitrogen, state
      if (farmId) {
        const farm = await db.collection('farms').findOne({ id: farmId })
        if (!farm) return ok({ error: 'Farm not found' }, 404)
        lat = farm.latitude
        lon = farm.longitude
        crop = farm.cropType
        area = farm.areaInAcres
        soilPh = farm.soilPh
        nitrogen = farm.nitrogenKgPerHa
        state = farm.state || 'India'
      } else {
        lat = Number(searchParams.get('lat'))
        lon = Number(searchParams.get('lon'))
        crop = searchParams.get('crop') || 'Rice'
        area = Number(searchParams.get('area')) || 5
        soilPh = searchParams.get('ph') ? Number(searchParams.get('ph')) : null
        nitrogen = searchParams.get('n') ? Number(searchParams.get('n')) : null
        state = searchParams.get('state') || 'India'
      }

      const weather = await fetchWeather(lat, lon)
      const diagnostic = computeStressDiagnostic({
        weather, crop, areaInAcres: area, soilPh, nitrogenKgPerHa: nitrogen,
        state,
      })
      diagnostic.economics = computeFarmEconomics({ crop, areaInAcres: area, diagnostic })
      const spray = await fetchSprayWindow(lat, lon, 'Foliar')
      const hydric = await fetchHydricStress(lat, lon, crop)

      const log = {
        id: uuidv4(),
        farmId: farmId || null,
        tmax: weather.tmax,
        tmin: weather.tmin,
        diurnalScore: diagnostic.scores.diurnal,
        nightScore: diagnostic.scores.night,
        frostScore: diagnostic.scores.frost,
        droughtIndex: diagnostic.droughtIndex?.value ?? null,
        recommendedProduct: diagnostic.product.product,
        sprayWindowStart: spray.windows?.[0]?.startTime || null,
        createdAt: new Date(),
      }
      try {
        await db.collection('stress_diagnostic_logs').insertOne(log)
      } catch (error) {
        console.warn('Stress diagnostic logging skipped:', error.message)
      }

      return ok({
        weather,
        diagnostic,
        sprayWindow: spray.windows,
        hydricStress: hydric.data,
        syngentaApi: {
          sprayWindow: spray.ok,
          sprayWindowCount: spray.windows.length,
          sprayWindowStatus: spray.status,
          sprayWindowError: spray.error || null,
          sprayWindowSource: spray.source || null,
          sprayWindowFallback: Boolean(spray.fallback),
          hydricStress: hydric.ok,
        },
        location: { latitude: lat, longitude: lon },
      })
    }

    if (route === '/residue' && method === 'GET') {
      const farmId = searchParams.get('farmId')
      let area, district, cropType
      if (farmId) {
        const farm = await db.collection('farms').findOne({ id: farmId })
        if (!farm) return ok({ error: 'Farm not found' }, 404)
        area = farm.areaInAcres
        district = farm.district
        cropType = farm.cropType
      } else {
        area = Number(searchParams.get('area')) || 5
        district = searchParams.get('district') || 'Patiala'
        cropType = searchParams.get('crop') || 'Rice'
      }
      const metric = await db.collection('district_metrics').findOne({ district })
      const machinery = await db.collection('machinery').find({ district }).limit(100).toArray()
      const districtData = metric
        ? {
            ...getDistrictData(district),
            ...metric,
          }
        : null
      const result = computeResidue({ areaInAcres: area, district, cropType, districtData })
      const [listings, orders] = await Promise.all([
        db.collection('marketplace_listings').find({ status: 'active', category: 'Residue' }).limit(1000).toArray(),
        db.collection('marketplace_orders').find({ farmId: farmId || null, status: { $in: ['new', 'packed', 'out_for_delivery'] } }).limit(1000).toArray(),
      ])
      const bookings = await db.collection('bookings').find({ farmId: farmId || null }).limit(100).toArray()
      const fieldMetrics = computeFieldReadiness({
        areaInAcres: area,
        cropType,
        residueTons: result.residueTons,
        machinery,
        bookings,
        activeListings: listings.length,
        activeOrders: orders.length,
        activeOrderQuantity: orders.reduce((total, order) => total + Math.max(0, Number(order.quantity) || 0), 0),
      })
      return ok({ ...result, ...fieldMetrics })
    }

    if (route === '/residue/profile' && method === 'GET') {
      const farmId = searchParams.get('farmId')
      const profile = farmId ? await db.collection('residue_profiles').findOne({ farmId }) : null
      return ok(profile || {})
    }

    if (route === '/residue/profile' && method === 'POST') {
      const body = await request.json()
      if (!body.farmId || !body.residueType || !body.qualityGrade || Number(body.quantityQuintals) <= 0) return ok({ error: 'farmId, residue type, quality grade and positive quantity are required' }, 400)
      const profile = { id: uuidv4(), farmId: body.farmId, residueType: body.residueType, qualityGrade: body.qualityGrade, quantityQuintals: Number(body.quantityQuintals), moisturePercent: body.moisturePercent != null ? Number(body.moisturePercent) : null, packaging: body.packaging || 'Loose', pickupReadyDate: body.pickupReadyDate || null, notes: body.notes || '', updatedAt: new Date() }
      const existing = await db.collection('residue_profiles').findOne({ farmId: profile.farmId })
      if (existing) { profile.id = existing.id; await db.collection('residue_profiles').updateOne({ id: existing.id }, { $set: profile }) } else await db.collection('residue_profiles').insertOne(profile)
      return ok(profile)
    }

    if (route === '/residue/operations' && method === 'GET') {
      const result = await buildResidueOperations({ db, farmId: searchParams.get('farmId') })
      return result.error ? ok({ error: result.error }, result.status) : ok(result)
    }

    if (route === '/residue/operations/plan' && method === 'POST') {
      const parsedBody = residuePlanSchema.safeParse(await request.json())
      if (!parsedBody.success) return ok({ error: validationError(parsedBody) }, 400)
      const result = await generateResiduePlan({ db, input: parsedBody.data })
      return result.error ? ok({ error: result.error }, result.status) : ok(result, 201)
    }

    if (route === '/machinery' && method === 'GET') {
      const district = searchParams.get('district')
      const type = searchParams.get('type')
      const query = {}
      if (district) query.district = district
      if (type) query.type = type
      const items = await db.collection('machinery').find(query).limit(100).toArray()
      return ok(items.map(({ _id, ...rest }) => rest))
    }

    if (route === '/bookings' && method === 'POST') {
      const body = await request.json()
      const booking = {
        id: uuidv4(),
        farmId: body.farmId || null,
        farmerName: body.farmerName || 'Farmer',
        machineryType: body.machineryType || 'Happy Seeder',
        provider: body.provider || '',
        district: body.district || '',
        date: body.date || new Date().toISOString().slice(0, 10),
        acres: Number(body.acres) || 1,
        status: 'requested',
        createdAt: new Date(),
      }
      await db.collection('bookings').insertOne(booking)
      const { _id, ...clean } = booking
      return ok(clean)
    }

    if (route === '/bookings' && method === 'GET') {
      const farmId = searchParams.get('farmId')
      const query = farmId ? { farmId } : {}
      const items = await db.collection('bookings').find(query).sort({ createdAt: -1 }).limit(100).toArray()
      return ok(items.map(({ _id, ...rest }) => rest))
    }

    if (route === '/district-metrics' && method === 'GET') {
      const district = searchParams.get('district')
      if (district) return ok({ district, ...getDistrictData(district) })
      return ok(Object.entries(DISTRICT_DATA).map(([districtName, values]) => ({ district: districtName, ...values })))
    }

    return ok({ error: `Route ${route} not found` }, 404)
  } catch (error) {
    console.error('API Error:', error)
    return ok({ error: 'Internal server error', detail: String(error?.message || error) }, 500)
  }
}

export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute
