'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, Search, Sparkles } from 'lucide-react'
import { apiUrl } from '@/lib/api'

export default function AgenticSearchPanel({ farm, context }) {
  const [query, setQuery] = useState('What should I do for my rice crop today?')
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [submittedQuery, setSubmittedQuery] = useState('')

  async function runSearch(nextQuery = query) {
    if (!nextQuery.trim()) return
    setSubmittedQuery(nextQuery)
    setLoading(true)
    try {
      const response = await fetch(apiUrl('/api/agentic-search'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: nextQuery,
          farmId: farm?.id || null,
          cropType: farm?.cropType || 'Rice',
          locale: 'hi',
          context: context || {},
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Search plan unavailable')
      setPlan(data)
    } catch (error) {
      setPlan({
        query: nextQuery,
        modules: [{ kind: 'crop', label: 'Quick field response', summary: error.message || 'Search is temporarily unavailable.' }],
        response: 'Field guidance is temporarily unavailable. Please retry the search in a moment.',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim() && query !== submittedQuery) runSearch(query)
    }, 450)

    return () => clearTimeout(timer)
  }, [query, submittedQuery, farm, context])

  return (
    <div className="min-w-0 rounded-[28px] border border-emerald-200 bg-emerald-50/80 p-4 shadow-sm">
      <div className="flex items-center gap-2 text-emerald-700">
        <Search className="h-5 w-5" />
        <p className="text-[10px] font-bold uppercase tracking-[0.25em]">Agentic farmer search</p>
      </div>

      <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={(event) => { event.preventDefault(); runSearch() }}>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ask: mandi rate, residue pickup, crop advice, payment, weather..."
          className="h-12 min-w-0 flex-1 rounded-full border border-emerald-200 bg-white px-4 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-300"
        />
        <button type="submit" disabled={loading || !query.trim()} className="flex h-12 items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60">
          Search
          <Sparkles className="h-4 w-4" />
        </button>
      </form>

      {loading && <p className="mt-3 text-xs font-medium text-emerald-700">Building field guidance...</p>}

      {plan && (
        <div className="mt-5 space-y-4">
          <div className="rounded-2xl border border-white/60 bg-white p-4 text-sm leading-6 text-slate-700">
            {plan.response}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {plan.modules?.map((module) => (
              <div key={module.kind} className="rounded-2xl border border-emerald-100 bg-white/80 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">{module.label}</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{module.summary}</p>
                {module.actions?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {module.actions.map((action) => (
                      <span key={action} className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                        {action}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <button type="button" onClick={() => runSearch(plan.modules?.[0]?.actions?.[0] || query)} className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
            Refresh focused action <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
