'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer'
import EmailIcon from '@mui/icons-material/Email'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
})

type Form = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const { forgotPassword, isSendingReset } = useAuth()
  const [submitted, setSubmitted] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  })

  const onSubmit = (data: Form) => {
    setSubmittedEmail(data.email)
    forgotPassword(data.email)
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-8"
      >
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-2 mb-6">
            <div className="h-10 w-10 bg-brand-500 rounded-xl flex items-center justify-center">
              <SportsSoccerIcon className="text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-900">Turffy</span>
          </Link>
        </div>

        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-4"
          >
            <div className="h-16 w-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircleIcon className="text-brand-600 text-3xl" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Check Your Email</h2>
            <p className="text-slate-500 text-sm">
              We&apos;ve sent a password reset link to <strong>{submittedEmail}</strong>.
              Check your inbox (and spam folder).
            </p>
            <p className="text-xs text-slate-400">The link will expire in 1 hour.</p>
            <Link href="/login">
              <Button variant="outline" fullWidth leftIcon={<ArrowBackIcon fontSize="small" />}>
                Back to Sign In
              </Button>
            </Link>
          </motion.div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Reset Password</h1>
            <p className="text-slate-500 text-sm mb-6">
              Enter the email address associated with your account.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                {...register('email')}
                error={errors.email?.message}
                placeholder="you@example.com"
                leftIcon={<EmailIcon fontSize="small" />}
                required
                fullWidth
              />
              <Button type="submit" fullWidth size="lg" isLoading={isSendingReset}>
                Send Reset Link
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="flex items-center justify-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
              >
                <ArrowBackIcon fontSize="small" />
                Back to Sign In
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}
