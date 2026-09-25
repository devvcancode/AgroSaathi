'use client'

import { useEffect, useState } from 'react'
import { Download, Share2, Smartphone, X } from 'lucide-react'

export default function InstallAppButton({ compact = false }) {
  const [installEvent, setInstallEvent] = useState(null)
  const [showHelp, setShowHelp] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
    setInstalled(isStandalone)

    const captureInstallPrompt = (event) => {
      event.preventDefault()
      setInstallEvent(event)
    }
    const handleInstalled = () => {
      setInstalled(true)
      setInstallEvent(null)
      setShowHelp(false)
    }

    window.addEventListener('beforeinstallprompt', captureInstallPrompt)
    window.addEventListener('appinstalled', handleInstalled)
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {})

    return () => {
      window.removeEventListener('beforeinstallprompt', captureInstallPrompt)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  if (installed) return null

  async function install() {
    if (installEvent) {
      installEvent.prompt()
      await installEvent.userChoice
      setInstallEvent(null)
      return
    }
    setShowHelp(true)
  }

  return (
    <>
      <button type="button" onClick={install} className={compact ? 'glass-btn px-4 py-2 text-xs' : 'pill-dark'}>
        <Download className="mr-2 h-4 w-4" /> Download app
      </button>

      {showHelp && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="install-title">
          <div className="w-full max-w-sm rounded-[28px] border border-white/70 bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.25)]">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3"><div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700"><Smartphone className="h-5 w-5" /></div><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600">Farmer app</p><h2 id="install-title" className="text-xl font-bold text-slate-900">Add AgroVani to phone</h2></div></div>
              <button type="button" aria-label="Close install instructions" onClick={() => setShowHelp(false)} className="rounded-full bg-slate-100 p-2 text-slate-500"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-5 space-y-3 text-sm leading-6 text-slate-600">
              <p><strong className="text-slate-900">Android:</strong> open the browser menu and choose <strong className="text-slate-900">Install app</strong> or <strong className="text-slate-900">Add to Home screen</strong>.</p>
              <p><strong className="text-slate-900">iPhone:</strong> tap <Share2 className="mx-1 inline h-4 w-4 text-emerald-600" /> Share, then choose <strong className="text-slate-900">Add to Home Screen</strong>.</p>
            </div>
            <button type="button" onClick={() => setShowHelp(false)} className="pill-dark mt-5 w-full">Got it</button>
          </div>
        </div>
      )}
    </>
  )
}
