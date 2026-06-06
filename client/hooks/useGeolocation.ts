'use client'

import { useState, useCallback } from 'react'

interface GeolocationState {
  lat: number | null
  lng: number | null
  error: string | null
  isLoading: boolean
}

interface UseGeolocationReturn extends GeolocationState {
  getLocation: () => void
  clearLocation: () => void
}

export function useGeolocation(): UseGeolocationReturn {
  const [state, setState] = useState<GeolocationState>({
    lat: null,
    lng: null,
    error: null,
    isLoading: false,
  })

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: 'Geolocation is not supported by your browser.',
      }))
      return
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          error: null,
          isLoading: false,
        })
      },
      (err) => {
        let message = 'Unable to retrieve your location.'
        if (err.code === err.PERMISSION_DENIED) message = 'Location permission denied.'
        else if (err.code === err.POSITION_UNAVAILABLE) message = 'Location unavailable.'
        else if (err.code === err.TIMEOUT) message = 'Location request timed out.'

        setState((prev) => ({
          ...prev,
          error: message,
          isLoading: false,
        }))
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes cache
      }
    )
  }, [])

  const clearLocation = useCallback(() => {
    setState({ lat: null, lng: null, error: null, isLoading: false })
  }, [])

  return { ...state, getLocation, clearLocation }
}
