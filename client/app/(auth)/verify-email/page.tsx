'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import MarkEmailUnreadIcon from '@mui/icons-material/MarkEmailUnread'
import toast from 'react-hot-toast'
import { authApi } from '@/lib/api'

// Extend authApi locally for email verification calls
async function verifyEmailOtp(email: string, otp: string) {
  const axios = (await import('axios')).default
  return axios.post(
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/auth/verify-email`,
    { email, otp },
    { withCredentials: true }
  )
}

async function resendVerificationOtp(email: string) {
  const axios = (await import('axios')).default
  return axios.post(
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/auth/resend-verification`,
    { email },
    { withCredentials: true }
  )
}

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''

  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const handleChange = (index: number, value: string) => {
    // Allow only single digit
    const digit = value.replace(/\D/g, '').slice(-1)
    const newOtp = [...otp]
    newOtp[index] = digit
    setOtp(newOtp)
    // Auto-advance
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (otp[index]) {
        const newOtp = [...otp]
        newOtp[index] = ''
        setOtp(newOtp)
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus()
        const newOtp = [...otp]
        newOtp[index - 1] = ''
        setOtp(newOtp)
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    const newOtp = ['', '', '', '', '', '']
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i]
    }
    setOtp(newOtp)
    const focusIndex = Math.min(pasted.length, 5)
    inputRefs.current[focusIndex]?.focus()
  }

  const handleVerify = async () => {
    const code = otp.join('')
    if (code.length < 6) {
      toast.error('Please enter the complete 6-digit OTP.')
      return
    }
    setIsLoading(true)
    try {
      await verifyEmailOtp(email, code)
      toast.success('Email verified successfully!')
      router.replace('/turfs')
    } catch {
      toast.error('Invalid or expired OTP. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (cooldown > 0) return
    try {
      await resendVerificationOtp(email)
      toast.success('OTP resent to your email.')
      setCooldown(60)
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } catch {
      toast.error('Failed to resend OTP. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8 w-full max-w-md"
      >
        {/* Icon */}
        <div className="flex justify-center mb-5">
          <div className="h-16 w-16 bg-brand-50 rounded-2xl flex items-center justify-center">
            <MarkEmailUnreadIcon className="text-brand-600" style={{ fontSize: 32 }} />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-extrabold text-slate-900 text-center">
          Verify your email
        </h1>
        <p className="text-sm text-slate-500 text-center mt-2">
          We&apos;ve sent a 6-digit OTP to{' '}
          <span className="font-semibold text-slate-700">{email || 'your email'}</span>
        </p>

        {/* OTP Input */}
        <div className="flex gap-2.5 justify-center mt-8" onPaste={handlePaste}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className={[
                'h-12 w-10 text-center text-xl font-bold border-2 rounded-xl outline-none transition-all',
                digit
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-slate-200 bg-white text-slate-900',
                'focus:border-brand-500 focus:ring-2 focus:ring-brand-200',
              ].join(' ')}
            />
          ))}
        </div>

        {/* Verify Button */}
        <button
          onClick={handleVerify}
          disabled={isLoading || otp.join('').length < 6}
          className="mt-6 w-full py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <div className="h-5 w-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : null}
          {isLoading ? 'Verifying...' : 'Verify OTP'}
        </button>

        {/* Resend */}
        <div className="mt-4 text-center">
          <p className="text-sm text-slate-500">
            Didn&apos;t receive the OTP?{' '}
            <button
              onClick={handleResend}
              disabled={cooldown > 0}
              className={[
                'font-semibold transition-colors',
                cooldown > 0
                  ? 'text-slate-400 cursor-not-allowed'
                  : 'text-brand-600 hover:text-brand-700 cursor-pointer',
              ].join(' ')}
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="h-8 w-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}
