'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth.store'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import CloseIcon from '@mui/icons-material/Close'
import Link from 'next/link'

export function ProfileNudge() {
  const { user } = useAuthStore()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!user) return
    const dismissed = localStorage.getItem('turffy_nudge_dismissed')
    if (dismissed) return
    // Show nudge if user has no phone or avatar
    if (!user.phone || !user.avatar) {
      const timer = setTimeout(() => setShow(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [user])

  if (!show) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-xs bg-white border border-slate-200 rounded-2xl shadow-xl p-4">
      <button
        onClick={() => {
          setShow(false)
          localStorage.setItem('turffy_nudge_dismissed', '1')
        }}
        className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 transition-colors"
      >
        <CloseIcon style={{ fontSize: 16 }} />
      </button>
      <div className="flex items-start gap-3">
        <AccountCircleIcon className="text-brand-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-slate-900">Complete your profile</p>
          <p className="text-xs text-slate-500 mt-1">
            Add your phone number and photo to get faster support and booking updates.
          </p>
          <Link
            href="/profile"
            className="mt-2 inline-block text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
          >
            Complete now →
          </Link>
        </div>
      </div>
    </div>
  )
}
