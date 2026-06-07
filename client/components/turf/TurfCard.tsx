'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import StarIcon from '@mui/icons-material/Star'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer'
import SportsIcon from '@mui/icons-material/Sports'
import { Turf } from '@/types'
import { Badge } from '@/components/ui/Badge'

const sportIcons: Record<string, string> = {
  football: '⚽',
  cricket: '🏏',
  basketball: '🏀',
  badminton: '🏸',
  tennis: '🎾',
  volleyball: '🏐',
}

interface TurfCardProps {
  turf: Turf
}

export function TurfCard({ turf }: TurfCardProps) {
  const minPrice = turf.courts.length > 0
    ? Math.min(...turf.courts.map((c) => c.basePricePerSlot))
    : 0

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Link href={`/turfs/${turf._id}`} className="block">
        <div className={[
          'bg-white rounded-2xl border shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden',
          turf.isFeatured ? 'border-amber-300 shadow-amber-100' : 'border-slate-200',
        ].join(' ')}>
          {/* Image */}
          <div className="relative h-48 bg-slate-200">
            {turf.images[0] ? (
              <Image
                src={turf.images[0]}
                alt={turf.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <SportsSoccerIcon className="text-slate-400 text-5xl" />
              </div>
            )}
            {/* Sponsored Badge */}
            {turf.isFeatured && (
              <div className="absolute top-3 left-3 z-10 bg-amber-400 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                ⭐ Sponsored
              </div>
            )}
            {/* Rating Overlay */}
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-xl px-2.5 py-1 flex items-center gap-1 shadow-sm">
              <StarIcon fontSize="small" className="text-amber-400" />
              <span className="text-sm font-semibold text-slate-900">
                {turf.averageRating > 0 ? turf.averageRating.toFixed(1) : 'New'}
              </span>
            </div>
            {/* Sport Tags */}
            <div className={[
              'absolute flex gap-1 flex-wrap max-w-[70%]',
              turf.isFeatured ? 'top-10 left-3' : 'top-3 left-3',
            ].join(' ')}>
              {turf.sports.slice(0, 2).map((sport) => (
                <span
                  key={sport}
                  className="bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full"
                >
                  {sportIcons[sport] || '🏆'} {sport.charAt(0).toUpperCase() + sport.slice(1)}
                </span>
              ))}
              {turf.sports.length > 2 && (
                <span className="bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full">
                  +{turf.sports.length - 2}
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <h3 className="font-semibold text-slate-900 text-base mb-1 truncate">{turf.name}</h3>

            <div className="flex items-center gap-1 text-slate-500 text-sm mb-3">
              <LocationOnIcon fontSize="small" className="text-brand-500 flex-shrink-0" />
              <span className="truncate">{turf.location.city}</span>
            </div>

            {/* Courts */}
            <div className="flex items-center gap-2 mb-3">
              <SportsIcon fontSize="small" className="text-slate-400" />
              <span className="text-xs text-slate-500">
                {turf.courts.length} {turf.courts.length === 1 ? 'Court' : 'Courts'}
              </span>
            </div>

            {/* Reviews */}
            {turf.totalReviews > 0 && (
              <div className="flex items-center gap-1 mb-3">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarIcon
                      key={star}
                      fontSize="small"
                      className={
                        star <= Math.round(turf.averageRating)
                          ? 'text-amber-400'
                          : 'text-slate-200'
                      }
                      style={{ fontSize: 14 }}
                    />
                  ))}
                </div>
                <span className="text-xs text-slate-500">({turf.totalReviews})</span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div>
                <p className="text-xs text-slate-400">Starting from</p>
                <p className="text-lg font-bold text-slate-900">
                  ₹{minPrice}
                  <span className="text-xs font-normal text-slate-500">/slot</span>
                </p>
              </div>
              <span className="text-xs font-medium text-brand-600 bg-brand-50 px-3 py-1.5 rounded-xl">
                Book Now
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
