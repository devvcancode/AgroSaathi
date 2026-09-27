'use client'

import { useEffect, useRef, useState } from 'react'
import { Bot, ChevronDown, Leaf, Mic, Send, Sprout, Truck, X } from 'lucide-react'
import { apiUrl } from '@/lib/api'

export default function SupportDock({ role = 'farmer', locale = 'en', context = {} }) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [recording, setRecording] = useState(false)
  const [messages, setMessages] = useState([{ role: 'assistant', text: 'AgroSaathi is ready. Ask about crops, orders, mandi prices, or dispatch.' }])
  const mediaRecorderRef = useRef(null)

  const quickPrompts = [
    { label: 'Crop alternative', icon: Sprout, text: 'Which crop can I sow as an alternative for my current field?' },
    { label: 'Product + dose', icon: Leaf, text: 'Based on my crop and stress data, what should I use and how much?' },
    { label: 'Dispatch timing', icon: Truck, text: 'When should I schedule residue pickup and what should be ready?' },
  ]

  useEffect(() => {
    if (!open) return
    fetch(apiUrl('/api/messages')).then((response) => response.ok ? response.json() : []).then((items) => {
      if (Array.isArray(items) && items.length) setMessages((current) => [...current, ...items.slice(-12).map((item) => ({ role: 'network', text: `${item.senderId}: ${item.translatedText || item.text}` }))])
    }).catch(() => {})
  }, [open])

  async function sendMessage(event) {
    event?.preventDefault()
    const message = input.trim()
    if (!message || busy) return
    setInput('')
    setMessages((items) => [...items, { role: 'user', text: message }])
    fetch(apiUrl('/api/messages'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ senderId: role, recipientId: 'network', text: message, sourceLanguage: locale, targetLanguage: locale }) }).catch(() => {})
    setBusy(true)
    try {
      const response = await fetch(apiUrl('/api/assistant'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, locale, context: { role, ...context } }),
      })
      const data = await response.json()
      if (!response.ok || !data.reply) throw new Error(data.error || 'Support is temporarily unavailable.')
      setMessages((items) => [...items, { role: 'assistant', text: data.reply }])
    } catch (error) {
      setMessages((items) => [...items, { role: 'assistant', text: error.message }])
    } finally {
      setBusy(false)
    }
  }

  async function startVoice() {
    if (recording) {
      mediaRecorderRef.current?.stop()
      return
    }
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setMessages((items) => [...items, { role: 'assistant', text: 'Voice recording is not supported in this browser.' }])
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks = []
      mediaRecorderRef.current = recorder
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data)
      }
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop())
        mediaRecorderRef.current = null
        setRecording(false)
        const audioBlob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' })
        if (!audioBlob.size) return
        if (audioBlob.size > 8 * 1024 * 1024) {
          setMessages((items) => [...items, { role: 'assistant', text: 'That recording is too large. Please record a shorter question.' }])
          return
        }

        setBusy(true)
        try {
          const audio = await new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result)
            reader.onerror = () => reject(new Error('Unable to read the voice recording.'))
            reader.readAsDataURL(audioBlob)
          })
          const response = await fetch(apiUrl('/api/assistant/audio'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audio,
              mimeType: audioBlob.type || 'audio/webm',
              audioFormat: audioBlob.type.includes('mp4') ? 'mp4' : 'webm',
              sourceLanguage: locale,
              targetLanguage: locale,
              locale,
              context: { role, ...context },
            }),
          })
          const data = await response.json().catch(() => ({}))
          if (!response.ok || !data.reply) throw new Error(data.error || 'Voice support is temporarily unavailable.')
          setMessages((items) => [
            ...items,
            ...(data.transcript ? [{ role: 'user', text: data.transcript }] : []),
            { role: 'assistant', text: data.reply },
          ])
          if (data.audio) {
            const playback = new Audio(`data:${data.audioMimeType || 'audio/wav'};base64,${data.audio}`)
            playback.play().catch(() => {})
          }
        } catch (error) {
          setMessages((items) => [...items, { role: 'assistant', text: error.message }])
        } finally {
          setBusy(false)
        }
      }
      recorder.start()
      setRecording(true)
    } catch (error) {
      setMessages((items) => [...items, { role: 'assistant', text: error.message || 'Microphone access was denied.' }])
    }
  }

  const applyPrompt = (prompt) => {
    setInput(prompt)
  }

  return (
    <div className={`agrosaathi-dock fixed z-[80] ${open ? 'agrosaathi-dock-open' : ''}`}>
      {open && (
        <div className="agrosaathi-phone mb-3 overflow-hidden text-white">
          <div className="agrosaathi-phone-notch" aria-hidden="true" />
          <div className="flex items-center justify-between border-b border-white/10 px-5 pb-4 pt-7">
            <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20"><Bot className="h-5 w-5" /></div><div><p className="text-sm font-black tracking-tight">AGROSAATHI</p><p className="text-[11px] text-emerald-200">Personal farm intelligence</p></div></div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Minimize AgroSaathi" title="Minimize AgroSaathi" className="rounded-full p-2 text-slate-300 hover:bg-white/10"><ChevronDown className="h-5 w-5" /></button>
          </div>
          <div className="agrosaathi-messages flex flex-col gap-3 overflow-y-auto px-4 py-4">
            {messages.map((message, index) => <div key={`${message.role}-${index}`} className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-5 ${message.role === 'user' ? 'ml-auto bg-emerald-500 text-slate-950' : 'bg-white/10 text-slate-100'}`}>{message.text}</div>)}
          </div>
          <div className="border-t border-white/10 px-4 py-3"><p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Ask about your farm</p><div className="flex gap-2 overflow-x-auto pb-1">{quickPrompts.map(({ label, icon: Icon, text }) => <button key={label} type="button" onClick={() => applyPrompt(text)} className="agrosaathi-prompt flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"><Icon className="h-3.5 w-3.5 text-emerald-300" />{label}</button>)}</div></div>
          <form onSubmit={sendMessage} className="flex gap-2 border-t border-white/10 p-3">
            <button type="button" onClick={startVoice} disabled={busy} aria-label={recording ? 'Stop voice recording' : 'Start voice recording'} title={recording ? 'Stop voice recording' : 'Start voice recording'} className={`rounded-full border border-white/15 p-2 hover:bg-white/10 disabled:opacity-50 ${recording ? 'text-rose-300' : 'text-emerald-300'}`}><Mic className="h-4 w-4" /></button>
            <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask AgroSaathi" className="min-w-0 flex-1 rounded-full border border-white/15 bg-white/10 px-3 text-sm text-white outline-none placeholder:text-slate-400" />
            <button type="submit" disabled={busy} aria-label="Send message" className="rounded-full bg-emerald-400 p-2 text-slate-950 disabled:opacity-50"><Send className="h-4 w-4" /></button>
          </form>
        </div>
      )}
      {!open && <button type="button" onClick={() => setOpen(true)} aria-label="Open AgroSaathi support" title="Open AgroSaathi" className="agrosaathi-launcher flex items-center gap-3 rounded-full border border-emerald-200/40 bg-emerald-400 px-4 py-3 text-slate-950 shadow-[0_12px_35px_rgba(52,211,153,0.35)] transition hover:-translate-y-1"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950/10"><Bot className="h-5 w-5" /></span><span className="hidden text-left sm:block"><strong className="block text-sm font-black">AGROSAATHI</strong><small className="block text-[10px] font-semibold text-emerald-950/70">Your farm copilot</small></span></button>}
    </div>
  )
}
