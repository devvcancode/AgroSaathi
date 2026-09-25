'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import React from 'react'
import Link from 'next/link'
import FarmMapCard from '@/components/farmer/FarmMapCard'
import WeatherMapCard from '@/components/farmer/WeatherMapCard'
import BookMachineryCard from '@/components/farmer/BookMachineryCard'
import LiveKitVoiceAgent from '@/components/farmer/LiveKitVoiceAgent'
import RazorpayButton from '@/components/RazorpayButton'
import ResiduePanel from '@/components/farmer/ResiduePanel'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import InstallAppButton from '@/components/InstallAppButton'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { getRecommendationCopy } from '@/lib/i18n/recommendation'
import { plans } from '@/lib/data/plans'
import { apiUrl } from '@/lib/api'
import SupportDock from '@/components/SupportDock'
import {
  Wheat, FlaskConical, ArrowLeft, TrendingUp, Sun, Moon, Snowflake,
  Droplets, Sparkles, Clock, Mic, Camera, IndianRupee, AlertTriangle, Loader2, X,
} from 'lucide-react'

class DebugBoundary extends React.Component {
  constructor(p) { super(p); this.state = { err: null } }
  static getDerivedStateFromError(err) { return { err } }
  componentDidCatch(err) { console.error('Dashboard render error:', err) }
  render() {
    if (this.state.err) {
      return (
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <p className="text-lg font-semibold text-slate-900">Something went wrong loading this view.</p>
          <button onClick={() => this.setState({ err: null })} className="pill-dark mt-4">Retry</button>
        </div>
      )
    }
    return this.props.children
  }
}

function StressGauge({ label, value, icon: Icon, unit = '/9' }) {
  const v = Number(value) || 0
  const pct = Math.min(100, (v / 9) * 100)
  const color = v > 6 ? '#ef4444' : v > 4 ? '#f59e0b' : v > 2 ? '#eab308' : '#10b981'
  return (
    <div className="rounded-[24px] border border-white/70 bg-white/75 p-5 shadow-[0_12px_28px_rgba(0,0,0,0.04)] backdrop-blur-md">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon className="h-4 w-4" />
        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{label}</span>
      </div>
      <p className="mt-3 text-4xl font-bold tracking-tight" style={{ color }}>{v.toFixed(1)}<span className="ml-1 text-base font-medium text-slate-400">{unit}</span></p>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

export default function App() {
  const [farms, setFarms] = useState([])
  const [farm, setFarm] = useState(null)
  const [tab, setTab] = useState('crop')
  const [stress, setStress] = useState(null)
  const [residue, setResidue] = useState(null)
  const [agriLoop, setAgriLoop] = useState(null)
  const [machinery, setMachinery] = useState([])
  const [loading, setLoading] = useState(false)
  const [marketplaceListings, setMarketplaceListings] = useState([])
  const [buyerNotifications, setBuyerNotifications] = useState([])
  const [priceLock, setPriceLock] = useState(null)
  const [residueProfile, setResidueProfile] = useState({ residueType: 'Paddy straw', qualityGrade: 'Standard', quantityQuintals: '', moisturePercent: '', packaging: 'Loose', pickupReadyDate: '', notes: '' })
  const [residueSaveMessage, setResidueSaveMessage] = useState('')
  const [marketplaceMessage, setMarketplaceMessage] = useState('')
  const [availableProducts, setAvailableProducts] = useState([])
  const [usedProducts, setUsedProducts] = useState([])
  const [productSearch, setProductSearch] = useState('')
  const [productRecommendation, setProductRecommendation] = useState(null)
  const [recommendationLoading, setRecommendationLoading] = useState(false)
  const [recommendationError, setRecommendationError] = useState('')
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', text: 'Hello farmer! I am AgroSaathi. I can track your crop cycle, residue plan, and logistics status.' },
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatBusy, setChatBusy] = useState(false)
  const [orderReceipt, setOrderReceipt] = useState(null)
  const [voiceText, setVoiceText] = useState('')
  const [voiceReply, setVoiceReply] = useState('')
  const [listening, setListening] = useState(false)
  const [voiceMode, setVoiceMode] = useState('idle')
  const [cameraFile, setCameraFile] = useState(null)
  const liveDispatch = [
    { name: 'Sandeep', eta: '5 min', load: '12.4 qtl', status: 'Pickup in progress' },
    { name: 'Harpreet', eta: '11 min', load: '8.8 qtl', status: 'Residue buyer route' },
    { name: 'Balwan', eta: '18 min', load: '7.3 qtl', status: 'Seed drop en route' },
  ]
  const [cameraPreview, setCameraPreview] = useState('')
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [cameraDiagnosis, setCameraDiagnosis] = useState(null)
  const [cameraLoading, setCameraLoading] = useState(false)
  const recorderRef = useRef(null)
  const voiceChunksRef = useRef([])
  const voiceStreamRef = useRef(null)
  const cameraStreamRef = useRef(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const { locale, t } = useLanguage()
  const copy = t.dashboard
  const recommendationCopy = getRecommendationCopy(locale)

  function localizedProductName(product) {
    if (product === 'No stress product needed') return recommendationCopy.noStress
    if (product === 'Scout before spraying') return recommendationCopy.scout
    return product
  }

  function formatSprayTime(value) {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return new Intl.DateTimeFormat(locale === 'hi' ? 'hi-IN' : locale === 'pa' ? 'pa-IN' : 'en-IN', {
      weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    }).format(date)
  }

  function formatShortDate(value) {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return new Intl.DateTimeFormat(locale === 'hi' ? 'hi-IN' : locale === 'pa' ? 'pa-IN' : 'en-IN', {
      month: 'short', day: 'numeric',
    }).format(date)
  }

  function toggleUsedProduct(productName) {
    setUsedProducts((current) => {
      const next = current.includes(productName) ? current.filter((name) => name !== productName) : [...current, productName]
      if (farm && typeof window !== 'undefined') localStorage.setItem(`agrovani_used_products_${farm.id}`, JSON.stringify(next))
      return next
    })
  }

  async function getProductRecommendation() {
    if (!farm) return
    setRecommendationLoading(true)
    setRecommendationError('')
    try {
      const response = await fetch(apiUrl('/api/recommendations'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crop: farm.cropType,
          state: farm.state,
          areaInAcres: farm.areaInAcres,
          usedProducts,
          diagnostic: stress?.diagnostic || {},
        }),
      })
      const data = await response.json()
      if (!response.ok || data.error) throw new Error(data.error || 'Recommendation unavailable')
      setProductRecommendation(data)
    } catch (error) {
      setRecommendationError(error.message || 'Recommendation unavailable')
    } finally {
      setRecommendationLoading(false)
    }
  }

  function stopVoice() {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop()
      return
    }
    voiceStreamRef.current?.getTracks().forEach((track) => track.stop())
    voiceStreamRef.current = null
    setListening(false)
    setVoiceMode('idle')
  }

  async function startVoice() {
    if (listening) {
      stopVoice()
      return
    }

    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setVoiceText('Voice input needs a secure browser context and microphone support.')
      return
    }

    setVoiceText('Listening... Tap again when you finish your question.')
    setVoiceReply('')
    setVoiceMode('listening')
    setListening(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } })
      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((type) => MediaRecorder.isTypeSupported(type)) || ''
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      voiceStreamRef.current = stream
      voiceChunksRef.current = []
      recorderRef.current = recorder
      recorder.ondataavailable = (event) => { if (event.data.size > 0) voiceChunksRef.current.push(event.data) }
      recorder.onerror = () => {
        setVoiceText('Voice recording failed. Please try again.')
        stopVoice()
      }
      recorder.onstop = async () => {
        const blob = new Blob(voiceChunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        voiceChunksRef.current = []
        recorderRef.current = null
        voiceStreamRef.current?.getTracks().forEach((track) => track.stop())
        voiceStreamRef.current = null
        if (!blob.size) {
          setVoiceText('No speech was recorded. Please try again.')
          setListening(false)
          setVoiceMode('idle')
          return
        }
        setListening(false)
        setVoiceMode('thinking')
        setVoiceText('Gemini is understanding your question...')
        const reader = new FileReader()
        reader.onload = async () => {
          try {
            const response = await fetch(apiUrl('/api/assistant/audio'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                audio: reader.result,
                mimeType: blob.type || 'audio/webm',
                farmId: farm?.id || null,
                locale,
                context: stress || residue || { farm: farm?.cropType || 'Rice' },
              }),
            })
            const data = await response.json()
            if (!response.ok || !data.reply) throw new Error(data.error || 'Gemini voice assistant error')
            setVoiceReply(data.reply)
            setVoiceText('Question answered by Gemini.')
            setVoiceMode('idle')
            if ('speechSynthesis' in window) {
              window.speechSynthesis.cancel()
              window.speechSynthesis.speak(new SpeechSynthesisUtterance(data.reply))
            }
          } catch (error) {
            setVoiceReply(error.message || 'Gemini could not answer right now. Try again.')
            setVoiceMode('idle')
          }
        }
        reader.readAsDataURL(blob)
      }
      recorder.start()
    } catch (error) {
      setVoiceText(error.name === 'NotAllowedError' ? 'Microphone permission was denied.' : error.message || 'Unable to start voice recording.')
      setListening(false)
      setVoiceMode('idle')
    }
  }

  function stopCamera() {
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop())
    cameraStreamRef.current = null
    setCameraOpen(false)
  }

  async function openCamera() {
    setCameraError('')
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera access is not supported in this browser. Use Upload photo instead.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      cameraStreamRef.current = stream
      setCameraOpen(true)
    } catch (error) {
      setCameraError(error.name === 'NotAllowedError' ? 'Camera permission was denied. Enable it in browser settings or use Upload photo.' : 'Unable to start the camera. Use Upload photo instead.')
    }
  }

  async function diagnoseCropImage(file) {
    if (!file) return
    setCameraLoading(true)
    setCameraError('')
    setCameraDiagnosis(null)

    try {
      const reader = new FileReader()
      reader.onload = async () => {
        try {
            const response = await fetch(apiUrl('/api/crop-diagnose'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image: reader.result,
              mimeType: file.type || 'image/jpeg',
              cropType: farm?.cropType || 'Rice',
              farmName: farm?.name || 'Farmer',
              location: farm ? `${farm.village || ''}, ${farm.district || ''}`.trim() : '',
            }),
          })
          const data = await response.json()
          if (!response.ok || !data.issue) throw new Error(data.error || 'Crop diagnosis failed')
          setCameraDiagnosis(data)
        } catch (error) {
          setCameraError(error.message || 'Diagnosis failed. Please try another image.')
        } finally {
          setCameraLoading(false)
        }
      }
      reader.readAsDataURL(file)
    } catch (error) {
      setCameraError(error.message || 'Unable to read image file.')
      setCameraLoading(false)
    }
  }

  function captureCamera() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !video.videoWidth) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob(async (blob) => {
      if (blob) {
        const file = new File([blob], `crop-${Date.now()}.jpg`, { type: 'image/jpeg' })
        setCameraFile(file)
        await diagnoseCropImage(file)
      }
      stopCamera()
    }, 'image/jpeg', 0.9)
  }

  useEffect(() => () => stopVoice(), [])
  useEffect(() => () => stopCamera(), [])
  useEffect(() => {
    if (!cameraFile) {
      setCameraPreview('')
      return undefined
    }
    const previewUrl = URL.createObjectURL(cameraFile)
    setCameraPreview(previewUrl)
    return () => URL.revokeObjectURL(previewUrl)
  }, [cameraFile])

  useEffect(() => {
    if (cameraOpen && videoRef.current && cameraStreamRef.current) {
      videoRef.current.srcObject = cameraStreamRef.current
    }
  }, [cameraOpen])

  useEffect(() => {
    const p = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('tab') : null
    if (p === 'crop') setTab('crop')
    if (p === 'residue') setTab('residue')

    async function loadFarms() {
      try {
        let res = await fetch(apiUrl('/api/farms'))
        let list = await res.json()
        if (!res.ok || !Array.isArray(list)) throw new Error(list.error || 'Unable to load farms')
        const farmsArr = Array.isArray(list) ? list : []
        setFarms(farmsArr)
        const savedId = typeof window !== 'undefined' ? localStorage.getItem('fv_farmId') : null
        const initial = farmsArr.find((f) => f.id === savedId) || farmsArr[0] || null
        setFarm(initial)
      } catch (e) {
        console.error('Farm loading failed:', e)
        setFarms([])
      }
    }
    loadFarms()
  }, [])

  const loadData = useCallback((f) => {
    if (!f) return
    setLoading(true)
    setStress(null)
    setResidue(null)
    setAgriLoop(null)
    setMarketplaceListings([])
    setMarketplaceMessage('')
    setProductRecommendation(null)
    setRecommendationError('')
    try {
      const savedProducts = JSON.parse(localStorage.getItem(`agrovani_used_products_${f.id}`) || '[]')
      setUsedProducts(Array.isArray(savedProducts) ? savedProducts : [])
    } catch {
      setUsedProducts([])
    }

    fetch(apiUrl(`/api/products?crop=${encodeURIComponent(f.cropType || 'Rice')}`))
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok || !Array.isArray(data.products)) throw new Error(data.error || 'Product catalog unavailable')
        setAvailableProducts(data.products)
      })
      .catch((error) => {
        console.error('Product catalog loading failed:', error)
        setAvailableProducts([])
      })

    fetch(apiUrl(`/api/residue?farmId=${f.id}`))
      .then(async (r) => {
        const data = await r.json()
        if (!r.ok || data.error) throw new Error(data.error || 'Residue data unavailable')
        setResidue(data)
        return data
      })
      .then(async (data) => {
        const orderValue = Number(data?.totalValueINR || 100000)
        const response = await fetch(apiUrl(`/api/agri-loop?farmId=${f.id}&orderValue=${encodeURIComponent(orderValue)}`))
        const agriData = await response.json()
        if (!response.ok || agriData.error) throw new Error(agriData.error || 'Agri loop data unavailable')
        setAgriLoop(agriData)
        return agriData
      })
      .catch((error) => console.error('Agri loop loading failed:', error))

    fetch(apiUrl(`/api/residue/profile?farmId=${f.id}`)).then((r) => r.json()).then((profile) => { if (profile?.farmId) setResidueProfile((current) => ({ ...current, ...profile })) }).catch(() => {})

    fetch(apiUrl(`/api/machinery?district=${encodeURIComponent(f.district || '')}`))
      .then(async (r) => {
        const data = await r.json()
        if (!r.ok || !Array.isArray(data)) throw new Error(data.error || 'Machinery data unavailable')
        return data
      })
      .then(setMachinery)
      .catch((error) => {
        console.error('Machinery loading failed:', error)
        setMachinery([])
      })

    fetch(apiUrl('/api/marketplace/listings'))
      .then(async (r) => {
        const data = await r.json()
        if (!r.ok || !Array.isArray(data)) throw new Error(data.error || 'Marketplace listings unavailable')
        setMarketplaceListings(data.slice(0, 4))
      })
      .catch((error) => console.error('Marketplace loading failed:', error))

    fetch(apiUrl(`/api/notifications?audience=farmer&farmId=${encodeURIComponent(f.id)}`))
      .then(async (r) => { const data = await r.json(); if (!r.ok || !Array.isArray(data)) throw new Error(data.error || 'Notifications unavailable'); setBuyerNotifications(data) })
      .catch((error) => console.error('Buyer notification loading failed:', error))

    fetch(apiUrl(`/api/marketplace/availability?cropType=${encodeURIComponent(f.cropType || 'Rice')}&region=${encodeURIComponent(f.state || f.district || 'Punjab')}`))
      .then(async (r) => { const data = await r.json(); if (!r.ok || !data) return; if (data.mandiPricePerQtl) setPriceLock({ marketPrice: data.mandiPricePerQtl, suggestedLock: Math.round(data.mandiPricePerQtl * 0.96) }) })
      .catch(() => {})

    fetch(apiUrl(`/api/stress?farmId=${f.id}`))
      .then(async (r) => {
        const data = await r.json()
        if (!r.ok || data.error) throw new Error(data.error || 'Stress data unavailable')
        return data
      })
      .then(setStress)
      .catch((error) => console.error('Stress loading failed:', error))
      .finally(() => setLoading(false))
  }, [])

  async function placeMarketplaceOrder(listing) {
    if (!listing || !farm) return
    const quantity = Number(window.prompt(`How many units of ${listing.name} do you want to buy?`, '1')) || 1
    const payload = {
      sellerId: listing.sellerId,
      listingId: listing.id,
      farmId: farm.id,
      quantity,
      totalInr: Number(listing.priceInr) * quantity,
    }

    try {
      const response = await fetch(apiUrl('/api/marketplace/orders'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to place order')
      const grossTotal = Number(data.totalInr || payload.totalInr)
      const incentive = agriLoop?.incentive || {}
      const incentiveAmount = Math.round(grossTotal * (Number(incentive.incentivePct || 12) / 100))
      const repeatDiscount = Math.round(grossTotal * 0.05)
      const netPayable = Math.max(0, grossTotal - incentiveAmount - repeatDiscount)
      setMarketplaceMessage(`Order placed: ${quantity} x ${listing.name} for ₹${grossTotal.toLocaleString('en-IN')}`)
      setOrderReceipt({
        orderId: data.id,
        listingName: listing.name,
        quantity,
        grossTotal,
        incentiveAmount,
        incentivePct: incentive.incentivePct || 12,
        repeatDiscount,
        netPayable,
      })
    } catch (error) {
      setMarketplaceMessage(error.message || 'Unable to place order')
    }
  }

  async function saveResidueProfile(event) {
    event.preventDefault()
    if (!farm) return
    const response = await fetch(apiUrl('/api/residue/profile'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...residueProfile, farmId: farm.id }) })
    const data = await response.json()
    setResidueSaveMessage(response.ok ? 'Residue details updated for buyers.' : data.error || 'Unable to update residue details')
    if (response.ok) setResidueProfile((current) => ({ ...current, ...data }))
  }

  useEffect(() => { if (farm) loadData(farm) }, [farm, loadData])

  const diag = stress?.diagnostic
  const sprayWindows = stress?.sprayWindow || []
  const syngentaApi = stress?.syngentaApi

  const cropTimeline = useMemo(() => {
    const fallback = [
      { label: 'Field prep', date: '2026-06-03', status: 'Soil moisture stable', confidence: 92, stage: 'Preparation' },
      { label: 'Sowing window', date: '2026-06-15', status: 'Ideal for direct seeding', confidence: 89, stage: 'Sowing' },
      { label: 'Vegetative growth', date: '2026-07-18', status: 'Nitrogen needs monitoring', confidence: 84, stage: 'Growth' },
      { label: 'Harvest ready', date: '2026-10-10', status: 'Residue collection can start', confidence: 88, stage: 'Harvest' },
    ]

    const milestones = agriLoop?.cropCalendar?.milestones?.length ? agriLoop.cropCalendar.milestones : fallback
    const weatherRisk = stress?.diagnostic?.scores ? 'Weather factors stable' : 'Weather risk monitored'
    const residueStatus = residue?.riskLevel ? `Residue risk: ${residue.riskLevel}` : 'Residue readiness high'

    return milestones.map((item, index) => ({
      ...item,
      index,
      status: item.status || [weatherRisk, residueStatus, 'Driver schedule aligned'][index % 3],
      confidence: item.confidence || [92, 89, 85, 88][index] || 80,
      stage: item.stage || ['Preparation', 'Sowing', 'Growth', 'Harvest'][index] || 'Monitoring',
    }))
  }, [agriLoop, residue, stress])

  const liveUpdates = useMemo(() => [
    { source: 'Farmer field', note: `Field conditions: ${stress?.diagnostic?.scores ? 'stress monitored' : 'stable'}`, tone: 'emerald' },
    { source: 'Seller network', note: `Marketplace demand: ${marketplaceListings.length ? `${marketplaceListings.length} active offers` : 'waiting for buyer demand'}`, tone: 'amber' },
    { source: 'Driver fleet', note: `Pickup queues: ${marketplaceListings.length ? '3 trips aligned' : 'route setup live'}`, tone: 'violet' },
    { source: 'Weather signal', note: `Crop cycle confidence: ${cropTimeline[0]?.confidence || 88}% based on live weather and field context`, tone: 'sky' },
  ], [cropTimeline, marketplaceListings.length, stress])

  const matchMessage = buyerNotifications.find((notification) => notification.type === 'buyer_demand')

  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase()
    return availableProducts.filter((product) => !query || `${product.name} ${product.type} ${product.category} ${product.targets}`.toLowerCase().includes(query))
  }, [availableProducts, productSearch])

  async function sendAgroSaathiMessage(event) {
    event.preventDefault()
    const trimmed = chatInput.trim()
    if (!trimmed || chatBusy) return

    const prompt = trimmed
    setChatMessages((current) => [...current, { role: 'user', text: prompt }])
    setChatInput('')
    setChatBusy(true)

    try {
      const response = await fetch(apiUrl('/api/assistant'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          locale,
          farmId: farm?.id || null,
          context: { stress, residue, agriLoop, cropTimeline: cropTimeline.slice(0, 4) },
        }),
      })
      const data = await response.json()
      if (!response.ok || !data.reply) throw new Error(data.error || 'AgroSaathi could not respond right now.')
      setChatMessages((current) => [...current, { role: 'assistant', text: data.reply }])
    } catch (error) {
      setChatMessages((current) => [...current, { role: 'assistant', text: error.message || 'AgroSaathi is temporarily unavailable.' }])
    } finally {
      setChatBusy(false)
    }
  }

  return (
    <DebugBoundary>
      <main className="page-farmer min-h-screen p-4 md:p-8">
        <div className="mx-auto max-w-7xl">
          <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900">
              <ArrowLeft className="h-4 w-4" /> AgroVani
            </Link>
            <div className="flex flex-wrap items-center gap-2"><Link href="/farmer/yield" className="glass-btn">Yield pulse</Link><Link href="/farmer/weather" className="glass-btn">Live weather</Link><Link href="/farmer/operations" className="glass-btn">Operations</Link><Link href="/plans" className="glass-btn">Our Plans</Link><LanguageSwitcher /><InstallAppButton compact /></div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="inline-flex rounded-full border border-white/80 bg-white/70 p-1 shadow-[0_8px_20px_rgba(0,0,0,0.05)] backdrop-blur-md">
                <Link href="/farmer/operations" className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900"><Wheat className="h-4 w-4" /> Operations</Link>
                <button onClick={() => setTab('crop')} className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition ${tab === 'crop' ? 'bg-[#006a42] text-white shadow-md shadow-emerald-600/20' : 'text-slate-600 hover:text-slate-900'}`}>
                  <FlaskConical className="h-4 w-4" /> Live Weather
                </button>
              </div>

              <div className="flex items-center gap-3 rounded-full border border-white/80 bg-white/70 px-4 py-2 shadow-[0_8px_20px_rgba(0,0,0,0.04)] backdrop-blur-md">
                <span className="text-sm font-medium text-slate-600">{copy.farm}:</span>
                <select
                  className="bg-transparent text-sm font-semibold text-slate-900 focus:outline-none"
                  value={farm?.id || ''}
                  onChange={(e) => setFarm(farms.find((f) => f.id === e.target.value))}
                >
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>{f.name} • {f.village} ({f.cropType})</option>
                  ))}
                </select>
              </div>
            </div>
          </header>

          {loading && (
            <div className="mb-6 flex items-center gap-2 rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-sm text-slate-600 shadow-sm backdrop-blur-md">
              <Loader2 className="h-4 w-4 animate-spin" /> Fetching live weather & agronomic data…
            </div>
          )}

          {tab === 'residue' && (
            <div className="grid gap-6 lg:grid-cols-3">
              <ResiduePanel
                farm={farm}
                residue={residue}
                onSave={(updatedProfile) => setResidueSaveMessage('Residue details updated for buyers.')}
              />
              <div className="glass-card card-3d">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">{copy.residueForecast}</p>
                <p className="mt-4 text-5xl font-bold tracking-tight text-slate-900">{residue ? (residue.residueTons / (farm?.areaInAcres || 1)).toFixed(1) : '—'} <span className="text-lg font-medium text-slate-500">t/acre</span></p>
                <p className="mt-3 text-sm text-slate-600">{residue?.residueTons ?? '—'} tons total across {farm?.areaInAcres ?? '—'} acres</p>
              </div>

              <div className="glass-card card-3d">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">{copy.buyerDemand}</p>
                <p className="mt-4 text-5xl font-bold tracking-tight text-emerald-600">{residue?.buyerDemand || '—'}</p>
                <p className="mt-3 flex items-center gap-1 text-sm text-slate-600"><IndianRupee className="h-4 w-4" /> {residue?.totalValueINR?.toLocaleString('en-IN') ?? '—'} potential value</p>
                {priceLock && (
                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                    <p className="font-bold">Mandi-linked price lock</p>
                    <p className="mt-1">Current rate: ₹{priceLock.marketPrice}/qtl · Suggested lock: ₹{priceLock.suggestedLock}/qtl</p>
                  </div>
                )}
                <Link href="/farmer/yield" className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800 transition hover:-translate-y-0.5 hover:bg-emerald-100"><TrendingUp className="h-4 w-4" /> Check yield percentage</Link>
                <BookMachineryCard farm={farm} defaultType="Baler" triggerLabel="Sell Stubble" triggerClass="pill-dark mt-4 w-full" />
              </div>

              <div className="glass-card card-3d">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">{copy.machineryReadiness}</p>
                <p className="mt-4 text-5xl font-bold tracking-tight text-slate-900">{residue?.machineryReadiness ?? '—'}<span className="text-2xl font-medium text-slate-500">%</span></p>
                <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                  <AlertTriangle className={`h-4 w-4 ${residue?.riskLevel === 'High' ? 'text-red-500' : 'text-amber-500'}`} />
                  Stubble risk: <span className="font-semibold">{residue?.riskLevel || '—'}</span> • {residue?.hotspots ?? 0} hotspots
                </div>
              </div>

              <div className="lg:col-span-2">
                <FarmMapCard lat={farm?.latitude} lon={farm?.longitude} mode="residue" title="Residue & Machinery Map" />
              </div>

              <div className="glass-card card-3d flex flex-col">
                <h3 className="text-xl font-semibold text-slate-900">Equipment</h3>
                <p className="mt-2 text-sm text-slate-600">Nearby custom hiring centers</p>
                <ul className="mt-4 space-y-3 text-sm text-slate-700">
                  {machinery.slice(0, 4).map((item) => (
                    <li key={item.id || `${item.type}-${item.provider}`} className="flex items-center justify-between rounded-2xl bg-white/60 px-4 py-3">
                      <span>{item.type}<span className="ml-2 text-xs text-slate-500">{item.provider}</span></span>
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${item.available === false ? 'bg-slate-100 text-slate-500' : 'bg-emerald-100 text-emerald-700'}`}>{item.available === false ? 'Unavailable' : 'Available'}</span>
                    </li>
                  ))}
                  {!machinery.length && <li className="rounded-2xl bg-white/60 px-4 py-3 text-slate-500">No machinery records found for this district.</li>}
                </ul>
                <div className="mt-auto pt-4">
                  <BookMachineryCard farm={farm} defaultType="Happy Seeder" triggerLabel="Request Equipment" triggerClass="pill-dark w-full" />
                </div>
              </div>

              <div className="glass-card card-3d lg:col-span-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">Marketplace</p>
                    <h3 className="mt-2 text-2xl font-bold text-slate-900">Buy seed inputs & raw materials</h3>
                  </div>
                  <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">AgriLoop buyers</span>
                </div>

                {buyerNotifications.length > 0 && <div className="mt-4 space-y-2">{buyerNotifications.slice(0, 3).map((notification) => <div key={notification.id} className="flex items-start justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">New buyer requirement</p><p className="mt-1 text-sm font-semibold">{notification.message}</p></div><button type="button" onClick={() => { fetch(apiUrl('/api/notifications'), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: notification.id }) }).catch(() => {}); setBuyerNotifications((items) => items.filter((item) => item.id !== notification.id)) }} className="text-xs font-semibold text-amber-700">Dismiss</button></div>)}</div>}

                {matchMessage && (
                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                    <p className="font-bold">Buyer demand alert</p>
                    <p className="mt-1">{matchMessage.message}</p>
                  </div>
                )}

                {marketplaceMessage && (
                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{marketplaceMessage}</div>
                )}

                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  {marketplaceListings.length ? marketplaceListings.map((listing) => (
                    <div key={listing.id} className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-lg font-bold text-slate-900">{listing.name}</p>
                          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">{listing.category}</p>
                        </div>
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">{listing.stockUnits} units</span>
                      </div>
                      <div className="mt-4 flex items-center justify-between text-sm text-slate-700">
                        <span>Price</span>
                        <span className="text-xl font-bold text-slate-900">₹{Number(listing.priceInr).toLocaleString('en-IN')}</span>
                      </div>
                      <button type="button" onClick={() => placeMarketplaceOrder(listing)} className="pill-dark mt-4 w-full">Buy now</button>
                    </div>
                  )) : (
                    <div className="rounded-[22px] border border-dashed border-slate-200 bg-white/60 p-6 text-sm text-slate-500 lg:col-span-2">No active marketplace listings yet.</div>
                  )}
                </div>
              </div>

              <div className="glass-card card-3d lg:col-span-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-600">Crop cycle planner</p>
                    <h3 className="mt-2 text-2xl font-bold text-slate-900">Farmer timeline and live side updates</h3>
                  </div>
                  <span className="badge-green">{cropTimeline[0]?.confidence || 88}% model confidence</span>
                </div>

                <div className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="rounded-[26px] border border-slate-200 bg-white/80 p-5 shadow-sm">
                    <div className="mb-5 flex items-center justify-between">
                      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Crop life cycle</p>
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">Field guidance synced</span>
                    </div>

                    <div className="space-y-4">
                      {cropTimeline.map((step) => (
                        <div key={`${step.label}-${step.date}`} className="relative pl-8">
                          <div className="absolute left-0 top-1 h-4 w-4 rounded-full border-4 border-white bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.12)]" />
                          <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="text-base font-bold text-slate-900">{step.label}</p>
                                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{step.stage}</p>
                              </div>
                              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">{formatShortDate(step.date)}</span>
                            </div>
                            <p className="mt-3 text-sm leading-6 text-slate-600">{step.status}</p>
                            <div className="mt-3 flex items-center justify-between text-xs font-medium text-slate-500">
                              <span>Model confidence</span>
                              <span className="text-slate-900">{step.confidence}%</span>
                            </div>
                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                              <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-sky-500" style={{ width: `${step.confidence}%` }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-[24px] border border-slate-200 bg-white/80 p-5 shadow-sm">
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Live updates</p>
                      <div className="mt-4 space-y-3">
                        {liveUpdates.map((update) => (
                          <div key={update.source} className={`rounded-2xl border p-3 ${update.tone === 'emerald' ? 'border-emerald-200 bg-emerald-50' : update.tone === 'amber' ? 'border-amber-200 bg-amber-50' : update.tone === 'violet' ? 'border-violet-200 bg-violet-50' : 'border-sky-200 bg-sky-50'}`}>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{update.source}</p>
                            <p className="mt-2 text-sm leading-6 text-slate-700">{update.note}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-slate-200 bg-slate-900 p-5 text-white shadow-sm">
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-300">Next critical action</p>
                      <p className="mt-3 text-lg font-bold">Use the next sowing window before residue burn risk spikes.</p>
                      <p className="mt-2 text-sm leading-6 text-slate-300">Apply recommended residue collection and arrange pickup with the driver route before 10:00 AM.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-card card-3d lg:col-span-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-violet-600">AgroSaathi</p>
                    <h3 className="mt-2 text-2xl font-bold text-slate-900">Custom agriculture assistant</h3>
                  </div>
                  <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">LIVE</span>
                </div>

                <div className="mt-5">
                  <div className="rounded-[24px] border border-slate-200 bg-white/80 p-4 shadow-sm">
                    <div className="flex min-h-[240px] flex-col gap-3 overflow-y-auto pr-1">
                      {chatMessages.map((message, index) => (
                        <div key={`${message.role}-${index}`} className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === 'assistant' ? 'bg-violet-50 text-violet-900' : 'ml-auto bg-slate-900 text-white'}`}>
                          {message.text}
                        </div>
                      ))}
                    </div>

                    <form onSubmit={sendAgroSaathiMessage} className="mt-4 space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {['Suggest my next sowing step', 'What is my residue plan?', 'When should I book pickup?'].map((prompt) => (
                          <button key={prompt} type="button" onClick={() => setChatInput(prompt)} className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700">
                            {prompt}
                          </button>
                        ))}
                      </div>

                      <div className="flex gap-3">
                        <input
                          value={chatInput}
                          onChange={(event) => setChatInput(event.target.value)}
                          placeholder="Ask AgroSaathi about crop, residue, or logistics..."
                          className="h-12 flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-violet-300 focus:bg-white"
                        />
                        <button type="submit" disabled={chatBusy} className="pill-dark disabled:opacity-70">{chatBusy ? 'Thinking...' : 'Send'}</button>
                      </div>
                    </form>
                  </div>

                </div>
              </div>

              <div className="glass-card card-3d lg:col-span-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-600">AgriLoop</p>
                    <h3 className="mt-2 text-2xl font-bold text-slate-900">Seed to residue circular commerce</h3>
                  </div>
                  <span className="badge-green">{agriLoop?.incentive?.incentivePct ?? '12–22'}% incentive plan</span>
                </div>

                <div className="mt-6 grid gap-5 lg:grid-cols-[1.15fr_1fr_1fr]">
                  <div className="rounded-[24px] border border-emerald-100 bg-emerald-50/80 p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-700">Incentive engine</p>
                    <p className="mt-4 text-4xl font-bold tracking-tight text-slate-900">₹{agriLoop?.incentive?.totalIncentive?.toLocaleString('en-IN') || '18,400'}</p>
                    <p className="mt-2 text-sm text-slate-600">Net payable: ₹{agriLoop?.incentive?.netPayable?.toLocaleString('en-IN') || '81,600'}</p>
                    <ul className="mt-4 space-y-2 text-sm text-slate-700">
                      <li>• Repeat buyer: ₹{agriLoop?.incentive?.discountBreakdown?.repeatBuyerDiscount?.toLocaleString('en-IN') || '8,000'}</li>
                      <li>• Seed buyback: ₹{agriLoop?.incentive?.discountBreakdown?.seedSellerBuyback?.toLocaleString('en-IN') || '12,000'}</li>
                      <li>• Residue seller: ₹{agriLoop?.incentive?.discountBreakdown?.residualSellerIncentive?.toLocaleString('en-IN') || '7,000'}</li>
                    </ul>
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">Harvest & sowing timeline</p>
                    <p className="mt-4 text-xl font-bold text-slate-900">{agriLoop?.cropCalendar?.cropType || farm?.cropType || 'Rice'}</p>
                    <div className="mt-4 space-y-3 text-sm text-slate-600">
                      {agriLoop?.cropCalendar?.milestones?.slice(0, 4).map((item) => (
                        <div key={item.label} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                          <span>{item.label}</span>
                          <span className="font-medium text-slate-800">{formatShortDate(item.date)}</span>
                        </div>
                      )) || (
                        <>
                          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"><span>Land prep</span><span className="font-medium text-slate-800">Jun 3</span></div>
                          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"><span>Sowing</span><span className="font-medium text-slate-800">Jun 15</span></div>
                          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"><span>Harvest</span><span className="font-medium text-slate-800">Oct 13</span></div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">Yield & next crop</p>
                    <p className="mt-4 text-4xl font-bold tracking-tight text-emerald-600">{agriLoop?.yieldProjection?.yieldPercent?.toFixed(1) || '92.4'}%</p>
                    <p className="mt-2 text-sm text-slate-600">Projected yield: {agriLoop?.yieldProjection?.totalYieldTons?.toLocaleString('en-IN') || '11.9'} tons across {farm?.areaInAcres || '5'} acres</p>
                    <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">{agriLoop?.cropCalendar?.nextCrop || 'After rice, sow wheat in the next suitable window to avoid residue burning and protect soil.'}</p>
                  </div>
                </div>

                <div className="mt-6 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">Live Tracking</p>
                      <h4 className="mt-2 text-2xl font-bold text-slate-900">Residue collection in progress</h4>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">12 active</span>
                      <Link href="/driver/route" className="rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-700">Open route</Link>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 lg:grid-cols-3">
                    {liveDispatch.map((driver) => (
                      <div key={driver.name} className="driver-card rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-base font-semibold text-slate-900">{driver.name}</p>
                            <p className="text-xs text-slate-500">{driver.status}</p>
                          </div>
                          <span className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_0_5px_rgba(16,185,129,0.12)]" />
                        </div>
                        <div className="mt-4 rounded-2xl bg-white p-3">
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">ETA</p>
                          <p className="mt-2 text-xl font-bold text-emerald-600">{driver.eta}</p>
                          <p className="mt-1 text-sm text-slate-600">Load: {driver.load}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}

          {tab === 'crop' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-4 rounded-[28px] bg-gradient-to-r from-[#006a42] to-[#29a56b] px-6 py-5 text-white shadow-[0_20px_45px_rgba(0,106,66,0.25)]">
                <TrendingUp className="h-6 w-6" />
                <p className="text-lg font-semibold">{copy.roi}: {diag?.economics?.roiPercent != null ? `${diag.economics.roiPercent}%` : '—'}</p>
                <span className="hidden h-6 w-px bg-white/40 sm:block" />
                <p className="text-lg font-semibold">{copy.grossReturn}: ₹{diag?.economics?.netReturn?.toLocaleString('en-IN') || '—'}</p>
                <span className="ml-auto rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">Estimated treatment advantage</span>
              </div>

              <div className="glass-card">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <h3 className="text-xl font-semibold text-slate-900">{copy.liveStress} — {farm?.cropType}</h3>
                  {diag && <span className="text-sm text-slate-500">TMAX {diag.tmax?.toFixed(1)}°C • TMIN {diag.tmin?.toFixed(1)}°C</span>}
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StressGauge label={t.diurnalHeat} value={diag?.scores?.diurnal} icon={Sun} />
                  <StressGauge label={t.nightHeat} value={diag?.scores?.night} icon={Moon} />
                  <StressGauge label={t.frost} value={diag?.scores?.frost} icon={Snowflake} />
                  <div className="rounded-[24px] border border-white/70 bg-white/75 p-5 shadow-[0_12px_28px_rgba(0,0,0,0.04)] backdrop-blur-md">
                    <div className="flex items-center gap-2 text-slate-500"><Droplets className="h-4 w-4" /><span className="text-[10px] font-bold uppercase tracking-[0.2em]">{copy.droughtIndex}</span></div>
                    <p className="mt-3 text-4xl font-bold text-slate-900">{diag?.droughtIndex?.value?.toFixed(2) ?? '—'}</p>
                    <p className="mt-3 text-sm font-medium" style={{ color: diag?.droughtIndex?.risk === 'High Risk' ? '#ef4444' : diag?.droughtIndex?.risk === 'Medium Risk' ? '#f59e0b' : '#10b981' }}>{diag?.droughtIndex?.risk || '—'}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                <div className="glass-card card-3d lg:col-span-2">
                  <div className="flex items-center gap-2 text-emerald-600"><Sparkles className="h-5 w-5" /><span className="text-[10px] font-bold uppercase tracking-[0.28em]">{copy.recommendationTitle}</span></div>
                  {diag ? (
                    <>
                      <h3 className="mt-4 text-2xl font-bold text-slate-900">{localizedProductName(diag.product.product)}</h3>
                      <p className="text-sm font-semibold text-emerald-700">{recommendationCopy.brands[diag.product.category] || diag.product.brand}</p>
                      <p className="mt-3 text-sm leading-6 text-slate-600">{recommendationCopy.rationale[diag.product.category] || diag.product.rationale}</p>
                      {diag.product.requiresConfirmation && <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium leading-5 text-amber-900">{copy.confirmLabel}</p>}
                      {diag.product.options?.length > 0 && (
                        <div className="mt-5 space-y-2">
                          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-500">{copy.options}</p>
                          {diag.product.options.map((option) => (
                            <div key={option.name} className="rounded-xl border border-emerald-100 bg-emerald-50/70 px-3 py-2">
                              <p className="text-sm font-semibold text-emerald-900">{option.name} <span className="font-normal text-emerald-700">· {recommendationCopy.products[option.name]?.type || option.type}</span></p>
                              {option.composition && <p className="mt-1 text-xs font-medium text-emerald-700">{recommendationCopy.products[option.name]?.composition || option.composition}</p>}
                              <p className="mt-1 text-xs leading-5 text-emerald-800">{recommendationCopy.products[option.name]?.use || option.use}</p>
                              {option.dosage && <p className="mt-1 text-[11px] font-semibold leading-4 text-amber-800">{copy.dosage}: {option.dosage.rateMlPerLitre} {recommendationCopy.mlPerLitre} · {option.dosage.waterLitres} L {recommendationCopy.water} · {option.dosage.productMl} ml {recommendationCopy.product} · {option.dosage.applicationsPerDay} {copy.timesPerDay} · {option.dosage.applicationsPerSeason} {copy.applications}</p>}
                              {option.dosage && <p className="mt-1 text-[11px] leading-4 text-emerald-800">{copy.region}: {recommendationCopy.regions[option.dosage.region] || option.dosage.region} · {copy.interval}: {option.dosage.intervalDays} {recommendationCopy.days} · {recommendationCopy.timing[option.name] || option.dosage.timing}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                      {diag.product.options?.length > 0 ? (
                        <div className="mt-5 rounded-2xl bg-slate-900 p-4 text-white">
                          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.28em] text-slate-300"><FlaskConical className="h-4 w-4" /> {copy.fieldPlan}</div>
                          <p className="mt-3 text-sm text-slate-200">{copy.fieldPlanText(diag.dosing.acres, recommendationCopy.regions[diag.dosing.region] || diag.dosing.region)}</p>
                        </div>
                      ) : (
                        <div className="mt-5 rounded-2xl bg-slate-100 p-4 text-sm text-slate-700">{copy.noProduct}</div>
                      )}
                    </>
                  ) : <p className="mt-4 text-sm text-slate-500">Computing recommendation…</p>}
                </div>

                <div className="glass-card card-3d">
                  <div className="flex items-center gap-2 text-slate-500"><Clock className="h-5 w-5" /><span className="text-[10px] font-bold uppercase tracking-[0.28em]">{copy.sprayWindow}</span></div>
                  <p className="mt-2 text-xs text-slate-400">{copy.sprayProvider}: {syngentaApi?.sprayWindowSource || '—'}</p>
                  {syngentaApi && <p className="mt-1 text-xs text-slate-500">{copy.liveApi}: {syngentaApi.sprayWindow ? copy.connected : copy.unavailable} · {copy.spraySource}: {syngentaApi.sprayWindowSource || '—'}</p>}
                  {sprayWindows.length > 0 ? (
                    <ul className="mt-4 space-y-2 text-sm text-emerald-800">
                      {sprayWindows.slice(0, 4).map((w, i) => (
                        <li key={i} className="rounded-xl bg-emerald-50 px-3 py-2">
                          <p className="font-semibold">{formatSprayTime(w.startTime || w.date)} {w.endTime ? `→ ${formatSprayTime(w.endTime)}` : ''}</p>
                          {(w.temperatureC != null || w.rainChancePercent != null || w.windKph != null) && <p className="mt-1 text-xs">{copy.temperature}: {w.temperatureC ?? '—'}°C · {copy.rainChance}: {w.rainChancePercent ?? '—'}% · {copy.wind}: {w.windKph ?? '—'} km/h · {copy.humidity}: {w.humidityPercent ?? '—'}%</p>}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                      {syngentaApi?.sprayWindow ? copy.noWindow : `${copy.sprayUnavailable}${syngentaApi?.sprayWindowError ? `: ${syngentaApi.sprayWindowError}` : ''}`}
                    </div>
                  )}
                  <BookMachineryCard farm={farm} defaultType="Boom Sprayer" triggerLabel="Book Sprayer Machine" triggerClass="pill-dark mt-4 w-full" />
                </div>
              </div>

              <div className="glass-card card-3d">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-sky-600">Crop input history</p>
                    <h3 className="mt-2 text-2xl font-bold text-slate-900">Tell AgroVani what you already used</h3>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Select products applied to this {farm?.cropType || 'crop'}. The recommendation API will avoid blind repeats and use current stress signals before suggesting the next step.</p>
                  </div>
                  <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">{usedProducts.length} selected</span>
                </div>

                <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-[24px] border border-slate-200 bg-white/80 p-4">
                    <input value={productSearch} onChange={(event) => setProductSearch(event.target.value)} placeholder="Search product, type, or target" className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none focus:border-sky-300 focus:bg-white" />
                    <div className="mt-3 grid max-h-72 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                      {filteredProducts.map((product) => (
                        <label key={product.name} className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3 transition ${usedProducts.includes(product.name) ? 'border-sky-300 bg-sky-50' : 'border-slate-200 bg-slate-50 hover:bg-white'}`}>
                          <input type="checkbox" checked={usedProducts.includes(product.name)} onChange={() => toggleUsedProduct(product.name)} className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500" />
                          <span className="min-w-0"><span className="block text-sm font-semibold text-slate-900">{product.name}</span><span className="mt-1 block text-[11px] leading-4 text-slate-500">{product.type} · {product.category}</span></span>
                        </label>
                      ))}
                      {!filteredProducts.length && <p className="col-span-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No catalog products match this search.</p>}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-slate-900 p-5 text-white">
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-sky-300">Customized recommendation</p>
                    <p className="mt-3 text-sm leading-6 text-slate-300">Uses selected product history, crop, acreage, state, and live weather stress. Results are guidance, not a chemical prescription.</p>
                    <button type="button" onClick={getProductRecommendation} disabled={recommendationLoading || !farm} className="mt-4 w-full rounded-full bg-sky-400 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-60">{recommendationLoading ? 'Checking field history...' : 'Get customized recommendation'}</button>
                    {recommendationError && <p role="alert" className="mt-3 rounded-xl bg-red-500/15 px-3 py-2 text-xs text-red-200">{recommendationError}</p>}
                    {productRecommendation?.recommendation && (
                      <div className="mt-4 rounded-2xl border border-white/10 bg-white/10 p-4">
                        <p className="text-lg font-bold text-white">{productRecommendation.recommendation.name}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-sky-200">{productRecommendation.recommendation.type} · {productRecommendation.recommendation.category}</p>
                        <p className="mt-3 text-sm leading-6 text-slate-200">{productRecommendation.rationale}</p>
                        <p className="mt-3 text-xs leading-5 text-amber-200">{productRecommendation.safety}</p>
                        {productRecommendation.alternatives?.length > 0 && <p className="mt-3 text-xs text-slate-300">Alternatives: {productRecommendation.alternatives.map((item) => item.name).join(', ')}</p>}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="glass-card">
                  <div className="flex items-center gap-2 text-slate-900"><Mic className="h-5 w-5 text-emerald-600" /><h3 className="text-xl font-semibold">Live Voice Advisory</h3></div>
                  <p className="mt-2 text-sm text-slate-600">Talk naturally with the Gemini Live agent in Punjabi, Hindi, Marathi, Tamil, Telugu, or English.</p>
                  <LiveKitVoiceAgent farmId={farm?.id} locale={locale} context={stress || residue || { farm: farm?.cropType || 'Rice' }} />
                </div>

                <div className="glass-card">
                  <div className="flex items-center gap-2 text-slate-900"><Camera className="h-5 w-5 text-emerald-600" /><h3 className="text-xl font-semibold">Crop Cam Diagnostic</h3></div>
                  <p className="mt-2 text-sm text-slate-600">Snap a leaf to detect chlorosis, heat wilting & fungal lesions with Gemini Vision.</p>
                  {cameraOpen ? (
                    <div className="mt-5 overflow-hidden rounded-2xl border border-emerald-200 bg-slate-950">
                      <video ref={videoRef} autoPlay playsInline muted className="h-48 w-full object-cover" />
                      <div className="flex gap-3 p-3">
                        <button type="button" onClick={captureCamera} className="pill-dark flex-1">Capture photo</button>
                        <button type="button" onClick={stopCamera} className="glass-btn flex-1 border-white/20 bg-white/10 text-white hover:bg-white/20">Cancel</button>
                      </div>
                    </div>
                  ) : cameraPreview ? (
                    <img src={cameraPreview} alt="Captured crop leaf" className="mt-5 h-48 w-full rounded-2xl object-cover" />
                  ) : (
                    <div className="mt-5 flex h-24 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 text-sm font-medium text-slate-500">No crop photo selected</div>
                  )}
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button type="button" onClick={openCamera} className="pill-dark"><Camera className="mr-2 h-4 w-4" /> Open camera</button>
                    <label className="glass-btn cursor-pointer"><span>Upload photo</span><input type="file" accept="image/*" className="sr-only" onChange={(event) => {
                      const file = event.target.files?.[0] || null
                      setCameraFile(file)
                      if (file) diagnoseCropImage(file)
                    }} /></label>
                  </div>
                  {cameraLoading && <p className="mt-3 text-xs font-medium text-emerald-700">Diagnosing crop image with Gemini…</p>}
                  {cameraError && <p role="alert" className="mt-3 text-xs font-medium text-red-600">{cameraError}</p>}
                  {cameraDiagnosis && (
                    <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Diagnosis</p>
                      <p className="mt-2 text-lg font-semibold">{cameraDiagnosis.issue}</p>
                      <p className="mt-1">Severity: <span className="font-semibold">{cameraDiagnosis.severity}</span> · Confidence: <span className="font-semibold">{Number(cameraDiagnosis.confidence || 0).toFixed(2)}</span></p>
                      <p className="mt-2 text-sm text-emerald-800">{cameraDiagnosis.recommendation || cameraDiagnosis.mappedRecommendation?.recommendation}</p>
                      {cameraDiagnosis.product && <p className="mt-2"><span className="font-semibold">Recommended product:</span> {cameraDiagnosis.product}</p>}
                      {cameraDiagnosis.dosageGuidance && <p className="mt-2 border-t border-emerald-200 pt-2 text-xs leading-5 text-emerald-800"><span className="font-semibold">Label-safe application:</span> {cameraDiagnosis.dosageGuidance}</p>}
                    </div>
                  )}
                  <p className="mt-3 text-xs text-slate-500">{cameraFile ? 'Leaf image ready for diagnosis.' : 'Use the camera or upload a leaf photo to prepare a crop diagnosis.'}</p>
                </div>
              </div>

              <WeatherMapCard />
              <FarmMapCard lat={farm?.latitude} lon={farm?.longitude} mode="crop" stressScore={Math.max(diag?.scores?.diurnal || 0, diag?.scores?.night || 0)} title="Live Crop Position Tracking" />
            </div>
          )}

          <section className="mt-8 rounded-[28px] border border-white/80 bg-white/75 p-6 shadow-sm backdrop-blur-md">
            <div className="mb-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-600">Membership</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Our Plans</h2>
            </div>
            <div className="grid gap-5 lg:grid-cols-3">
              {plans.map((plan) => (
                <div key={plan.id} className={`relative rounded-[24px] border p-5 ${plan.highlight ? 'border-emerald-200 bg-emerald-50 ring-2 ring-emerald-100' : 'border-slate-200 bg-white'}`}>
                  {plan.highlight && <span className="absolute right-4 top-4 rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white">Best value</span>}
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">{plan.name}</p>
                  <p className="mt-4 text-3xl font-bold text-slate-900">{plan.priceInr === 0 ? '₹0' : `₹${plan.priceInr.toLocaleString('en-IN')}`}<span className="ml-2 text-sm font-medium text-slate-500">/mo</span></p>
                  <p className="mt-2 text-sm text-slate-600">{plan.note}</p>
                  <ul className="mt-5 space-y-2 text-sm text-slate-700">{plan.features.map((feature) => <li key={feature} className="flex items-center gap-3"><span className="h-2 w-2 rounded-full bg-emerald-500" />{feature}</li>)}</ul>
                  <RazorpayButton plan={plan} />
                </div>
              ))}
            </div>
          </section>

          {orderReceipt && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="order-receipt-title">
              <div className="w-full max-w-lg rounded-[30px] border border-white/70 bg-white/95 p-6 shadow-[0_30px_90px_rgba(15,23,42,0.28)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-600">AgriLoop order economics</p>
                    <h2 id="order-receipt-title" className="mt-2 text-2xl font-bold text-slate-900">Your circular purchase is confirmed</h2>
                    <p className="mt-1 text-sm text-slate-500">Order {orderReceipt.orderId?.slice(0, 8) || 'pending'} · {orderReceipt.quantity} unit{orderReceipt.quantity === 1 ? '' : 's'} of {orderReceipt.listingName}</p>
                  </div>
                  <button type="button" onClick={() => setOrderReceipt(null)} aria-label="Close order receipt" className="rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-6 space-y-3 text-sm">
                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-slate-600"><span>Gross order value</span><span className="font-semibold text-slate-900">₹{orderReceipt.grossTotal.toLocaleString('en-IN')}</span></div>
                  <div className="flex items-center justify-between rounded-2xl bg-emerald-50 px-4 py-3 text-emerald-800"><span>AgriLoop incentive ({orderReceipt.incentivePct}%)</span><span className="font-semibold">−₹{orderReceipt.incentiveAmount.toLocaleString('en-IN')}</span></div>
                  <div className="flex items-center justify-between rounded-2xl bg-amber-50 px-4 py-3 text-amber-800"><span>Repeat buyer discount</span><span className="font-semibold">−₹{orderReceipt.repeatDiscount.toLocaleString('en-IN')}</span></div>
                </div>

                <div className="mt-5 flex items-end justify-between rounded-[24px] bg-slate-900 px-5 py-4 text-white">
                  <div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Net payable</p><p className="mt-1 text-xs text-slate-300">Pickup and residue credit tracked in AgriLoop</p></div>
                  <p className="text-3xl font-bold">₹{orderReceipt.netPayable.toLocaleString('en-IN')}</p>
                </div>

                <button type="button" onClick={() => setOrderReceipt(null)} className="pill-dark mt-5 w-full">Continue to dashboard</button>
              </div>
            </div>
          )}
        </div>
      </main>
      <SupportDock role="farmer" locale={locale} context={{ farm: farm?.cropType, stress, residue }} />
    </DebugBoundary>
  )
}
