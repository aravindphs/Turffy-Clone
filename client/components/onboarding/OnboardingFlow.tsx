'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { CityModal } from './CityModal'
import { SportPreferences } from './SportPreferences'

export function OnboardingFlow() {
  const [step, setStep] = useState<'idle' | 'city' | 'sports' | 'done'>('idle')

  useEffect(() => {
    const timer = setTimeout(() => {
      const savedCity = localStorage.getItem('turffy_city')
      if (!savedCity) {
        setStep('city')
      } else {
        // City already saved — check sports
        const savedSports = localStorage.getItem('turffy_sports')
        if (!savedSports) {
          setStep('sports')
        } else {
          setStep('done')
        }
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  const handleCitySelected = (_city: string) => {
    // After city, check if sports preference has been set
    const savedSports = localStorage.getItem('turffy_sports')
    if (!savedSports) {
      setStep('sports')
    } else {
      setStep('done')
    }
  }

  const handleSportsDone = () => {
    setStep('done')
  }

  if (step === 'idle' || step === 'done') return null

  return (
    <AnimatePresence>
      {step === 'city' && (
        <CityModal key="city" onClose={handleCitySelected} />
      )}
      {step === 'sports' && (
        <SportPreferences key="sports" onComplete={handleSportsDone} />
      )}
    </AnimatePresence>
  )
}
