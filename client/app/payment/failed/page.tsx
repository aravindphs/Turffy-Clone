'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import ErrorIcon from '@mui/icons-material/Error'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SupportAgentIcon from '@mui/icons-material/SupportAgent'
import { Navbar } from '@/components/layout/Navbar'
import { Button } from '@/components/ui/Button'

function PaymentFailedContent() {
  const searchParams = useSearchParams()
  const reason = searchParams.get('reason') || 'Payment could not be processed.'

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="flex items-center justify-center min-h-screen px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="text-center max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="h-24 w-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <ErrorIcon className="text-red-500" style={{ fontSize: 56 }} />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Payment Failed</h1>
            <p className="text-slate-500 text-base mb-2">
              Unfortunately, your payment could not be completed.
            </p>
            <p className="text-sm text-red-500 mb-8">{reason}</p>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6 text-left">
              <p className="font-semibold text-slate-900 text-sm mb-2">What you can do:</p>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Try again with a different payment method</li>
                <li>• Check if your bank is blocking the transaction</li>
                <li>• Contact your bank or card issuer</li>
                <li>• Reach out to our support team</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/turfs">
                <Button leftIcon={<ArrowBackIcon fontSize="small" />} fullWidth>
                  Try Again
                </Button>
              </Link>
              <a href="mailto:support@turffy.in">
                <Button variant="outline" leftIcon={<SupportAgentIcon fontSize="small" />} fullWidth>
                  Contact Support
                </Button>
              </a>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="h-8 w-8 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" /></div>}>
      <PaymentFailedContent />
    </Suspense>
  )
}
