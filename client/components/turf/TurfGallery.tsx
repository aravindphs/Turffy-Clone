'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import CloseIcon from '@mui/icons-material/Close'
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary'

interface TurfGalleryProps {
  images: string[]
  turfName: string
}

export function TurfGallery({ images, turfName }: TurfGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const safeImages = images.length > 0 ? images : []
  if (safeImages.length === 0) {
    return (
      <div className="h-72 bg-slate-200 rounded-2xl flex items-center justify-center">
        <p className="text-slate-400">No images available</p>
      </div>
    )
  }

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  const prevImage = () =>
    setCurrentIndex((i) => (i === 0 ? safeImages.length - 1 : i - 1))
  const nextImage = () =>
    setCurrentIndex((i) => (i === safeImages.length - 1 ? 0 : i + 1))

  const prevLightbox = () =>
    setLightboxIndex((i) => (i === 0 ? safeImages.length - 1 : i - 1))
  const nextLightbox = () =>
    setLightboxIndex((i) => (i === safeImages.length - 1 ? 0 : i + 1))

  return (
    <>
      {/* Main Gallery */}
      <div className="grid grid-cols-4 grid-rows-2 gap-2 h-72 md:h-96 rounded-2xl overflow-hidden">
        {/* Main large image */}
        <div
          className="col-span-2 row-span-2 relative cursor-pointer group"
          onClick={() => openLightbox(0)}
        >
          <Image
            src={safeImages[0]}
            alt={`${turfName} - Photo 1`}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        </div>

        {/* Side images */}
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="relative cursor-pointer group overflow-hidden"
            onClick={() => openLightbox(i)}
          >
            {safeImages[i] ? (
              <>
                <Image
                  src={safeImages[i]}
                  alt={`${turfName} - Photo ${i + 1}`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                {i === 4 && safeImages.length > 5 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <div className="text-white text-center">
                      <PhotoLibraryIcon />
                      <p className="text-sm font-semibold">+{safeImages.length - 5}</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="h-full bg-slate-200" />
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
          >
            <button
              className="absolute top-4 right-4 text-white/70 hover:text-white z-10"
              onClick={() => setLightboxOpen(false)}
            >
              <CloseIcon fontSize="large" />
            </button>

            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white z-10 bg-black/30 rounded-full p-2"
              onClick={(e) => { e.stopPropagation(); prevLightbox() }}
            >
              <ChevronLeftIcon fontSize="large" />
            </button>

            <motion.div
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative w-full max-w-5xl h-[80vh] px-16"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={safeImages[lightboxIndex]}
                alt={`${turfName} - Photo ${lightboxIndex + 1}`}
                fill
                className="object-contain"
                sizes="90vw"
              />
            </motion.div>

            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white z-10 bg-black/30 rounded-full p-2"
              onClick={(e) => { e.stopPropagation(); nextLightbox() }}
            >
              <ChevronRightIcon fontSize="large" />
            </button>

            <div className="absolute bottom-4 text-white/70 text-sm">
              {lightboxIndex + 1} / {safeImages.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
