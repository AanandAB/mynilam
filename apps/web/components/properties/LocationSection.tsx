'use client'

import React, { useEffect, useState } from 'react'
import { propertiesApi } from '@repo/shared/src/api/properties'
import dynamic from 'next/dynamic'
import { MapPin, Navigation, Lock, ExternalLink, ShieldCheck, Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const PropertyMap = dynamic(() => import('./PropertyMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[320px] animate-pulse bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center text-slate-400">
      Loading interactive map...
    </div>
  ),
})

interface LocationSectionProps {
  propertyId: string
  initialLocationUnlocked: boolean
  latitude?: number | null
  longitude?: number | null
  addressLine1: string
  city: string
  state: string
  area?: string
  landmark?: string | null
}

export const LocationSection: React.FC<LocationSectionProps> = ({
  propertyId,
  initialLocationUnlocked,
  latitude: initialLat,
  longitude: initialLng,
  addressLine1,
  city,
  state,
  area,
  landmark,
}) => {
  const [isUnlocked] = useState(initialLocationUnlocked)
  const [exactLocation, setExactLocation] = useState<{ lat: number; lng: number; url?: string } | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // If unlocked but don't have lat/lng yet, fetch exact location from authorized API endpoint
    if (isUnlocked && !exactLocation) {
      fetchExactLocation()
    }
  }, [isUnlocked])

  const fetchExactLocation = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await propertiesApi.getPropertyLocation(propertyId)
      if (data.latitude && data.longitude) {
        setExactLocation({
          lat: data.latitude,
          lng: data.longitude,
          url: data.google_maps_url || undefined,
        })
      }
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Could not load exact location')
    } finally {
      setIsLoading(false)
    }
  }

  const parts = [area, city, state].filter(Boolean)
  const generalLocationStr = parts.join(', ')

  return (
    <Card className="p-6 space-y-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-indigo-500" />
          Location & Surroundings
        </h3>

        {isUnlocked ? (
          <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-full border border-emerald-200/60 dark:border-emerald-900/50 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> Exact Location Unlocked
          </span>
        ) : (
          <span className="px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-xs font-bold rounded-full border border-amber-200/60 dark:border-amber-900/50 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" /> General Area View
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Address Cards */}
        <div className="space-y-3.5">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
            <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
              General Location (City, State)
            </h4>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{generalLocationStr || `${city}, ${state}`}</p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
            <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
              Street / Area Address
            </h4>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{addressLine1}</p>
          </div>

          {landmark && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
              <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                Landmark
              </h4>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">{landmark}</p>
            </div>
          )}
        </div>

        {/* Map Container or Privacy Banner */}
        <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 h-[280px] md:h-auto bg-slate-100 dark:bg-slate-900/90 flex flex-col items-center justify-center">
          {isUnlocked ? (
            <>
              {isLoading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : error ? (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-red-500 space-y-2">
                  <p className="text-xs font-semibold">{error}</p>
                  <Button variant="outline" size="sm" onClick={fetchExactLocation}>
                    Retry Map Load
                  </Button>
                </div>
              ) : exactLocation ? (
                <div className="w-full h-full relative group">
                  <div className="absolute inset-0">
                    <PropertyMap
                      properties={[
                        {
                          id: propertyId,
                          latitude: exactLocation.lat,
                          longitude: exactLocation.lng,
                          title: 'Hostel Location',
                          property_type: 'hostel',
                          listing_type: 'rent',
                          price: 0,
                          city: city,
                          state: state,
                          address: addressLine1,
                          images: [],
                          status: 'published',
                          is_published: true,
                          user_id: '0',
                          created_at: new Date().toISOString(),
                          updated_at: new Date().toISOString(),
                          description: null,
                          bedrooms: null,
                          bathrooms: null,
                          area_sqft: null,
                          zip_code: null,
                        },
                      ]}
                    />
                  </div>

                  {/* Navigation Overlay Button */}
                  {exactLocation.url ? (
                    <div className="absolute bottom-3 left-0 right-0 flex justify-center z-10">
                      <a
                        href={exactLocation.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-slate-900/90 hover:bg-slate-900 backdrop-blur-md text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg transition-transform hover:scale-105 flex items-center gap-2 border border-slate-700"
                      >
                        <Navigation className="w-4 h-4 text-indigo-400" />
                        Open in Google Maps
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </a>
                    </div>
                  ) : (
                    <div className="absolute bottom-3 left-0 right-0 flex justify-center z-10">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${exactLocation.lat},${exactLocation.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-slate-900/90 hover:bg-slate-900 backdrop-blur-md text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg transition-transform hover:scale-105 flex items-center gap-2 border border-slate-700"
                      >
                        <Compass className="w-4 h-4 text-indigo-400" />
                        Get Directions
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-400 text-xs font-medium">
                  Exact location coordinates unavailable.
                </div>
              )}
            </>
          ) : (
            /* Privacy State Banner */
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-3 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
              <div className="w-12 h-12 rounded-full bg-slate-200/70 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 shadow-2xs">
                <Lock className="w-6 h-6 text-amber-500" />
              </div>
              <div className="space-y-1 max-w-xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Location Privacy Protection
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  Exact location will be available after your inquiry is accepted.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
