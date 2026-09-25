'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, BadgeCheck, Building2, ShieldCheck, UserRound, Lock, Mail, MapPin, ChevronRight, CheckCircle2, ShoppingCart, Truck } from 'lucide-react'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import InstallAppButton from '@/components/InstallAppButton'

const roles = [
  {
    key: 'farmer',
    label: 'Farmer',
    accent: 'emerald',
    username: 'farmer@agrovani.in',
    password: 'AgroVani@123',
    redirect: '/farmer/onboarding',
    badge: 'Crop & field access',
  },
  {
    key: 'seller',
    label: 'Seller',
    accent: 'amber',
    username: 'seller@agrovani.in',
    password: 'AgroVani@123',
    redirect: '/seller/dashboard',
    badge: 'Residue marketplace',
  },
  {
    key: 'buyer',
    label: 'Buyer',
    accent: 'sky',
    username: 'buyer@agrovani.in',
    password: 'AgroVani@123',
    redirect: '/buyer/dashboard',
    badge: 'Marketplace & orders',
  },
  {
    key: 'driver',
    label: 'Driver',
    accent: 'violet',
    username: 'driver@agrovani.in',
    password: 'AgroVani@123',
    redirect: '/driver/dashboard',
    badge: 'Pickup & route access',
  },
  {
    key: 'admin',
    label: 'Admin',
    accent: 'blue',
    username: 'admin@agrovani.in',
    password: 'AgroVani@123',
    redirect: '/admin/dashboard',
    badge: 'Monitoring & oversight',
  },
]

const roleStyles = {
  farmer: {
    ring: 'ring-emerald-200',
    bg: 'from-emerald-600 to-emerald-500',
    text: 'text-emerald-700',
    chip: 'bg-emerald-50 text-emerald-700',
    button: 'bg-emerald-600 hover:bg-emerald-700',
  },
  seller: {
    ring: 'ring-amber-200',
    bg: 'from-lime-500 to-yellow-400',
    text: 'text-lime-700',
    chip: 'bg-lime-50 text-lime-700',
    button: 'bg-lime-600 hover:bg-lime-700',
  },
  buyer: {
    ring: 'ring-sky-200',
    bg: 'from-sky-500 to-cyan-500',
    text: 'text-sky-700',
    chip: 'bg-sky-50 text-sky-700',
    button: 'bg-sky-600 hover:bg-sky-700',
  },
  driver: {
    ring: 'ring-violet-200',
    bg: 'from-violet-600 to-indigo-600',
    text: 'text-violet-700',
    chip: 'bg-violet-50 text-violet-700',
    button: 'bg-violet-600 hover:bg-violet-700',
  },
  admin: {
    ring: 'ring-blue-200',
    bg: 'from-emerald-600 to-lime-500',
    text: 'text-emerald-700',
    chip: 'bg-emerald-50 text-emerald-700',
    button: 'bg-emerald-600 hover:bg-emerald-700',
  },
  driver: {
    ring: 'ring-violet-200',
    bg: 'from-yellow-500 to-amber-400',
    text: 'text-yellow-700',
    chip: 'bg-yellow-50 text-yellow-700',
    button: 'bg-yellow-600 hover:bg-yellow-700',
  },
  buyer: {
    ring: 'ring-sky-200',
    bg: 'from-emerald-500 to-yellow-400',
    text: 'text-emerald-700',
    chip: 'bg-emerald-50 text-emerald-700',
    button: 'bg-emerald-600 hover:bg-emerald-700',
  },
}

export default function LoginPage() {
  const router = useRouter()
  const [activeRole, setActiveRole] = useState('farmer')
  const [form, setForm] = useState({ email: 'farmer@agrovani.in', password: 'AgroVani@123' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const currentRole = useMemo(
    () => roles.find((role) => role.key === activeRole) || roles[0],
    [activeRole],
  )

  const handleSubmit = (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')

    const trimEmail = form.email.trim().toLowerCase()
    const trimPassword = form.password.trim()

    const valid = trimEmail === currentRole.username.toLowerCase() && trimPassword === currentRole.password

    if (!valid) {
      setBusy(false)
      setError('Invalid credentials. Please use the correct username and password for this role.')
      return
    }

    const sessionUser = {
      role: currentRole.key,
      name: currentRole.label,
      email: trimEmail,
      loginAt: new Date().toISOString(),
    }

    localStorage.setItem('agrovani_user', JSON.stringify(sessionUser))
    router.push(currentRole.redirect)
    setBusy(false)
  }

  const setInput = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  return (
    <main className="page-onboarding min-h-screen text-slate-800">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[22px] border border-stone-200 bg-[#fffdf7] shadow-[0_20px_60px_rgba(68,64,48,0.12)]">
          <div className="flex flex-wrap items-center justify-end gap-3 px-6 pt-4 lg:px-10"><InstallAppButton compact /><LanguageSwitcher /></div>
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-600 via-lime-400 to-yellow-400" />

          <div className="flex flex-col gap-0 lg:flex-row">
            <section className="flex-1 bg-[#fffdf7] px-6 py-8 text-slate-800 lg:px-10 lg:py-10">
              <div className="flex items-center justify-between gap-4 border-b border-stone-200 pb-5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-700">AgroVani</p>
                  <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Agriculture workspace</h1>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700">
                  <ShieldCheck className="h-6 w-6" />
                </div>
              </div>

              <div className="mt-8 rounded-[20px] border border-stone-200 bg-white p-5">
                <div className="flex items-center gap-3">
                  <div className={`rounded-full bg-gradient-to-r ${roleStyles[currentRole.key].bg} p-2`}>
                    {currentRole.key === 'farmer' && <UserRound className="h-5 w-5 text-white" />}
                    {currentRole.key === 'seller' && <Building2 className="h-5 w-5 text-white" />}
                    {currentRole.key === 'buyer' && <ShoppingCart className="h-5 w-5 text-white" />}
                    {currentRole.key === 'driver' && <Truck className="h-5 w-5 text-white" />}
                    {currentRole.key === 'admin' && <BadgeCheck className="h-5 w-5 text-white" />}
                    {currentRole.key === 'driver' && <Truck className="h-5 w-5 text-white" />}
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Workspace access</p>
                    <p className="text-xl font-semibold text-slate-900">{currentRole.label} Login</p>
                  </div>
                </div>

                <div className={`mt-5 inline-flex rounded-full ${roleStyles[currentRole.key].chip} px-3 py-1 text-xs font-semibold`}>
                  {currentRole.badge}
                </div>

                <ul className="mt-6 space-y-3 text-sm text-slate-600">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Secure access to sector-specific dashboards
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Farmer, seller and admin workflows kept separate
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Updated to support agricultural operations and reporting
                  </li>
                </ul>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-stone-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Region</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">India</p>
                </div>
                <div className="rounded-2xl border border-stone-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Mode</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">Role based</p>
                </div>
                <div className="rounded-2xl border border-stone-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Support</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">AgroSaathi</p>
                </div>
              </div>
            </section>

            <section className="flex-1 bg-white px-6 py-8 lg:px-10 lg:py-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-500">Sign in</p>
                  <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Welcome back</h2>
                </div>
                <Link href="/" className="text-sm font-semibold text-slate-600 transition hover:text-slate-900">Back to home</Link>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {roles.map((role) => (
                  <button
                    key={role.key}
                    type="button"
                    onClick={() => {
                      setActiveRole(role.key)
                      setForm({
                        email: role.username,
                        password: role.password,
                      })
                      setError('')
                    }}
                    className={`rounded-2xl border p-3 text-left transition ${activeRole === role.key ? `${roleStyles[role.key].chip} border-current shadow-sm` : 'border-slate-200 bg-slate-50 hover:bg-slate-100'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-800">{role.label}</span>
                      <ChevronRight className="h-4 w-4 text-slate-500" />
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                <span className="font-semibold">Demo access:</span> this is a mock authentication flow. No account or payment is created.
              </div>

              <form onSubmit={handleSubmit} className="mt-5 space-y-5">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-semibold text-slate-700">Email / Username</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="email"
                      type="text"
                      value={form.email}
                      onChange={setInput('email')}
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200"
                      placeholder="Enter your email or username"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-semibold text-slate-700">Password</label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="password"
                      type="password"
                      value={form.password}
                      onChange={setInput('password')}
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200"
                      placeholder="Enter your password"
                    />
                  </div>
                </div>

                {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-slate-600">
                    <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                    Keep me signed in
                  </label>
                  <button type="button" className="font-medium text-slate-600 transition hover:text-slate-900">Need help?</button>
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className={`flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r ${roleStyles[currentRole.key].bg} font-semibold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-70`}
                >
                  {busy ? 'Signing in...' : `Sign in as ${currentRole.label}`}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>

              <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  Secure agricultural operations platform for Punjab & beyond
                </div>
                <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">Demo credentials</span>
                  <span>Farmer, Seller, Buyer, Driver and Admin roles</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}
