import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card } from '../ui/card'
import type { Property } from '@repo/shared'
import { MapPin, Bed, Bath, Maximize, Heart, Building2, CheckCircle2 } from 'lucide-react'

interface PropertyCardProps {
  property: Property
  viewType?: 'grid' | 'list'
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property, viewType = 'grid' }) => {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [imgError, setImgError] = useState(false)

  // WCAG compliant color mapping for property listing type
  const typeColors: Record<Property['listing_type'], string> = {
    sale: 'bg-emerald-100 text-emerald-900 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900/50',
    rent: 'bg-indigo-100 text-indigo-900 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-900/50',
    roommate: 'bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900/50',
  }

  // Format price
  const formatPrice = (price: number, listingType: string) => {
    const formatted = price.toLocaleString('en-IN', {
      maximumFractionDigits: 0,
      style: 'currency',
      currency: 'INR',
    })
    return (listingType === 'rent' || listingType === 'roommate') ? `${formatted}/mo` : formatted
  }

  return (
    <Card hoverEffect padding="none" className={`overflow-hidden group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 hover:shadow-xl dark:hover:border-slate-700 transition-all duration-300 ${viewType === 'list' ? 'sm:h-56' : ''}`}>
      
      {/* Bookmark Button */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setIsBookmarked(!isBookmarked)
        }}
        aria-label={isBookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}
        className="absolute right-4 top-4 z-10 p-2.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-full text-slate-600 dark:text-slate-300 hover:text-red-500 hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm"
      >
        <Heart className={`h-4.5 w-4.5 ${isBookmarked ? 'fill-red-500 text-red-500' : ''}`} />
      </button>

      <Link href={`/properties/${property.id}`} className={`flex ${viewType === 'list' ? 'flex-col sm:flex-row h-full' : 'flex-col'}`}>
        
        {/* Image Display */}
        <div className={`relative overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 ${viewType === 'list' ? 'h-48 sm:h-full sm:w-1/3' : 'h-52 w-full'}`}>
          {property.images && property.images.length > 0 && !imgError ? (
            <Image
              src={property.images[0]}
              alt={property.title || 'Property listing'}
              fill
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100 dark:bg-slate-850 p-4 space-y-2">
              <Building2 className="w-8 h-8 text-slate-400 dark:text-slate-600" />
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Verified Photo Placeholder</span>
            </div>
          )}
          
          {/* Gradient Overlay for image */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300 z-0 pointer-events-none"></div>

          {/* Badge overlays */}
          <div className="absolute left-4 bottom-4 flex flex-wrap gap-1.5 z-10">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${typeColors[property.listing_type]}`}>
              For {property.listing_type}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-slate-900 dark:text-white border border-white/20 dark:border-slate-700 shadow-2xs">
              {property.property_type}
            </span>
          </div>
        </div>

        {/* Text Info */}
        <div className={`p-5 flex flex-col justify-between ${viewType === 'list' ? 'w-full sm:w-2/3' : 'space-y-4'}`}>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                {property.title}
              </h3>
            </div>

            <div className="flex items-center space-x-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 pb-1">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-indigo-500" />
              <span className="truncate">{property.address ? `${property.address}, ` : ''}{property.city}</span>
            </div>
          </div>

          {viewType === 'list' && (
            <div className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-2 leading-relaxed">
              {property.description}
            </div>
          )}

          <div className="mt-auto space-y-3">
            {['hostel', 'pg'].includes(property.property_type) && property.available_sharing_types && property.available_sharing_types.length > 0 && (
              <div className="flex flex-wrap items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/40 p-2 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-1">Sharing:</span>
                {property.available_sharing_types.map((stype, idx) => (
                  <span key={idx} className="bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-[10px] font-bold">
                    {stype}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-3">
              <div>
                {['hostel', 'pg'].includes(property.property_type) && (
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Starting from</span>
                )}
                <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  {formatPrice(property.starting_price || property.price, property.listing_type)}
                </span>
              </div>

              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-900/40">
                <CheckCircle2 className="w-3 h-3" />
                <span>Available</span>
              </span>
            </div>

            {/* Details specs */}
            <div className="grid grid-cols-3 gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800/60 pt-2.5">
              <div className="flex items-center space-x-1">
                <Bed className="h-3.5 w-3.5 text-indigo-500" />
                <span>{(['hostel', 'pg'].includes(property.property_type) ? property.num_beds : property.bedrooms) || 0} Beds</span>
              </div>
              <div className="flex items-center space-x-1">
                <Bath className="h-3.5 w-3.5 text-indigo-500" />
                <span>{property.bathrooms || 0} Baths</span>
              </div>
              <div className="flex items-center space-x-1">
                <Maximize className="h-3.5 w-3.5 text-indigo-500" />
                <span>{property.area_sqft || 0} sqft</span>
              </div>
            </div>
          </div>
        </div>

      </Link>
    </Card>
  )
}
