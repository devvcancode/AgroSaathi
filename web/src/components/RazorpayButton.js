'use client'

import { useState } from 'react'

function loadRazorpay() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve()
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = resolve
    script.onerror = () => reject(new Error('Unable to load Razorpay Checkout. Check your connection and try again.'))
    document.body.appendChild(script)
  })
}

export default function RazorpayButton({ plan }) {
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)

  async function startPayment() {
    if (plan.priceInr === 0) {
      setStatus(`${plan.name} is free and ready to use.`)
      return
    }

    setBusy(true)
    setStatus('')
    try {
      const user = JSON.parse(localStorage.getItem('agrovani_user') || '{}')
      await loadRazorpay()
      const orderResponse = await fetch('/api/payments/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id, userEmail: user?.email || null, userRole: user?.role || null }),
      })
      const order = await orderResponse.json()
      if (!orderResponse.ok) throw new Error(order.error || 'Unable to create Razorpay order')

      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'AgroVani',
        description: `${plan.name} membership`,
        order_id: order.orderId,
        prefill: { email: user?.email || '' },
        theme: { color: '#059669' },
        handler: async (payment) => {
          const verifyResponse = await fetch('/api/payments/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payment, planId: plan.id }),
          })
          const result = await verifyResponse.json()
          if (!verifyResponse.ok) throw new Error(result.error || 'Payment verification failed')
          setStatus(`Payment successful. ${plan.name} is now active.`)
        },
        modal: { ondismiss: () => setStatus('Payment cancelled.') },
      })
      checkout.on('payment.failed', (event) => setStatus(event.error?.description || 'Payment failed. Please try again.'))
      checkout.open()
    } catch (error) {
      setStatus(error.message || 'Unable to start payment.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-6">
      <button type="button" onClick={startPayment} disabled={busy} className={`w-full rounded-full px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${plan.highlight ? 'bg-emerald-600 text-white shadow-[0_12px_30px_rgba(16,185,129,0.28)] hover:bg-emerald-700' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'}`}>
        {busy ? 'Opening payment…' : plan.priceInr === 0 ? 'Included' : `Pay ₹${plan.priceInr.toLocaleString('en-IN')}`}
      </button>
      {status && <p role="status" className="mt-2 text-xs leading-5 text-slate-600">{status}</p>}
    </div>
  )
}