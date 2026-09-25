'use client'

import { useEffect, useRef, useState } from 'react'
import { Languages, Mic, Sparkles } from 'lucide-react'
import { apiUrl } from '@/lib/api'

const LANG_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'pa', label: 'Punjabi' },
  { value: 'ta', label: 'Tamil' },
  { value: 'te', label: 'Telugu' },
  { value: 'mr', label: 'Marathi' },
]

export default function MultilingualVoiceBridge({ farm, context }) {
  const [sourceLanguage, setSourceLanguage] = useState('ta')
  const [targetLanguage, setTargetLanguage] = useState('hi')
  const [manualText, setManualText] = useState('எனக்கு 30 கிலோ நெல் இன்று விற்க வேண்டும்')
  const [translation, setTranslation] = useState('')
  const [status, setStatus] = useState('')
  const [recording, setRecording] = useState(false)
  const [loading, setLoading] = useState(false)
  const recorderRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
  }, [])

  async function translateText() {
    if (!manualText.trim()) return
    setLoading(true)
    setStatus('Translating buyer message...')

    try {
      const response = await fetch(apiUrl('/api/translate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: manualText,
          sourceLanguage,
          targetLanguage,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Translation failed')
      setTranslation(data.translatedText || '')
      setStatus('Translation ready for the farmer.')
    } catch (error) {
      setStatus(error.message || 'Translation unavailable right now.')
    } finally {
      setLoading(false)
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop()
    }
  }

  async function startRecording() {
    if (recording) {
      stopRecording()
      return
    }

    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setStatus('Voice capture needs a secure context and microphone access.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } })
      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((type) => MediaRecorder.isTypeSupported(type)) || ''
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      streamRef.current = stream
      chunksRef.current = []
      recorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        chunksRef.current = []
        recorderRef.current = null
        streamRef.current?.getTracks().forEach((track) => track.stop())
        streamRef.current = null
        setRecording(false)

        if (!blob.size) {
          setStatus('No voice was captured. Please try again.')
          return
        }

        setStatus('Understanding the buyer voice...')
        const reader = new FileReader()
        reader.onload = async () => {
          try {
            const response = await fetch(apiUrl('/api/assistant/audio'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                audio: reader.result,
                mimeType: blob.type || 'audio/webm',
                sourceLanguage,
                targetLanguage,
                locale: targetLanguage,
                farmId: farm?.id || null,
                context: context || { crop: farm?.cropType || 'Rice' },
              }),
            })
            const data = await response.json()
            if (!response.ok || (!data.translatedText && !data.reply)) throw new Error(data.error || 'Voice translation failed')
            setTranslation(data.translatedText || data.reply)
            setStatus('Buyer message translated and decoded for the farmer.')
            if ('speechSynthesis' in window) {
              window.speechSynthesis.cancel()
              window.speechSynthesis.speak(new SpeechSynthesisUtterance(data.translatedText || data.reply))
            }
          } catch (error) {
            setStatus(error.message || 'The voice bridge could not decode the message.')
          }
        }
        reader.readAsDataURL(blob)
      }

      recorder.start()
      setRecording(true)
      setStatus('Listening for a buyer message...')
    } catch (error) {
      setStatus(error.name === 'NotAllowedError' ? 'Microphone was blocked. Please allow access.' : 'Unable to start voice capture.')
      setRecording(false)
    }
  }

  return (
    <div className="min-w-0 rounded-[28px] border border-violet-200 bg-violet-50/80 p-4 shadow-sm">
      <div className="flex items-center gap-2 text-violet-700">
        <Languages className="h-5 w-5" />
        <p className="text-[10px] font-bold uppercase tracking-[0.25em]">Multilingual buyer bridge</p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Buyer language
          <select value={sourceLanguage} onChange={(event) => setSourceLanguage(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-300">
            {LANG_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>

        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Farmer language
          <select value={targetLanguage} onChange={(event) => setTargetLanguage(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-300">
            {LANG_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
      </div>

      <textarea
        value={manualText}
        onChange={(event) => setManualText(event.target.value)}
        rows={4}
        placeholder="Type a buyer message in Tamil, Telugu, Hindi, or English..."
        className="mt-4 w-full rounded-2xl border border-violet-200 bg-white px-3 py-3 text-sm leading-6 text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-300"
      />

      <div className="mt-4 grid gap-3 sm:flex sm:flex-wrap">
        <button type="button" onClick={translateText} disabled={loading || !manualText.trim()} className="pill-dark w-full disabled:opacity-70 sm:w-auto">
          {loading ? 'Translating...' : 'Translate message'}
        </button>

        <button type="button" onClick={startRecording} className={`w-full rounded-full px-4 py-3 text-sm font-semibold sm:w-auto ${recording ? 'border border-red-200 bg-red-100 text-red-700' : 'border border-violet-200 bg-white text-violet-700'}`}>
          <span className="inline-flex items-center gap-2"><Mic className="h-4 w-4" /> {recording ? 'Stop' : 'Voice decode'}</span>
        </button>
      </div>

      {status && <p className="mt-4 text-xs font-medium text-slate-600" aria-live="polite">{status}</p>}

      {translation && (
        <div className="mt-4 rounded-2xl border border-violet-200 bg-white p-4 text-sm leading-6 text-violet-900 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-violet-700">
            <Sparkles className="h-3.5 w-3.5" /> Farmer view
          </div>
          {translation}
        </div>
      )}
    </div>
  )
}
