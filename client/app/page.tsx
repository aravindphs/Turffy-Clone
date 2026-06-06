'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, useInView, animate } from 'framer-motion'
import SearchIcon from '@mui/icons-material/Search'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer'
import SportsCricketIcon from '@mui/icons-material/SportsCricket'
import SportsBasketballIcon from '@mui/icons-material/SportsBasketball'
import SportsTennisIcon from '@mui/icons-material/SportsTennis'
import SportsVolleyballIcon from '@mui/icons-material/SportsVolleyball'
import SportsHandballIcon from '@mui/icons-material/SportsHandball'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid'
import StarIcon from '@mui/icons-material/Star'
import BlockIcon from '@mui/icons-material/Block'
import BoltIcon from '@mui/icons-material/Bolt'
import ShieldIcon from '@mui/icons-material/Shield'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

const CITIES = [
  'Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem',
  'Tirunelveli', 'Vellore', 'Erode', 'Thanjavur', 'Dindigul',
  'Tiruppur', 'Nagercoil', 'Kanchipuram', 'Kumbakonam', 'Hosur',
]

const SPORTS = [
  { name: 'Football', icon: <SportsSoccerIcon />, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { name: 'Cricket', icon: <SportsCricketIcon />, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { name: 'Basketball', icon: <SportsBasketballIcon />, color: 'text-orange-600 bg-orange-50 border-orange-200' },
  { name: 'Badminton', icon: <SportsHandballIcon />, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { name: 'Tennis', icon: <SportsTennisIcon />, color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  { name: 'Volleyball', icon: <SportsVolleyballIcon />, color: 'text-red-600 bg-red-50 border-red-200' },
]

const TESTIMONIALS = [
  {
    name: 'Karthik Rajan',
    city: 'Chennai',
    rating: 5,
    text: "Turffy made booking so easy! Found a great football ground near me in 2 minutes. The real-time slot updates are fantastic.",
    avatar: 'KR',
  },
  {
    name: 'Priya Sundaram',
    city: 'Coimbatore',
    rating: 5,
    text: "Love how I can see exactly which slots are available without calling anyone. Booked a badminton court at 11 PM for next morning!",
    avatar: 'PS',
  },
  {
    name: 'Mohammed Arif',
    city: 'Madurai',
    rating: 5,
    text: "As a turf owner, the offline blocking feature is a game changer. My walk-in customers don't clash with online bookings anymore.",
    avatar: 'MA',
  },
]

// Animated counter
function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (isInView && ref.current) {
      const controls = animate(0, target, {
        duration: 2,
        onUpdate: (value) => {
          if (ref.current) {
            ref.current.textContent = Math.round(value).toLocaleString() + suffix
          }
        },
      })
      return () => controls.stop()
    }
  }, [isInView, target, suffix])

  return <span ref={ref}>0{suffix}</span>
}

export default function LandingPage() {
  const router = useRouter()
  const [searchCity, setSearchCity] = useState('')
  const [selectedSport, setSelectedSport] = useState('')
  const [citySuggestions, setCitySuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const handleCityInput = (value: string) => {
    setSearchCity(value)
    if (value.length > 0) {
      const filtered = CITIES.filter((c) =>
        c.toLowerCase().includes(value.toLowerCase())
      )
      setCitySuggestions(filtered)
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
    }
  }

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (searchCity) params.set('city', searchCity)
    if (selectedSport) params.set('sport', selectedSport.toLowerCase())
    router.push(`/turfs?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="animated-gradient min-h-screen flex items-center relative overflow-hidden pt-16">
        {/* Decorative circles */}
        <div className="absolute top-20 right-10 h-72 w-72 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="absolute bottom-20 left-10 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />

        {/* Turf pattern overlay */}
        <div className="absolute inset-0 opacity-5 bg-turf-pattern" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-full px-4 py-2 mb-6 text-sm">
              <BoltIcon fontSize="small" className="text-yellow-400" />
              <span>Real-time slot booking — no phone calls needed</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-white leading-tight mb-6">
              Book Your Turf
              <br />
              <span className="gradient-text">in Seconds</span>
            </h1>

            <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-10">
              Tamil Nadu&apos;s most trusted sports turf booking platform. Real-time availability, instant
              confirmation, zero hassle.
            </p>

            {/* Search Box */}
            <div className="glass rounded-2xl p-3 max-w-2xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* City Input */}
                <div className="relative flex-1">
                  <LocationOnIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fontSize="small" />
                  <input
                    value={searchCity}
                    onChange={(e) => handleCityInput(e.target.value)}
                    placeholder="Enter city (e.g., Chennai)"
                    className="w-full pl-10 pr-4 py-3.5 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-slate-400"
                    onFocus={() => searchCity && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  />
                  {showSuggestions && citySuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden">
                      {citySuggestions.map((city) => (
                        <button
                          key={city}
                          className="w-full px-4 py-2.5 text-left text-sm hover:bg-brand-50 text-slate-700 transition-colors"
                          onMouseDown={() => { setSearchCity(city); setShowSuggestions(false) }}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={handleSearch}
                  className="flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-6 py-3.5 rounded-xl font-semibold transition-all text-sm"
                >
                  <SearchIcon fontSize="small" />
                  Search Turfs
                </button>
              </div>
            </div>

            {/* Sport Filter Chips */}
            <div className="flex flex-wrap justify-center gap-2 mt-5">
              {SPORTS.map((sport) => (
                <button
                  key={sport.name}
                  onClick={() =>
                    setSelectedSport(selectedSport === sport.name ? '' : sport.name)
                  }
                  className={[
                    'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border backdrop-blur-sm transition-all',
                    selectedSport === sport.name
                      ? 'bg-white text-slate-900 border-white shadow-md'
                      : 'bg-white/10 text-white border-white/30 hover:bg-white/20',
                  ].join(' ')}
                >
                  {sport.icon}
                  {sport.name}
                </button>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 animate-bounce">
          <div className="h-8 w-5 border-2 border-white/30 rounded-full flex items-start justify-center pt-1">
            <div className="h-1.5 w-1 bg-white/50 rounded-full animate-scroll" />
          </div>
        </div>
      </section>

      {/* ── STATS ──────────────────────────────────────────────── */}
      <section className="bg-slate-900 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: 500, suffix: '+', label: 'Turfs Listed' },
              { value: 50000, suffix: '+', label: 'Happy Bookings' },
              { value: 25, suffix: '+', label: 'Cities Covered' },
              { value: 4.8, suffix: '★', label: 'Average Rating' },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <p className="text-3xl md:text-4xl font-extrabold text-white mb-1">
                  <Counter target={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-slate-400 text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────── */}
      <section className="section-padding bg-white" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4"
            >
              Why Choose Turffy?
            </motion.h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              We&apos;ve solved every problem with traditional turf booking.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <BoltIcon className="text-yellow-500 text-3xl" />,
                title: 'Real-time Availability',
                desc: 'See which slots are available right now. No stale data — slots update instantly via live connection. What you see is what you get.',
                highlight: true,
              },
              {
                icon: <BlockIcon className="text-red-500 text-3xl" />,
                title: 'Offline Booking Protection',
                desc: 'Our unique offline blocking feature lets turf owners block slots for walk-in customers — eliminating double-bookings forever.',
                highlight: true,
                badge: 'Exclusive',
              },
              {
                icon: <ShieldIcon className="text-brand-600 text-3xl" />,
                title: 'Secure Payments',
                desc: 'Pay securely via Razorpay — UPI, cards, net banking, wallets. Full refund on cancellation within policy.',
                highlight: false,
              },
              {
                icon: <SearchIcon className="text-blue-500 text-3xl" />,
                title: 'Smart Search',
                desc: 'Find turfs near you using GPS, or search by city, sport, date, amenities and price range. Always find the perfect match.',
                highlight: false,
              },
              {
                icon: <StarIcon className="text-amber-500 text-3xl" />,
                title: 'Verified Reviews',
                desc: 'Only users who have actually booked can leave reviews. Trust genuine ratings and make informed decisions.',
                highlight: false,
              },
              {
                icon: <PhoneAndroidIcon className="text-purple-500 text-3xl" />,
                title: 'Mobile Optimised',
                desc: 'Designed mobile-first. Book from anywhere in under 60 seconds. Works perfectly on any screen size.',
                highlight: false,
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className={[
                  'relative p-6 rounded-2xl border transition-all',
                  feature.highlight
                    ? 'border-brand-200 bg-brand-50 shadow-md'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md',
                ].join(' ')}
              >
                {feature.badge && (
                  <span className="absolute top-4 right-4 bg-brand-600 text-white text-xs px-2.5 py-1 rounded-full font-semibold">
                    {feature.badge}
                  </span>
                )}
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────── */}
      <section className="section-padding bg-slate-50" id="how-it-works">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
              Book in 3 Simple Steps
            </h2>
            <p className="text-slate-500">No calls. No waiting. No double-booking.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-12 left-1/3 right-1/3 h-0.5 bg-brand-200 z-0" />

            {[
              {
                step: '01',
                title: 'Search Your City',
                desc: 'Enter your city or use location detection. Filter by sport, date, price and amenities.',
                icon: <SearchIcon className="text-brand-600" />,
              },
              {
                step: '02',
                title: 'Pick Your Slot',
                desc: 'See the live slot grid — green is available, red is booked, grey is blocked. Select multiple consecutive slots.',
                icon: <CheckCircleIcon className="text-brand-600" />,
              },
              {
                step: '03',
                title: 'Pay & Play!',
                desc: 'Pay securely via UPI, card or net banking. Instant confirmation + get directions to the turf.',
                icon: <SportsSoccerIcon className="text-brand-600" />,
              },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2, duration: 0.5 }}
                className="relative z-10 flex flex-col items-center text-center"
              >
                <div className="h-20 w-20 bg-white rounded-2xl border-2 border-brand-200 shadow-lg flex items-center justify-center mb-5 relative">
                  <div className="text-2xl">{step.icon}</div>
                  <div className="absolute -top-3 -right-3 h-7 w-7 bg-brand-600 rounded-full text-white text-xs font-bold flex items-center justify-center">
                    {step.step}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/turfs"
              className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-8 py-3.5 rounded-xl font-semibold transition-all text-base"
            >
              <SearchIcon fontSize="small" />
              Find Turfs Near You
            </Link>
          </div>
        </div>
      </section>

      {/* ── SPORT CATEGORIES ───────────────────────────────────── */}
      <section className="section-padding bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
              Your Favourite Sports
            </h2>
            <p className="text-slate-500">Find turfs for every sport across Tamil Nadu.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {SPORTS.map((sport, i) => (
              <motion.div
                key={sport.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link
                  href={`/turfs?sport=${sport.name.toLowerCase()}`}
                  className={`flex flex-col items-center gap-3 p-5 rounded-2xl border hover:shadow-md transition-all ${sport.color}`}
                >
                  <div className="text-3xl">{sport.icon}</div>
                  <span className="font-semibold text-sm">{sport.name}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ───────────────────────────────────────── */}
      <section className="section-padding bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
              What Players Say
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
              >
                <div className="flex gap-0.5 mb-4">
                  {[...Array(t.rating)].map((_, s) => (
                    <StarIcon key={s} className="text-amber-400" style={{ fontSize: 18 }} />
                  ))}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center">
                    <span className="text-sm font-semibold text-brand-700">{t.avatar}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.city}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOR OWNERS CTA ─────────────────────────────────────── */}
      <section className="section-padding bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
              Own a Turf? List It Free.
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto mb-8">
              Join 500+ turf owners on Turffy. Manage online & offline bookings in one place,
              get real-time insights, and eliminate double-bookings forever.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register?role=owner"
                className="inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-8 py-3.5 rounded-xl font-semibold transition-all"
              >
                List Your Turf Free
              </Link>
              <Link
                href="/turfs"
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-8 py-3.5 rounded-xl font-semibold transition-all border border-white/20"
              >
                Browse as Player
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
