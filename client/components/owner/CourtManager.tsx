'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import SportsIcon from '@mui/icons-material/Sports'
import { Court, SportType } from '@/types'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import api from '@/lib/api'

const courtSchema = z.object({
  name: z.string().min(2, 'Name required'),
  sport: z.string().min(1, 'Select a sport'),
  slotDurationMinutes: z.number().int().min(30).max(120),
  basePricePerSlot: z.number().min(50, 'Minimum ₹50'),
  openTime: z.string(),
  closeTime: z.string(),
})

type CourtFormData = z.infer<typeof courtSchema>

const SPORTS: SportType[] = ['football', 'cricket', 'basketball', 'badminton', 'tennis', 'volleyball']

interface CourtManagerProps {
  turfId: string
  courts: Court[]
}

export function CourtManager({ turfId, courts }: CourtManagerProps) {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCourt, setEditingCourt] = useState<Court | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CourtFormData>({
    resolver: zodResolver(courtSchema),
    defaultValues: {
      slotDurationMinutes: 60,
      basePricePerSlot: 500,
      openTime: '06:00',
      closeTime: '22:00',
    },
  })

  const saveMutation = useMutation({
    mutationFn: (data: CourtFormData) => {
      if (editingCourt) {
        return api.put(`/turfs/${turfId}/courts/${editingCourt._id}`, data)
      }
      return api.post(`/turfs/${turfId}/courts`, data)
    },
    onSuccess: () => {
      toast.success(editingCourt ? 'Court updated!' : 'Court added!')
      queryClient.invalidateQueries({ queryKey: ['my-turf'] })
      handleClose()
    },
    onError: () => toast.error('Failed to save court.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (courtId: string) => api.delete(`/turfs/${turfId}/courts/${courtId}`),
    onSuccess: () => {
      toast.success('Court deleted.')
      queryClient.invalidateQueries({ queryKey: ['my-turf'] })
    },
    onError: () => toast.error('Failed to delete court.'),
  })

  const handleOpen = (court?: Court) => {
    if (court) {
      setEditingCourt(court)
      reset({
        name: court.name,
        sport: court.sport,
        slotDurationMinutes: court.slotDurationMinutes,
        basePricePerSlot: court.basePricePerSlot,
        openTime: court.operatingHours.open,
        closeTime: court.operatingHours.close,
      })
    } else {
      setEditingCourt(null)
      reset()
    }
    setIsModalOpen(true)
  }

  const handleClose = () => {
    setIsModalOpen(false)
    setEditingCourt(null)
    reset()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">Courts ({courts.length})</h3>
        <Button
          size="sm"
          leftIcon={<AddIcon fontSize="small" />}
          onClick={() => handleOpen()}
        >
          Add Court
        </Button>
      </div>

      {courts.length === 0 ? (
        <div className="py-10 text-center bg-slate-50 rounded-xl">
          <SportsIcon className="text-slate-300 text-4xl mb-2" />
          <p className="text-slate-500">No courts yet. Add your first court!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {courts.map((court) => (
            <div
              key={court._id}
              className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-900">{court.name}</p>
                  <Badge variant="green" size="sm">{court.sport}</Badge>
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  ₹{court.basePricePerSlot}/slot • {court.slotDurationMinutes}min slots • {court.operatingHours.open}–{court.operatingHours.close}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpen(court)}
                  className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                >
                  <EditIcon fontSize="small" />
                </button>
                <button
                  onClick={() => deleteMutation.mutate(court._id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <DeleteIcon fontSize="small" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleClose}
        title={editingCourt ? 'Edit Court' : 'Add Court'}
        size="md"
      >
        <form onSubmit={handleSubmit((data) => saveMutation.mutate(data))} className="space-y-4">
          <Input
            label="Court Name"
            {...register('name')}
            error={errors.name?.message}
            placeholder="e.g., Court A, Ground 1"
            required
          />

          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">
              Sport <span className="text-red-500">*</span>
            </label>
            <select
              {...register('sport')}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Select sport</option>
              {SPORTS.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
            {errors.sport && <p className="text-xs text-red-500 mt-1">{errors.sport.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">
                Slot Duration
              </label>
              <select
                {...register('slotDurationMinutes', { valueAsNumber: true })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value={30}>30 minutes</option>
                <option value={60}>60 minutes</option>
                <option value={90}>90 minutes</option>
                <option value={120}>120 minutes</option>
              </select>
            </div>
            <Input
              label="Base Price (₹/slot)"
              type="number"
              {...register('basePricePerSlot', { valueAsNumber: true })}
              error={errors.basePricePerSlot?.message}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Opening Time"
              type="time"
              {...register('openTime')}
              required
            />
            <Input
              label="Closing Time"
              type="time"
              {...register('closeTime')}
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" fullWidth onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" fullWidth isLoading={saveMutation.isPending}>
              {editingCourt ? 'Save Changes' : 'Add Court'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
