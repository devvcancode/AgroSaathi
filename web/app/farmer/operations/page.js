'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowLeft, CalendarCheck, CircleDollarSign, Combine, ListChecks } from 'lucide-react'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import SupportDock from '@/components/SupportDock'
import ResidueOperationsPanel from '@/components/farmer/ResidueOperationsPanel'
import { apiUrl } from '@/lib/api'

const segments = [
  { title: 'Crop cycle', text: 'Keep sowing, irrigation, scouting, harvest, and residue actions in one farmer-owned timeline.', icon: Combine, color: 'text-emerald-300' },
  { title: 'Personalized recommendations', text: 'Each recommendation records what to use, how to use it, how often, and the safe timing window.', icon: ListChecks, color: 'text-sky-300' },
  { title: 'Tasks & schedules', text: 'Turn agronomic recommendations into dated tasks and coordinate machinery before the window closes.', icon: CalendarCheck, color: 'text-amber-300' },
  { title: 'Residue earnings', text: 'Track residue quantity, buyer interest, pickup status, and the farmer share as separate earnings.', icon: CircleDollarSign, color: 'text-lime-300' },
]

export default function FarmerOperationsPage() {
  const [tasks, setTasks] = useState([])
  const [earnings, setEarnings] = useState({ totalInr: 0 })
  const [draft, setDraft] = useState({ title: '', instructions: '', dueDate: new Date().toISOString().slice(0, 10) })
  const ownerId = 'farmer-local'

  useEffect(() => {
    Promise.all([fetch(apiUrl(`/api/tasks?ownerId=${ownerId}`)), fetch(apiUrl(`/api/earnings?ownerId=${ownerId}`))]).then(async ([taskResponse, earningResponse]) => {
      setTasks(await taskResponse.json())
      setEarnings(await earningResponse.json())
    })
  }, [])

  async function addTask(event) {
    event.preventDefault()
    const response = await fetch(apiUrl('/api/tasks'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...draft, ownerId, source: 'farmer_recommendation' }) })
    if (!response.ok) return
    const task = await response.json()
    setTasks((items) => [...items, task])
    setDraft({ title: '', instructions: '', dueDate: new Date().toISOString().slice(0, 10) })
  }

  async function toggleTask(task) {
    const response = await fetch(apiUrl('/api/tasks'), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: task.id, status: task.status === 'done' ? 'open' : 'done' }) })
    if (!response.ok) return
    const updated = await response.json()
    setTasks((items) => items.map((item) => item.id === updated.id ? updated : item))
  }

  return (
    <main className="page-farmer min-h-screen p-4 text-slate-100 md:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link href="/farmer/dashboard" className="flex items-center gap-2 text-sm font-semibold"><ArrowLeft className="h-4 w-4" /> Farmer dashboard</Link>
          <div className="flex items-center gap-3"><LanguageSwitcher /><Link href="/farmer/yield" className="glass-btn">Yield pulse</Link><Link href="/farmer/weather" className="glass-btn">Live weather</Link></div>
        </header>
        <div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-300">Farmer workspace</p><h1 className="mt-3 text-4xl font-bold tracking-tight md:text-6xl">Farm operations</h1><p className="mt-5 text-lg leading-8 text-slate-300">Your recommendations become tasks, schedules, dispatch requests, and earnings records here.</p></div>
        <div className="mt-10 grid gap-5 md:grid-cols-2">{segments.map(({ title, text, icon: Icon, color }) => <section key={title} className="glass-card border-white/15 bg-white/10"><Icon className={`h-7 w-7 ${color}`} /><h2 className="mt-5 text-2xl font-bold">{title}</h2><p className="mt-3 text-sm leading-7 text-slate-300">{text}</p></section>)}</div>
        <ResidueOperationsPanel />
        <section className="glass-card mt-6 border-white/15 bg-white/10">
          <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-300">Scheduled tasks</p><h2 className="mt-2 text-2xl font-bold">Personalized field plan</h2></div><span className="rounded-full bg-emerald-300/15 px-3 py-1 text-sm font-semibold text-emerald-200">₹{Number(earnings.totalInr || 0).toLocaleString('en-IN')} earned</span></div>
          <form onSubmit={addTask} className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_160px_auto]"><input required value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="What to do" className="rounded-xl border border-white/15 bg-white/10 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-400" /><input value={draft.instructions} onChange={(event) => setDraft({ ...draft, instructions: event.target.value })} placeholder="Instructions" className="rounded-xl border border-white/15 bg-white/10 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-400" /><input required type="date" value={draft.dueDate} onChange={(event) => setDraft({ ...draft, dueDate: event.target.value })} className="rounded-xl border border-white/15 bg-white/10 px-3 py-3 text-sm text-white" /><button className="rounded-xl bg-emerald-300 px-4 py-3 text-sm font-bold text-slate-950">Add task</button></form>
          <div className="mt-6 space-y-3">{tasks.map((task) => <button type="button" onClick={() => toggleTask(task)} key={task.id} className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left"><span><span className={`mr-3 inline-block h-2.5 w-2.5 rounded-full ${task.status === 'done' ? 'bg-emerald-300' : 'bg-amber-300'}`} />{task.title}<span className="ml-2 text-xs text-slate-400">{task.dueDate}</span></span><span className="text-xs uppercase tracking-widest text-slate-400">{task.status}</span></button>)}</div>
        </section>
      </div>
      <SupportDock role="farmer" />
    </main>
  )
}
