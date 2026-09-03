'use client'

import { useState, useEffect } from 'react'

interface GeolocationState {
  latitude: number | null
  longitude: number | null
  loading: boolean
  error: string | null
  permissionDenied: boolean
}

export function useGeolocation(): GeolocationState {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    loading: true,
    error: null,
    permissionDenied: false,
  })

  useEffect(() => {
    if (!navigator.geolocation) {
      setState((s) => ({
        ...s,
        loading: false,
        error: 'Geolocation is not supported by your browser',
      }))
      return
    }

    // Check if we already have a cached position in sessionStorage
    const cached = sessionStorage.getItem('user_location')
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        const age = Date.now() - parsed.timestamp
        // Use cached position if less than 5 minutes old
        if (age < 5 * 60 * 1000) {
          setState({
            latitude: parsed.latitude,
            longitude: parsed.longitude,
            loading: false,
            error: null,
            permissionDenied: false,
          })
          return
        }
      } catch {
        // ignore invalid cache
      }
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        // Cache for 5 minutes
        sessionStorage.setItem(
          'user_location',
          JSON.stringify({ latitude, longitude, timestamp: Date.now() })
        )
        setState({
          latitude,
          longitude,
          loading: false,
          error: null,
          permissionDenied: false,
        })
      },
      (error) => {
        setState((s) => ({
          ...s,
          loading: false,
          permissionDenied: error.code === error.PERMISSION_DENIED,
          error:
            error.code === error.PERMISSION_DENIED
              ? 'Location access denied'
              : error.code === error.TIMEOUT
                ? 'Location request timed out'
                : 'Unable to get your location',
        }))
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 5 * 60 * 1000,
      }
    )
  }, [])

  return state
}
