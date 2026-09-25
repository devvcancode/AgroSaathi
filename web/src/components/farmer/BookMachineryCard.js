'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tractor, CheckCircle2 } from 'lucide-react'
import { apiUrl } from '@/lib/api'

const MACHINE_TYPES = ['Happy Seeder', 'Baler', 'Mulcher', 'Boom Sprayer']

export default function BookMachineryCard({ farm, defaultType = 'Happy Seeder', triggerLabel = 'Book Machinery', triggerClass = 'pill-dark' }) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState(defaultType)
  const [date, setDate] = useState('')
  const [acres, setAcres] = useState(farm?.areaInAcres || 5)
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  async function submit() {
    setLoading(true)
    try {
      const res = await fetch(apiUrl('/api/bookings'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmId: farm?.id,
          farmerName: farm?.name,
          district: farm?.district,
          machineryType: type,
          acres: Number(acres),
          date: date || new Date().toISOString().slice(0, 10),
        }),
      })
      const data = await res.json()
      setStatus(data)
    } catch (e) {
      setStatus({ error: 'Booking failed' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setStatus(null) }}>
      <DialogTrigger asChild>
        <button className={triggerClass}>
          <Tractor className="mr-2 h-4 w-4" /> {triggerLabel}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Book a machine</DialogTitle>
        </DialogHeader>
        {status && !status.error ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            <p className="text-lg font-semibold text-slate-900">Booking requested!</p>
            <p className="text-sm text-slate-600">{status.machineryType} for {status.acres} acres on {status.date} in {status.district || 'your district'}.</p>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Machine type</Label>
              <div className="grid grid-cols-2 gap-2">
                {MACHINE_TYPES.map((m) => (
                  <button key={m} onClick={() => setType(m)} className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${type === m ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-700 hover:border-slate-400'}`}>{m}</button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="acres">Acres</Label>
              <Input id="acres" type="number" value={acres} onChange={(e) => setAcres(e.target.value)} />
            </div>
          </div>
        )}
        {(!status || status.error) && (
          <DialogFooter>
            <Button onClick={submit} disabled={loading} className="w-full rounded-full bg-slate-900 hover:bg-slate-800">
              {loading ? 'Requesting…' : 'Confirm booking'}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
