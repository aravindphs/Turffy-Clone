'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import PersonIcon from '@mui/icons-material/Person'
import { turfApi } from '@/lib/api'
import { Turf, User } from '@/types'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'

interface TurfApprovalProps {
  turf: Turf
}

export function TurfApproval({ turf }: TurfApprovalProps) {
  const queryClient = useQueryClient()
  const [rejectModal, setRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const owner = turf.owner as User

  const approveMutation = useMutation({
    mutationFn: () => turfApi.approve(turf._id),
    onSuccess: () => {
      toast.success('Turf approved!')
      queryClient.invalidateQueries({ queryKey: ['pending-turfs'] })
    },
    onError: () => toast.error('Failed to approve.'),
  })

  const rejectMutation = useMutation({
    mutationFn: () => turfApi.reject(turf._id, rejectReason),
    onSuccess: () => {
      toast.success('Turf rejected.')
      queryClient.invalidateQueries({ queryKey: ['pending-turfs'] })
      setRejectModal(false)
    },
    onError: () => toast.error('Failed to reject.'),
  })

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Image */}
        <div className="relative h-40">
          {turf.images[0] ? (
            <Image src={turf.images[0]} alt={turf.name} fill className="object-cover" />
          ) : (
            <div className="h-full bg-slate-200 flex items-center justify-center text-4xl">🏟️</div>
          )}
          <div className="absolute top-3 right-3">
            <Badge variant="yellow" dot>Pending Review</Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3">
          <h3 className="font-semibold text-slate-900 text-base">{turf.name}</h3>

          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <LocationOnIcon fontSize="small" className="text-brand-500" />
            {turf.location.address}, {turf.location.city}
          </div>

          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <PersonIcon fontSize="small" className="text-slate-400" />
            {owner.name} • {owner.email}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {turf.sports.map((sport) => (
              <Badge key={sport} variant="blue" size="sm">{sport}</Badge>
            ))}
          </div>

          <p className="text-sm text-slate-600 line-clamp-2">{turf.description}</p>

          <div className="flex gap-3 pt-2">
            <Button
              variant="danger"
              size="sm"
              fullWidth
              leftIcon={<CancelIcon fontSize="small" />}
              onClick={() => setRejectModal(true)}
            >
              Reject
            </Button>
            <Button
              size="sm"
              fullWidth
              leftIcon={<CheckCircleIcon fontSize="small" />}
              isLoading={approveMutation.isPending}
              onClick={() => approveMutation.mutate()}
            >
              Approve
            </Button>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      <Modal
        isOpen={rejectModal}
        onClose={() => setRejectModal(false)}
        title="Reject Turf"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Please provide a reason for rejecting <strong>{turf.name}</strong>. This will be shared with the owner.
          </p>
          <Input
            label="Rejection Reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g., Incomplete information, poor image quality..."
          />
          <div className="flex gap-3">
            <Button variant="ghost" fullWidth onClick={() => setRejectModal(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              fullWidth
              isLoading={rejectMutation.isPending}
              disabled={!rejectReason.trim()}
              onClick={() => rejectMutation.mutate()}
            >
              Reject
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
