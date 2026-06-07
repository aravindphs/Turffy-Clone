'use client'

import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import CheckIcon from '@mui/icons-material/Check'

const TIERS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    description: 'Get started with basic turf management',
    badge: null,
    features: [
      'Up to 2 courts',
      '50 bookings / month',
      'Basic analytics (7 days)',
      'Email notifications',
      'Standard QR codes',
      'Standard listing placement',
    ],
    cta: 'Current plan',
    disabled: true,
    highlight: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 999,
    description: 'For growing turf businesses',
    badge: 'Most Popular',
    features: [
      'Up to 10 courts',
      'Unlimited bookings',
      'Advanced analytics (90 days)',
      'SMS + email notifications',
      'Branded QR codes',
      'Priority listing placement',
      'Custom cancellation policy',
      'Priority customer support',
    ],
    cta: 'Upgrade to Pro',
    disabled: false,
    highlight: true,
  },
  {
    id: 'business',
    name: 'Business',
    price: 2499,
    description: 'For large venues & multi-court turfs',
    badge: null,
    features: [
      'Up to 20 courts',
      'Unlimited bookings',
      'Advanced analytics (1 year)',
      'Bulk SMS & WhatsApp',
      'White-label QR codes',
      'Featured (sponsored) listing',
      'API access',
      'Multi-staff management',
      'Dedicated account manager',
    ],
    cta: 'Upgrade to Business',
    disabled: false,
    highlight: false,
  },
]

export default function PricingPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="text-xs font-semibold text-brand-600 uppercase tracking-widest">Simple Pricing</span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mt-3 mb-4">
            Grow your turf business
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Start free, upgrade when you need more courts, analytics, and visibility.
            No hidden fees — cancel anytime.
          </p>
        </div>

        {/* Tier Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {TIERS.map((tier) => (
            <div
              key={tier.id}
              className={[
                'relative bg-white rounded-2xl border p-8 flex flex-col',
                tier.highlight
                  ? 'border-brand-600 shadow-xl shadow-brand-100 scale-105'
                  : 'border-slate-200 shadow-sm',
              ].join(' ')}
            >
              {tier.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                  {tier.badge}
                </div>
              )}

              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900">{tier.name}</h2>
                <p className="text-sm text-slate-500 mt-1">{tier.description}</p>
                <div className="flex items-baseline gap-1 mt-4">
                  <span className="text-4xl font-extrabold text-slate-900">
                    {tier.price === 0 ? '₹0' : `₹${tier.price.toLocaleString()}`}
                  </span>
                  {tier.price > 0 && <span className="text-slate-400 text-sm">/month</span>}
                </div>
              </div>

              <ul className="space-y-3 flex-1 mb-8">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <CheckIcon
                      style={{ fontSize: 16 }}
                      className={tier.highlight ? 'text-brand-600 mt-0.5' : 'text-emerald-500 mt-0.5'}
                    />
                    <span className="text-sm text-slate-700">{f}</span>
                  </li>
                ))}
              </ul>

              <button
                disabled={tier.disabled}
                onClick={() => !tier.disabled && router.push('/settings?upgrade=' + tier.id)}
                className={[
                  'w-full py-3 rounded-xl font-semibold text-sm transition-colors',
                  tier.disabled
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : tier.highlight
                    ? 'bg-brand-600 text-white hover:bg-brand-700'
                    : 'border border-brand-600 text-brand-600 hover:bg-brand-50',
                ].join(' ')}
              >
                {tier.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Trust signals */}
        <div className="mt-16 text-center">
          <p className="text-slate-500 text-sm">
            All plans include: Razorpay payment processing · SSL security · Real-time slot updates · Mobile-optimised booking
          </p>
          <p className="text-slate-400 text-xs mt-2">
            Turffy takes a 3% commission on each successful booking regardless of plan.
          </p>
        </div>
      </div>

      <Footer />
    </div>
  )
}
