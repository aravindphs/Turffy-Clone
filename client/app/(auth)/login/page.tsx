'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import { motion } from 'framer-motion'
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer'
import PersonIcon from '@mui/icons-material/Person'
import StorefrontIcon from '@mui/icons-material/Storefront'
import { useAuthStore } from '@/store/auth.store'
import { useAuth } from '@/hooks/useAuth'

declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential: string }) => void
            auto_select?: boolean
          }) => void
          renderButton: (element: HTMLElement, config: {
            type?: string
            theme?: string
            size?: string
            text?: string
            width?: number
            logo_alignment?: string
          }) => void
        }
      }
    }
  }
}

export default function LoginPage() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()
  const { googleLogin, isGoogleLoggingIn } = useAuth()
  const [role, setRole] = useState<'user' | 'owner'>('user')
  const [gsiReady, setGsiReady] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') router.replace('/admin/dashboard')
      else if (user.role === 'owner') router.replace('/dashboard')
      else router.replace('/turfs')
    }
  }, [isAuthenticated, user, router])

  const renderGoogleButton = useCallback(() => {
    if (!gsiReady || !window.google?.accounts?.id) return
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (!clientId) return

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        googleLogin({ credential: response.credential, role })
      },
    })

    const el = document.getElementById('google-signin-btn')
    if (el) {
      el.innerHTML = ''
      window.google.accounts.id.renderButton(el, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        width: 368,
        logo_alignment: 'center',
      })
    }
  }, [gsiReady, googleLogin, role])

  // Re-render button whenever role changes or GSI becomes ready
  useEffect(() => {
    renderGoogleButton()
  }, [renderGoogleButton])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setGsiReady(true)}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-2 mb-5">
            <div className="h-11 w-11 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg">
              <SportsSoccerIcon className="text-white" fontSize="medium" />
            </div>
            <span className="text-2xl font-extrabold text-slate-900">Turffy</span>
          </Link>
          <h1 className="text-xl font-bold text-slate-900">Welcome to Turffy</h1>
          <p className="text-slate-500 text-sm mt-1 text-center">
            Book or manage sports turfs across Tamil Nadu
          </p>
        </div>

        {/* Role selector */}
        <div className="mb-7">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide text-center mb-3">
            I want to
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setRole('user')}
              className={[
                'flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all duration-150',
                role === 'user'
                  ? 'border-brand-600 bg-brand-50 text-brand-700'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50',
              ].join(' ')}
            >
              <PersonIcon />
              <span className="text-sm font-semibold">Book Turfs</span>
              <span className="text-xs opacity-60 leading-tight text-center">
                Find & book courts
              </span>
            </button>

            <button
              onClick={() => setRole('owner')}
              className={[
                'flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all duration-150',
                role === 'owner'
                  ? 'border-brand-600 bg-brand-50 text-brand-700'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50',
              ].join(' ')}
            >
              <StorefrontIcon />
              <span className="text-sm font-semibold">Own a Turf</span>
              <span className="text-xs opacity-60 leading-tight text-center">
                List your facility
              </span>
            </button>
          </div>
        </div>

        {/* Google Sign-In button */}
        <div className="flex flex-col items-center">
          <div
            id="google-signin-btn"
            className="min-h-[44px] flex items-center justify-center w-full"
          />

          {!gsiReady && (
            <div className="flex items-center gap-2 text-sm text-slate-400 py-2">
              <div className="h-4 w-4 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin" />
              Loading...
            </div>
          )}

          {isGoogleLoggingIn && (
            <div className="flex items-center gap-2 text-sm text-slate-500 mt-2">
              <div className="h-4 w-4 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
              Signing you in...
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          By continuing, you agree to our{' '}
          <Link href="#" className="text-slate-600 underline">Terms</Link>
          {' '}and{' '}
          <Link href="#" className="text-slate-600 underline">Privacy Policy</Link>
        </p>
      </motion.div>
    </div>
  )
}
