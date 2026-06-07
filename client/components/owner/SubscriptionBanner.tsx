'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import StarIcon from '@mui/icons-material/Star'
import DiamondIcon from '@mui/icons-material/Diamond'
import api from '@/lib/api'

interface SubStatus {
  tier: 'free' | 'pro' | 'business'
  isActive: boolean
  validUntil: string | null
}

export function SubscriptionBanner() {
  const [sub, setSub] = useState<SubStatus | null>(null)

  useEffect(() => {
    api
      .get('/subscription')
      .then((r) => setSub(r.data.data))
      .catch(() => setSub({ tier: 'free', isActive: false, validUntil: null }))
  }, [])

  if (!sub) return null

  if (sub.tier !== 'free' && sub.isActive) {
    const tierColor =
      sub.tier === 'business'
        ? 'text-purple-600 bg-purple-50 border-purple-200'
        : 'text-brand-600 bg-brand-50 border-brand-200'
    const icon =
      sub.tier === 'business' ? (
        <DiamondIcon fontSize="small" />
      ) : (
        <StarIcon fontSize="small" />
      )

    return (
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${tierColor} mb-6`}>
        {icon}
        <div className="flex-1">
          <p className="font-semibold text-sm capitalize">Turffy {sub.tier}</p>
          {sub.validUntil && (
            <p className="text-xs opacity-75">
              Renews{' '}
              {new Date(sub.validUntil).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          )}
        </div>
        <Link href="/pricing" className="text-xs font-medium underline opacity-75 hover:opacity-100">
          Manage
        </Link>
      </div>
    )
  }

  // Free tier — show upgrade nudge
  return (
    <div className="flex items-center gap-3 bg-gradient-to-r from-brand-600 to-emerald-500 text-white px-4 py-3 rounded-xl mb-6">
      <StarIcon fontSize="small" />
      <div className="flex-1">
        <p className="font-semibold text-sm">Upgrade to Pro — ₹999/mo</p>
        <p className="text-xs opacity-80">
          Unlock unlimited courts, advanced analytics, and priority listings
        </p>
      </div>
      <Link
        href="/pricing"
        className="text-xs font-bold bg-white text-brand-600 px-3 py-1.5 rounded-lg hover:bg-brand-50 transition-colors whitespace-nowrap"
      >
        See plans
      </Link>
    </div>
  )
}
