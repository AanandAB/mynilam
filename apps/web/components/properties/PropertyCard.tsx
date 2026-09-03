'use client'

import React, { useState, useCallback } from 'react'
import Link from 'next/link'
import type { Property } from '@repo/shared'
import { MapPin, Bed, Bath, Maximize, Heart, ChevronLeft, ChevronRight, Navigation, Star, Eye } from 'lucide-react'
import { getDistanceKm, formatDistance } from '@/utils/distance'

interface PropertyCardProps {
  property: Property
  viewType?: 'grid' | 'list'
  userLocation?: { latitude: number; longitude: number } | null
}

const AMENITY_ICONS: Record<string, string> = {
  wifi: '📶', ac: '❄️', food: '🍽️', laundry: '🧺', parking: '🅿️', gym: '💪', power_backup: '⚡', hot_water: '🚿',
}

function getListingTypeBadge(listingType?: string) {
  switch (listingType) {
    case 'rent': return { label: 'For Rent', bg: 'bg-brand-light text-brand' }
    case 'sale': return { label: 'For Sale', bg: 'bg-amber-50 text-amber-700' }
    case 'roommate': return { label: 'Flat Share', bg: 'bg-purple-50 text-purple-700' }
    default: return { label: 'Listed', bg: 'bg-navy-100 text-navy-600' }
  }
}

function formatPrice(property: Property) {
  if (property.listing_type === 'sale' && property.price) {
    return `₹${(property.price / 100000).toFixed(1)}L`
  }
  if (property.price) return `₹${property.price.toLocaleString('en-IN')}`
  return 'Price on request'
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property, viewType = 'grid', userLocation }) => {
  const distance = userLocation?.latitude != null && userLocation?.longitude != null && property.latitude != null && property.longitude != null
    ? getDistanceKm(userLocation.latitude, userLocation.longitude, property.latitude, property.longitude)
    : null

  const images = property.images || (property.cover_image ? [property.cover_image] : [])
  const [currentImage, setCurrentImage] = useState(0)
  const [liked, setLiked] = useState(false)

  const prevImage = useCallback(() => setCurrentImage((c) => (c === 0 ? images.length - 1 : c - 1)), [images.length])
  const nextImage = useCallback(() => setCurrentImage((c) => (c === images.length - 1 ? 0 : c + 1)), [images.length])

  const typeBadge = getListingTypeBadge(property.listing_type)
  const price = formatPrice(property)
  const period = property.listing_type === 'rent' ? '/month' : property.listing_type === 'sale' ? '' : '/month'

  // Extract amenities
  const amenities: string[] = []
  if (property.wifi_available) amenities.push('Wi-Fi')
  if (property.ac_available) amenities.push('AC')
  if (property.food_included) amenities.push('Meals')
  if (property.laundry_available) amenities.push('Laundry')
  if (property.parking) amenities.push(property.parking)

  if (viewType === 'list') {
    return (
      <Link href={`/properties/${property.id}`} className="block">
        <div className="bg-white dark:bg-[#111b2e] rounded-xl border border-border dark:border-white/10 overflow-hidden hover:shadow-card-hover transition-all duration-300 flex">
          {/* Image */}
          <div className="relative w-[240px] h-[180px] shrink-0 overflow-hidden">
            {images.length > 0 ? (
              <img src={images[currentImage]} alt={property.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-surface-soft flex items-center justify-center text-navy-300">
                <MapPin className="w-8 h-8" />
              </div>
            )}
            <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-md text-[11px] font-bold ${typeBadge.bg}`}>
              {typeBadge.label}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
            <div>
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="text-[15px] font-bold text-navy dark:text-white truncate">{property.title}</h3>
                <div className="flex items-center gap-1 shrink-0">
                  <Star className="w-3.5 h-3.5 text-gold fill-gold" />
                  <span className="text-[12px] font-bold text-navy dark:text-white">4.8</span>
                </div>
              </div>
              <p className="text-[12px] text-navy-400 dark:text-slate-400 flex items-center gap-1 mb-2">
                <MapPin className="w-3 h-3 shrink-0" />
                {property.address || 'Location available on request'}{property.city ? `, ${property.city}` : ''}
              </p>
              {amenities.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {amenities.slice(0, 4).map((a) => (
                    <span key={a} className="px-2 py-0.5 text-[11px] font-medium text-navy-500 dark:text-slate-300 bg-surface-soft dark:bg-white/5 border border-border-light dark:border-white/10 rounded-md">{a}</span>
                  ))}
                  {amenities.length > 4 && (
                    <span className="px-2 py-0.5 text-[11px] font-medium text-navy-400 dark:text-slate-400 bg-surface-soft dark:bg-white/5 rounded-md">+{amenities.length - 4}</span>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-border-light mt-2">
              <div>
                <span className="text-lg font-bold text-navy dark:text-white">{price}</span>
                {period && <span className="text-[12px] text-navy-400 ml-1">{period}</span>}
              </div>
              <div className="flex items-center gap-2 text-[12px] text-navy-400 dark:text-slate-400">
                {property.bedrooms != null && <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5" />{property.bedrooms} Beds</span>}
                {property.bathrooms != null && <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" />{property.bathrooms} Bath</span>}
              </div>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  // Grid view (default)
  return (
    <Link href={`/properties/${property.id}`} className="block group">
      <div className="bg-white dark:bg-[#111b2e] rounded-xl border border-border dark:border-white/10 overflow-hidden card-hover">
        {/* Image */}
        <div className="relative aspect-[1.55/1] overflow-hidden">
          {images.length > 0 ? (
            <>
              <img src={images[currentImage]} alt={property.title} className="w-full h-full object-cover card-image" />
              
              {/* Carousel Controls */}
              {images.length > 1 && (
                <>
                  <button onClick={(e) => { e.preventDefault(); prevImage(); }} className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronLeft className="w-4 h-4 text-navy" />
                  </button>
                  <button onClick={(e) => { e.preventDefault(); nextImage(); }} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="w-4 h-4 text-navy" />
                  </button>
                  {/* Dots */}
                  <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1">
                    {images.slice(0, 5).map((_, i) => (
                      <span key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentImage ? 'bg-white w-3.5' : 'bg-white/50'}`} />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full bg-surface-soft flex items-center justify-center text-navy-300">
              <MapPin className="w-8 h-8" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-1.5">
            <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold backdrop-blur-sm ${typeBadge.bg}`}>
              {typeBadge.label}
            </span>
            {property.property_type && (
              <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-white/90 backdrop-blur-sm text-navy-700">
                {property.property_type.replace('_', ' ').toUpperCase()}
              </span>
            )}
          </div>

          {/* Distance Badge */}
          {distance != null && (
            <div className="absolute top-3 right-12">
              <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-white/90 backdrop-blur-sm text-navy-600 flex items-center gap-1">
                <Navigation className="w-3 h-3" />
                {formatDistance(distance)}
              </span>
            </div>
          )}

          {/* Favorite */}
          <button
            onClick={(e) => { e.preventDefault(); setLiked(!liked); }}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center transition-all"
          >
            <Heart className={`w-4 h-4 ${liked ? 'text-red-400 fill-red-400' : 'text-white'}`} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-[15px] font-bold text-navy dark:text-white leading-snug line-clamp-1 group-hover:text-brand transition-colors">{property.title}</h3>
            <div className="flex items-center gap-1 shrink-0">
              <Star className="w-3.5 h-3.5 text-gold fill-gold" />
              <span className="text-[12px] font-bold text-navy dark:text-white">4.8</span>
            </div>
          </div>

          <p className="text-[12px] text-navy-400 dark:text-slate-400 flex items-center gap-1 mb-3">
            <MapPin className="w-3 h-3 shrink-0" />
            {property.address || 'Location on request'}{property.city ? `, ${property.city}` : ''}
          </p>

          {/* Amenity Pills */}
          {amenities.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {amenities.slice(0, 4).map((a) => (
                <span key={a} className="px-2 py-0.5 text-[11px] font-medium text-navy-500 dark:text-slate-300 bg-surface-soft dark:bg-white/5 border border-border-light dark:border-white/10 rounded-md">{a}</span>
              ))}
              {amenities.length > 4 && (
                <span className="px-2 py-0.5 text-[11px] font-medium text-navy-400 dark:text-slate-400 bg-surface-soft dark:bg-white/5 rounded-md">+{amenities.length - 4}</span>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-3 text-[12px] text-navy-400 dark:text-slate-400 mb-3">
            {property.bedrooms != null && <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5" />{property.bedrooms} Beds</span>}
            {property.bathrooms != null && <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" />{property.bathrooms} Bath</span>}
            {property.area_sqft != null && <span className="flex items-center gap-1"><Maximize className="w-3.5 h-3.5" />{property.area_sqft} sqft</span>}
          </div>

          {/* Price + CTA */}
          <div className="flex items-center justify-between pt-3 border-t border-border-light">
            <div>
              <span className="text-lg font-bold text-navy dark:text-white">{price}</span>
              {period && <span className="text-[12px] text-navy-400 ml-1">{period}</span>}
            </div>
            <span className="text-[12px] font-semibold text-brand flex items-center gap-1 group-hover:gap-2 transition-all">
              View <Eye className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
