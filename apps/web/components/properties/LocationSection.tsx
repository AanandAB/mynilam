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
    <div className="w-full h-[320px] animate-pulse rounded-2xl flex items-center justify-center" style={{ background: 'var(--surface-2)' }}>
      <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Loading interactive map...</p>
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
    <Card className="p-6 space-y-6 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border-color)' }}>
      <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <h3 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
          <MapPin className="w-4 h-4" style={{ color: 'var(--primary)' }} />
          Location & Surroundings
        </h3>

        {isUnlocked ? (
          <span className="px-3 py-1 text-xs font-bold rounded-full flex items-center gap-1.5" style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid rgba(13,148,136,0.2)' }}>
            <ShieldCheck className="w-3.5 h-3.5" /> Exact Location Unlocked
          </span>
        ) : (
          <span className="px-3 py-1 text-xs font-bold rounded-full flex items-center gap-1.5" style={{ background: 'rgba(245,158,11,0.1)', color: '#d97706', border: '1px solid rgba(245,158,11,0.2)' }}>
            <Lock className="w-3.5 h-3.5" /> General Area View
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Address Cards */}
        <div className="space-y-3">
          <div className="p-4 rounded-2xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-color)' }}>
            <h4 className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
              General Location (City, State)
            </h4>
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{generalLocationStr || `${city}, ${state}`}</p>
          </div>

          <div className="p-4 rounded-2xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-color)' }}>
            <h4 className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
              Street / Area Address
            </h4>
            <p className="text-xs font-medium leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{addressLine1}</p>
          </div>

          {landmark && (
            <div className="p-4 rounded-2xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-color)' }}>
              <h4 className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                Landmark
              </h4>
              <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{landmark}</p>
            </div>
          )}
        </div>

        {/* Map Container or Privacy Banner */}
        <div className="relative rounded-2xl overflow-hidden h-[280px] md:h-auto flex flex-col items-center justify-center" style={{ border: '1px solid var(--border-color)', background: 'var(--surface-2)' }}>
          {isUnlocked ? (
            <>
              {isLoading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--primary)' }}></div>
                </div>
              ) : error ? (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-2">
                  <p className="text-xs font-semibold" style={{ color: '#f43f5e' }}>{error}</p>
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

                  <div className="absolute bottom-3 left-0 right-0 flex justify-center z-10">
                    <a
                      href={exactLocation.url || `https://www.google.com/maps/search/?api=1&query=${exactLocation.lat},${exactLocation.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg transition-transform hover:scale-105 flex items-center gap-2"
                      style={{ background: 'var(--primary)', border: '1px solid var(--primary-dark)' }}
                    >
                      {exactLocation.url ? (
                        <>
                          <Navigation className="w-4 h-4" />
                          Open in Google Maps
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </>
                      ) : (
                        <>
                          <Compass className="w-4 h-4" />
                          Get Directions
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </>
                      )}
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                  Exact location coordinates unavailable.
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <Lock className="w-5 h-5" style={{ color: '#d97706' }} />
              </div>
              <div className="space-y-1 max-w-xs">
                <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                  Location Privacy Protection
                </h4>
                <p className="text-xs leading-relaxed font-medium" style={{ color: 'var(--text-muted)' }}>
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
