'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import GpsFixedIcon from '@mui/icons-material/GpsFixed'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer'
import CloseIcon from '@mui/icons-material/Close'

const CITIES = [
  { name: 'Chennai', state: 'TN' },
  { name: 'Coimbatore', state: 'TN' },
  { name: 'Madurai', state: 'TN' },
  { name: 'Tiruchirappalli', state: 'TN' },
  { name: 'Salem', state: 'TN' },
  { name: 'Tirunelveli', state: 'TN' },
  { name: 'Vellore', state: 'TN' },
  { name: 'Erode', state: 'TN' },
  { name: 'Thanjavur', state: 'TN' },
  { name: 'Tiruppur', state: 'TN' },
  { name: 'Tiruvannamalai', state: 'TN' },
  { name: 'Karur', state: 'TN' },
  { name: 'Namakkal', state: 'TN' },
  { name: 'Dindigul', state: 'TN' },
  { name: 'Kanchipuram', state: 'TN' },
  { name: 'Cuddalore', state: 'TN' },
  { name: 'Nagercoil', state: 'TN' },
  { name: 'Thoothukudi', state: 'TN' },
  { name: 'Sivakasi', state: 'TN' },
  { name: 'Ramanathapuram', state: 'TN' },
]

// Approximate lat/lng for each city to find nearest
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  Chennai: { lat: 13.0827, lng: 80.2707 },
  Coimbatore: { lat: 11.0168, lng: 76.9558 },
  Madurai: { lat: 9.9252, lng: 78.1198 },
  Tiruchirappalli: { lat: 10.7905, lng: 78.7047 },
  Salem: { lat: 11.6643, lng: 78.146 },
  Tirunelveli: { lat: 8.7139, lng: 77.7567 },
  Vellore: { lat: 12.9165, lng: 79.1325 },
  Erode: { lat: 11.341, lng: 77.7172 },
  Thanjavur: { lat: 10.787, lng: 79.1378 },
  Tiruppur: { lat: 11.1085, lng: 77.3411 },
  Tiruvannamalai: { lat: 12.2253, lng: 79.0747 },
  Karur: { lat: 10.9601, lng: 78.0766 },
  Namakkal: { lat: 11.2189, lng: 78.1676 },
  Dindigul: { lat: 10.3624, lng: 77.9695 },
  Kanchipuram: { lat: 12.8185, lng: 79.6947 },
  Cuddalore: { lat: 11.7447, lng: 79.7689 },
  Nagercoil: { lat: 8.1833, lng: 77.4119 },
  Thoothukudi: { lat: 8.7642, lng: 78.1348 },
  Sivakasi: { lat: 9.4526, lng: 77.7964 },
  Ramanathapuram: { lat: 9.3762, lng: 78.8309 },
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function findNearestCity(lat: number, lng: number): string {
  let nearest = CITIES[0].name
  let minDist = Infinity
  for (const city of CITIES) {
    const coords = CITY_COORDS[city.name]
    if (!coords) continue
    const dist = haversineDistance(lat, lng, coords.lat, coords.lng)
    if (dist < minDist) {
      minDist = dist
      nearest = city.name
    }
  }
  return nearest
}

interface CityModalProps {
  onClose: (city: string) => void
}

export function CityModal({ onClose }: CityModalProps) {
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoError, setGeoError] = useState('')

  const handleCitySelect = (city: string) => {
    localStorage.setItem('turffy_city', city)
    onClose(city)
  }

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.')
      return
    }
    setGeoLoading(true)
    setGeoError('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const city = findNearestCity(pos.coords.latitude, pos.coords.longitude)
        setGeoLoading(false)
        handleCitySelect(city)
      },
      () => {
        setGeoLoading(false)
        setGeoError('Could not detect your location. Please select manually.')
      },
      { timeout: 8000 }
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Modal Card */}
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-brand-600 rounded-xl flex items-center justify-center">
              <SportsSoccerIcon className="text-white" fontSize="small" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Select Your City</h2>
              <p className="text-xs text-slate-500">Find turfs near you</p>
            </div>
          </div>
        </div>

        {/* Detect Location */}
        <div className="px-6 py-4 border-b border-slate-100">
          <button
            onClick={handleDetectLocation}
            disabled={geoLoading}
            className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border-2 border-dashed border-brand-300 bg-brand-50 text-brand-700 font-medium text-sm hover:bg-brand-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {geoLoading ? (
              <div className="h-4 w-4 border-2 border-brand-400 border-t-brand-700 rounded-full animate-spin" />
            ) : (
              <GpsFixedIcon fontSize="small" />
            )}
            {geoLoading ? 'Detecting your location...' : 'Detect my location'}
          </button>
          {geoError && (
            <p className="mt-2 text-xs text-red-500 text-center">{geoError}</p>
          )}
        </div>

        {/* City Grid */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
            Popular Cities
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {CITIES.map((city) => (
              <button
                key={city.name}
                onClick={() => handleCitySelect(city.name)}
                className="group flex flex-col items-center gap-1.5 p-3 rounded-xl border border-slate-200 hover:border-brand-400 hover:bg-brand-50 transition-all duration-150 hover:scale-105"
              >
                <div className="h-8 w-8 rounded-full bg-slate-100 group-hover:bg-brand-100 flex items-center justify-center transition-colors">
                  <LocationOnIcon className="text-slate-500 group-hover:text-brand-600" style={{ fontSize: 18 }} />
                </div>
                <span className="text-xs font-semibold text-slate-700 group-hover:text-brand-700 text-center leading-tight">
                  {city.name}
                </span>
                <span className="text-[10px] bg-slate-100 group-hover:bg-brand-100 text-slate-500 group-hover:text-brand-600 px-1.5 py-0.5 rounded-full font-medium">
                  {city.state}
                </span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
