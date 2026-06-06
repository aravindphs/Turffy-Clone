'use client'

import { useState, Suspense } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import SearchIcon from '@mui/icons-material/Search'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import FilterListIcon from '@mui/icons-material/FilterList'
import CloseIcon from '@mui/icons-material/Close'
import TuneIcon from '@mui/icons-material/Tune'
import GpsFixedIcon from '@mui/icons-material/GpsFixed'
import { turfApi } from '@/lib/api'
import { TurfGrid } from '@/components/turf/TurfGrid'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/Button'
import { useGeolocation } from '@/hooks/useGeolocation'
import { TurfAmenity, SportType, TurfFilters } from '@/types'

const CITIES = [
  'Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem',
  'Tirunelveli', 'Vellore', 'Erode', 'Thanjavur', 'Tiruppur',
]

const SPORTS: SportType[] = ['football', 'cricket', 'basketball', 'badminton', 'tennis', 'volleyball']

const AMENITIES: { key: TurfAmenity; label: string }[] = [
  { key: 'parking', label: 'Parking' },
  { key: 'floodlight', label: 'Floodlight' },
  { key: 'changing_room', label: 'Changing Room' },
  { key: 'cafeteria', label: 'Cafeteria' },
  { key: 'wifi', label: 'WiFi' },
  { key: 'coaching', label: 'Coaching' },
]

function TurfsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { lat, lng, getLocation, isLoading: geoLoading } = useGeolocation()

  const [city, setCity] = useState(searchParams.get('city') || '')
  const [sport, setSport] = useState<SportType | ''>(
    (searchParams.get('sport') as SportType) || ''
  )
  const [selectedAmenities, setSelectedAmenities] = useState<TurfAmenity[]>([])
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [searchInput, setSearchInput] = useState(city)

  const filters: TurfFilters = {
    city: city || undefined,
    sport: sport || undefined,
    amenities: selectedAmenities.length > 0 ? selectedAmenities : undefined,
    minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
    maxPrice: priceRange[1] < 5000 ? priceRange[1] : undefined,
    lat: lat || undefined,
    lng: lng || undefined,
    radius: lat ? 20 : undefined,
    limit: 24,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['turfs', filters],
    queryFn: async () => {
      const res = await turfApi.getAll(filters)
      return res.data
    },
  })

  const turfs = data?.data || []

  const handleSearch = () => {
    setCity(searchInput)
  }

  const toggleAmenity = (amenity: TurfAmenity) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    )
  }

  const clearFilters = () => {
    setCity('')
    setSearchInput('')
    setSport('')
    setSelectedAmenities([])
    setPriceRange([0, 5000])
  }

  const hasFilters = city || sport || selectedAmenities.length > 0 || lat

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Top Search Bar */}
      <div className="sticky top-16 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fontSize="small" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search by city..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Use Location */}
            <Button
              size="sm"
              variant={lat ? 'primary' : 'outline'}
              leftIcon={<GpsFixedIcon fontSize="small" />}
              onClick={getLocation}
              isLoading={geoLoading}
            >
              <span className="hidden sm:inline">Near Me</span>
            </Button>

            {/* Filters Toggle */}
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={[
                'flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-colors',
                filtersOpen || hasFilters
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300',
              ].join(' ')}
            >
              <TuneIcon fontSize="small" />
              <span className="hidden sm:inline">Filters</span>
              {hasFilters && (
                <span className="h-5 w-5 bg-white text-brand-600 rounded-full text-xs font-bold flex items-center justify-center">
                  {(city ? 1 : 0) + (sport ? 1 : 0) + selectedAmenities.length + (lat ? 1 : 0)}
                </span>
              )}
            </button>
          </div>

          {/* Sport Chips */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setSport('')}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                !sport ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              All Sports
            </button>
            {SPORTS.map((s) => (
              <button
                key={s}
                onClick={() => setSport(sport === s ? '' : s)}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize ${
                  sport === s ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Expanded Filters */}
        <AnimatePresence>
          {filtersOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-slate-100"
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* City */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">City</p>
                  <div className="flex flex-wrap gap-1.5">
                    {CITIES.map((c) => (
                      <button
                        key={c}
                        onClick={() => { setCity(c); setSearchInput(c) }}
                        className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                          city === c ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amenities */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Amenities</p>
                  <div className="flex flex-wrap gap-1.5">
                    {AMENITIES.map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => toggleAmenity(key)}
                        className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                          selectedAmenities.includes(key) ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    Price Range: ₹{priceRange[0]} – ₹{priceRange[1]}
                  </p>
                  <input
                    type="range"
                    min={0}
                    max={5000}
                    step={100}
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                    className="w-full accent-brand-600"
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>₹0</span>
                    <span>₹5000</span>
                  </div>
                </div>
              </div>
              {hasFilters && (
                <div className="max-w-7xl mx-auto px-4 pb-4">
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 transition-colors"
                  >
                    <CloseIcon fontSize="small" /> Clear all filters
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results count */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {city ? `Turfs in ${city}` : lat ? 'Turfs Near You' : 'All Turfs'}
            </h1>
            {!isLoading && (
              <p className="text-sm text-slate-500 mt-0.5">
                {turfs.length} turf{turfs.length !== 1 ? 's' : ''} found
              </p>
            )}
          </div>
        </div>

        <TurfGrid turfs={turfs} isLoading={isLoading} />

        {/* Load More */}
        {!isLoading && turfs.length > 0 && data?.pagination && data.pagination.page < data.pagination.totalPages && (
          <div className="text-center mt-10">
            <Button variant="outline" size="lg">
              Load More
            </Button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}

export default function TurfsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="h-8 w-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>}>
      <TurfsContent />
    </Suspense>
  )
}
