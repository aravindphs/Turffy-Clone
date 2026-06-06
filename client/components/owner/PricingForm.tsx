'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import WhatshotIcon from '@mui/icons-material/Whatshot'
import { Court, PeakHour } from '@/types'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import api from '@/lib/api'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface PricingFormProps {
  turfId: string
  court: Court
}

export function PricingForm({ turfId, court }: PricingFormProps) {
  const queryClient = useQueryClient()
  const [peakHours, setPeakHours] = useState<PeakHour[]>(court.peakHours || [])

  const saveMutation = useMutation({
    mutationFn: () =>
      api.put(`/turfs/${turfId}/courts/${court._id}/pricing`, { peakHours }),
    onSuccess: () => {
      toast.success('Pricing updated!')
      queryClient.invalidateQueries({ queryKey: ['my-turf'] })
    },
    onError: () => toast.error('Failed to save pricing.'),
  })

  const addPeakHour = () => {
    setPeakHours([
      ...peakHours,
      { startTime: '18:00', endTime: '21:00', days: [0, 6], priceMultiplier: 1.5 },
    ])
  }

  const removePeakHour = (index: number) => {
    setPeakHours(peakHours.filter((_, i) => i !== index))
  }

  const updatePeakHour = (index: number, key: keyof PeakHour, value: unknown) => {
    setPeakHours(peakHours.map((p, i) => (i === index ? { ...p, [key]: value } : p)))
  }

  const toggleDay = (index: number, day: number) => {
    const current = peakHours[index].days
    const updated = current.includes(day) ? current.filter((d) => d !== day) : [...current, day]
    updatePeakHour(index, 'days', updated)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-900">Peak Hour Pricing</h3>
          <p className="text-sm text-slate-500">Set higher rates for popular time slots</p>
        </div>
        <Button
          size="sm"
          leftIcon={<AddIcon fontSize="small" />}
          onClick={addPeakHour}
        >
          Add Peak
        </Button>
      </div>

      {/* Base Price Info */}
      <div className="p-4 bg-slate-50 rounded-xl">
        <p className="text-sm text-slate-500">Base Price</p>
        <p className="text-lg font-bold text-slate-900">₹{court.basePricePerSlot} / slot</p>
      </div>

      {peakHours.length === 0 ? (
        <div className="py-10 text-center bg-slate-50 rounded-xl">
          <WhatshotIcon className="text-slate-300 text-4xl mb-2" />
          <p className="text-slate-500">No peak hours defined.</p>
          <p className="text-xs text-slate-400">Add peak hour pricing to charge more during busy times.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {peakHours.map((peak, i) => (
            <div key={i} className="p-4 bg-orange-50 border border-orange-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <WhatshotIcon className="text-orange-500" fontSize="small" />
                  <span className="font-medium text-orange-800">Peak Period {i + 1}</span>
                </div>
                <button
                  onClick={() => removePeakHour(i)}
                  className="text-orange-400 hover:text-red-500 transition-colors"
                >
                  <DeleteIcon fontSize="small" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Input
                  label="Start Time"
                  type="time"
                  value={peak.startTime}
                  onChange={(e) => updatePeakHour(i, 'startTime', e.target.value)}
                />
                <Input
                  label="End Time"
                  type="time"
                  value={peak.endTime}
                  onChange={(e) => updatePeakHour(i, 'endTime', e.target.value)}
                />
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Multiplier</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="5"
                      value={peak.priceMultiplier}
                      onChange={(e) => updatePeakHour(i, 'priceMultiplier', parseFloat(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl border border-orange-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">×</span>
                  </div>
                  <p className="text-xs text-orange-600 mt-1">
                    = ₹{Math.round(court.basePricePerSlot * peak.priceMultiplier)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-600 mb-2">Active Days</p>
                <div className="flex gap-1.5">
                  {DAYS.map((day, dayIdx) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(i, dayIdx)}
                      className={[
                        'h-8 w-8 rounded-lg text-xs font-medium transition-all',
                        peak.days.includes(dayIdx)
                          ? 'bg-orange-500 text-white'
                          : 'bg-white border border-orange-200 text-orange-600 hover:border-orange-400',
                      ].join(' ')}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Button
        fullWidth
        onClick={() => saveMutation.mutate()}
        isLoading={saveMutation.isPending}
      >
        Save Pricing
      </Button>
    </div>
  )
}
