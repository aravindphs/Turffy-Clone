'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import BlockIcon from '@mui/icons-material/Block'
import LockOpenIcon from '@mui/icons-material/LockOpen'
import BuildIcon from '@mui/icons-material/Build'
import PersonOffIcon from '@mui/icons-material/PersonOff'
import { slotApi } from '@/lib/api'
import { Slot } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

const blockSchema = z.object({
  reason: z.enum(['offline_booking', 'maintenance']),
})

type BlockForm = z.infer<typeof blockSchema>

interface SlotBlockerProps {
  slot: Slot | null
  turfId: string
  isOpen: boolean
  onClose: () => void
}

export function SlotBlocker({ slot, turfId, isOpen, onClose }: SlotBlockerProps) {
  const queryClient = useQueryClient()

  const { register, handleSubmit, watch } = useForm<BlockForm>({
    resolver: zodResolver(blockSchema),
    defaultValues: { reason: 'offline_booking' },
  })

  const blockMutation = useMutation({
    mutationFn: (data: { reason: 'offline_booking' | 'maintenance' }) =>
      slotApi.blockSlot({
        turfId,
        courtId: slot?.courtId || '',
        date: slot?.date || '',
        startTime: slot?.startTime || '',
        endTime: slot?.endTime || '',
        reason: data.reason,
      }),
    onSuccess: () => {
      toast.success('Slot blocked successfully.')
      queryClient.invalidateQueries({ queryKey: ['slots'] })
      onClose()
    },
    onError: () => toast.error('Failed to block slot. Please try again.'),
  })

  const unblockMutation = useMutation({
    mutationFn: () => slotApi.unblockSlot(slot?.id || ''),
    onSuccess: () => {
      toast.success('Slot unblocked.')
      queryClient.invalidateQueries({ queryKey: ['slots'] })
      onClose()
    },
    onError: () => toast.error('Failed to unblock slot.'),
  })

  if (!slot) return null

  const isBlocked = slot.status === 'blocked'
  const isBooked = slot.status === 'booked'

  const onSubmit = (data: BlockForm) => {
    blockMutation.mutate(data)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isBlocked ? 'Unblock Slot' : 'Block Slot'}
      size="sm"
    >
      <div className="space-y-4">
        {/* Slot Info */}
        <div className="p-3 bg-slate-50 rounded-xl">
          <p className="text-sm text-slate-500">Slot</p>
          <p className="font-semibold text-slate-900">
            {slot.startTime} – {slot.endTime}
          </p>
          <p className="text-xs text-slate-400">{slot.date}</p>
        </div>

        {isBooked ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center">
            <BlockIcon className="text-red-400 mb-1" />
            <p className="text-sm text-red-600">This slot is already booked by a customer and cannot be modified.</p>
          </div>
        ) : isBlocked ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              This slot is currently blocked. Would you like to make it available again?
            </p>
            <div className="flex gap-3">
              <Button variant="ghost" fullWidth onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                fullWidth
                leftIcon={<LockOpenIcon fontSize="small" />}
                onClick={() => unblockMutation.mutate()}
                isLoading={unblockMutation.isPending}
              >
                Unblock
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <p className="text-sm text-slate-600">
              Select the reason for blocking this slot:
            </p>

            <div className="space-y-2">
              {[
                {
                  value: 'offline_booking',
                  label: 'Offline Booking',
                  desc: 'Customer booked via phone/in-person',
                  icon: <PersonOffIcon fontSize="small" />,
                },
                {
                  value: 'maintenance',
                  label: 'Maintenance',
                  desc: 'Turf maintenance or repairs',
                  icon: <BuildIcon fontSize="small" />,
                },
              ].map((option) => (
                <label
                  key={option.value}
                  className={[
                    'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                    watch('reason') === option.value
                      ? 'border-brand-400 bg-brand-50'
                      : 'border-slate-200 hover:border-slate-300',
                  ].join(' ')}
                >
                  <input
                    type="radio"
                    {...register('reason')}
                    value={option.value}
                    className="sr-only"
                  />
                  <div className="text-brand-600">{option.icon}</div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{option.label}</p>
                    <p className="text-xs text-slate-500">{option.desc}</p>
                  </div>
                  <div className={`ml-auto h-4 w-4 rounded-full border-2 transition-all ${
                    watch('reason') === option.value
                      ? 'border-brand-600 bg-brand-600'
                      : 'border-slate-300'
                  }`} />
                </label>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="ghost" fullWidth onClick={onClose} type="button">
                Cancel
              </Button>
              <Button
                variant="danger"
                fullWidth
                type="submit"
                leftIcon={<BlockIcon fontSize="small" />}
                isLoading={blockMutation.isPending}
              >
                Block Slot
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  )
}
