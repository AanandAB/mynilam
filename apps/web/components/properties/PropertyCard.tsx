import React, { useState } from 'react'
import Link from 'next/link'
import { Card } from '../ui/card'
import type { Property } from '@repo/shared'
import { MapPin, Bed, Bath, Maximize, Heart } from 'lucide-react'

interface PropertyCardProps {
  property: Property
  viewType?: 'grid' | 'list'
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property, viewType = 'grid' }) => {
  const [isBookmarked, setIsBookmarked] = useState(false)

  // Color mapping for property listing type
  const typeColors: Record<Property['listing_type'], string> = {
    sale: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    rent: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    roommate: 'bg-amber-50 text-amber-700 border-amber-100',
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
    <Card hoverEffect padding="none" className={`overflow-hidden group relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 hover:shadow-lg dark:hover:border-slate-700 transition-all duration-300 ${viewType === 'list' ? 'sm:h-52' : ''}`}>
      
      {/* Bookmark Button */}
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setIsBookmarked(!isBookmarked)
        }}
        className="absolute right-4 top-4 z-10 p-2.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-100 dark:border-slate-800 rounded-full text-slate-500 dark:text-slate-400 hover:text-red-500 hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm"
      >
        <Heart className={`h-5 w-5 ${isBookmarked ? 'fill-red-500 text-red-500' : ''}`} />
      </button>

      <Link href={`/properties/${property.id}`} className={`flex ${viewType === 'list' ? 'flex-col sm:flex-row h-full' : 'flex-col'}`}>
        
        {/* Image Display */}
        <div className={`relative overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0 ${viewType === 'list' ? 'h-48 sm:h-full sm:w-1/3' : 'h-52 w-full'}`}>
          {property.images && property.images.length > 0 ? (
            <img
              src={property.images[0]}
              alt={property.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50 dark:bg-gray-800">
              <span>No image available</span>
            </div>
          )}
          
          {/* Gradient Overlay for image */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 via-gray-900/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300 z-0 pointer-events-none"></div>

          {/* Badge overlays */}
          <div className="absolute left-4 bottom-4 flex gap-2 z-10">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${typeColors[property.listing_type]}`}>
              For {property.listing_type}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-white/90 dark:bg-gray-900/90 backdrop-blur-md text-gray-800 dark:text-gray-200 border border-white/20 dark:border-gray-700 shadow-sm">
              {property.property_type}
            </span>
          </div>
        </div>

        {/* Text Info */}
        <div className={`p-5 flex flex-col justify-between ${viewType === 'list' ? 'w-full sm:w-2/3' : 'space-y-4'}`}>
          <div className="space-y-1">
            <h3 className="text-lg font-extrabold text-gray-900 dark:text-white leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
              {property.title}
            </h3>
            <div className="flex items-center space-x-1.5 text-xs text-gray-500 pb-2">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
              <span className="truncate">{property.address}, {property.city}</span>
            </div>
          </div>

          {viewType === 'list' && (
            <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
              {property.description}
            </div>
          )}

          <div className="mt-auto">
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-3 pb-2">
              <span className="text-xl font-black text-slate-900 dark:text-white">
                {formatPrice(property.price, property.listing_type)}
              </span>
            </div>

            {/* Details specs */}
            <div className={`grid grid-cols-3 gap-2 text-xs font-semibold text-gray-600 dark:text-gray-400 border-t border-gray-100/50 dark:border-gray-800/50 pt-3`}>
              <div className="flex items-center space-x-1">
                <Bed className="h-4 w-4 text-gray-400" />
                <span>{property.bedrooms || 0} Beds</span>
              </div>
              <div className="flex items-center space-x-1">
                <Bath className="h-4 w-4 text-gray-400" />
                <span>{property.bathrooms || 0} Baths</span>
              </div>
              <div className="flex items-center space-x-1">
                <Maximize className="h-4 w-4 text-gray-400" />
                <span>{property.area_sqft || 0} sqft</span>
              </div>
            </div>
          </div>
        </div>

      </Link>
    </Card>
  )
}
