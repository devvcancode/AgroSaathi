'use client'

import { useRef, useState } from 'react'
import { Mic, MicOff } from 'lucide-react'
import { apiUrl } from '@/lib/api'

export default function LiveKitVoiceAgent({ farmId, locale = 'en', context }) {
  const [recording, setRecording] = useState(false)
  const [status, setStatus] = useState('')
  const [reply, setReply] = useState('')
  const [error, setError] = useState('')
  const recorderRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])

  function stopRecording() {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
  }

  async function startRecording() {
    if (recording) {
      stopRecording()
      return
    }

    setError('')
    setReply('')
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError('Voice input needs a secure browser context and microphone support.')
      return
    }

    let stream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } })
      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((type) => MediaRecorder.isTypeSupported(type)) || ''
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      streamRef.current = stream
      chunksRef.current = []
      recorderRef.current = recorder
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }
      recorder.onerror = () => {
        setError('Voice recording failed. Please try again.')
        stream.getTracks().forEach((track) => track.stop())
        setRecording(false)
      }
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        chunksRef.current = []
        recorderRef.current = null
        streamRef.current?.getTracks().forEach((track) => track.stop())
        streamRef.current = null
        setRecording(false)
        if (!blob.size) {
          setStatus('No speech was recorded. Please try again.')
          return
        }

        setStatus('Gemini is understanding your question...')
        const reader = new FileReader()
        reader.onload = async () => {
          try {
            const response = await fetch(apiUrl('/api/assistant/audio'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audio: reader.result, mimeType: blob.type || 'audio/webm', farmId: farmId || null, locale, context }),
            })
            const data = await response.json()
            if (!response.ok || !data.reply) throw new Error(data.error || 'Gemini voice assistant error')
            setReply(data.reply)
            setStatus('Question answered by Gemini.')
            if ('speechSynthesis' in window) {
              window.speechSynthesis.cancel()
              window.speechSynthesis.speak(new SpeechSynthesisUtterance(data.reply))
            }
          } catch (nextError) {
            setError(nextError.message || 'Gemini could not answer right now. Try again.')
            setStatus('')
          }
        }
        reader.readAsDataURL(blob)
      }
      recorder.start()
      setRecording(true)
      setStatus('Listening... Tap again when you finish your question.')
    } catch (nextError) {
      stream?.getTracks().forEach((track) => track.stop())
      setError(nextError.name === 'NotAllowedError' ? 'Microphone permission was denied.' : nextError.message || 'Unable to start voice recording.')
      setRecording(false)
    }
  }

  return (
    <div className="mt-4">
      <button type="button" onClick={startRecording} className={recording ? 'glass-btn border-red-200 text-red-700' : 'pill-dark'}>
        {recording ? <><MicOff className="mr-2 h-4 w-4" /> Stop recording</> : <><Mic className="mr-2 h-4 w-4" /> Ask Gemini by voice</>}
      </button>
      {status && <p className="mt-2 text-xs font-medium text-slate-500">{status}</p>}
      {reply && <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm leading-6 text-emerald-900">{reply}</p>}
      {error && <p role="alert" className="mt-2 text-xs font-medium text-amber-700">{error}</p>}
    </div>
  )
}