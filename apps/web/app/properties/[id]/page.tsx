'use client'

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useProperty } from '@/app/hooks/use-properties'
import { useAuth } from '@/app/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { MapPin, Bed, Bath, Maximize, Heart, Phone, Mail, ArrowLeft, Sparkles, ShieldCheck } from 'lucide-react'

export default function PropertyDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const { user } = useAuth()

  const { data: property, isLoading, error } = useProperty(id)
  const [activeImageIdx, setActiveImageIdx] = useState(0)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [showContact, setShowContact] = useState(false)

  React.useEffect(() => {
    if (user && user.role === 'hostel_admin') {
      router.push('/dashboard')
    }
  }, [user, router])

  if (user && user.role === 'hostel_admin') return null

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50 dark:bg-gray-900/50">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">Fetching property details...</p>
        </div>
      </div>
    )
  }

  if (error || !property) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50 dark:bg-gray-900/50">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-3xl p-8 text-center text-red-600 dark:text-red-400 max-w-md mx-auto space-y-4 shadow-sm">
          <p className="font-bold text-lg">Property Not Found</p>
          <p className="text-sm text-red-500 dark:text-red-400">{error?.message || 'The property you are looking for does not exist.'}</p>
          <Button onClick={() => router.push('/')} className="font-semibold w-full">
            Back to Catalog
          </Button>
        </div>
      </div>
    )
  }

  const formatPrice = (price: number, listingType: string) => {
    const formatted = price.toLocaleString('en-IN', {
      maximumFractionDigits: 0,
      style: 'currency',
      currency: 'INR',
    })
    return (listingType === 'rent' || listingType === 'roommate') ? `${formatted}/mo` : formatted
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Back Button */}
      <div>
        <button
          onClick={() => router.push('/')}
          className="inline-flex items-center space-x-2 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to catalog</span>
        </button>
      </div>

      {/* Main Grid: Images & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Images & Info (Col-Span 2) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative rounded-3xl overflow-hidden aspect-video border border-gray-100 dark:border-gray-800 shadow-sm bg-gray-100 dark:bg-gray-800">
              {property.images && property.images.length > 0 ? (
                <img
                  src={property.images[activeImageIdx]}
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50 dark:bg-gray-800">
                  <span>No images available</span>
                </div>
              )}
            </div>
            
            {/* Thumbnail selector */}
            {property.images && property.images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {property.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIdx(idx)}
                    className={`relative rounded-xl overflow-hidden h-16 aspect-video border-2 shrink-0 ${
                      activeImageIdx === idx ? 'border-indigo-600 dark:border-indigo-400 shadow-md shadow-indigo-600/10' : 'border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                    }`}
                  >
                    <img src={img} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Description & specs */}
          <Card className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">About the Property</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed whitespace-pre-line">
                {property.description || 'No description provided for this listing.'}
              </p>
            </div>

            {/* Spec highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-gray-50 dark:border-gray-800 pt-6">
              <div className="p-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl text-center space-y-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Property Type</span>
                <p className="text-base font-bold text-gray-800 dark:text-gray-200 capitalize">{property.property_type}</p>
              </div>
              <div className="p-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl text-center space-y-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Bedrooms</span>
                <p className="text-base font-bold text-gray-800 dark:text-gray-200">{property.bedrooms || '-'}</p>
              </div>
              <div className="p-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl text-center space-y-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Bathrooms</span>
                <p className="text-base font-bold text-gray-800 dark:text-gray-200">{property.bathrooms || '-'}</p>
              </div>
              <div className="p-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl text-center space-y-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Area</span>
                <p className="text-base font-bold text-gray-800 dark:text-gray-200">{property.area_sqft ? `${property.area_sqft} sqft` : '-'}</p>
              </div>
            </div>
          </Card>

          {/* Utilities & Comforts Card */}
          {(property.water_source || property.power_backup || property.parking || property.preferred_tenant || property.gated_community || (property.security_features && property.security_features.length > 0)) && (
            <Card className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-2">Utilities & Amenities</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Utilities specs */}
                <div className="space-y-4">
                  {property.water_source && (
                    <div className="flex justify-between items-center text-sm py-1 border-b border-gray-50 dark:border-gray-800">
                      <span className="text-gray-500 dark:text-gray-400 font-medium">Water Source</span>
                      <span className="font-bold text-gray-800 dark:text-gray-200 capitalize">
                        {property.water_source === 'both' ? 'Municipal & Borewell' : property.water_source}
                      </span>
                    </div>
                  )}
                  {property.power_backup && (
                    <div className="flex justify-between items-center text-sm py-1 border-b border-gray-50 dark:border-gray-800">
                      <span className="text-gray-500 dark:text-gray-400 font-medium">Power Backup</span>
                      <span className="font-bold text-gray-800 dark:text-gray-200 capitalize">{property.power_backup}</span>
                    </div>
                  )}
                  {property.parking && (
                    <div className="flex justify-between items-center text-sm py-1 border-b border-gray-50 dark:border-gray-800">
                      <span className="text-gray-500 dark:text-gray-400 font-medium">Parking</span>
                      <span className="font-bold text-gray-800 dark:text-gray-200 capitalize">
                        {property.parking === 'bike' ? 'Two-Wheeler Only' : 
                         property.parking === 'car-open' ? 'Four-Wheeler (Open)' : 
                         property.parking === 'car-covered' ? 'Four-Wheeler (Covered)' : property.parking}
                      </span>
                    </div>
                  )}
                  {property.preferred_tenant && (
                    <div className="flex justify-between items-center text-sm py-1 border-b border-gray-50 dark:border-gray-800">
                      <span className="text-gray-500 dark:text-gray-400 font-medium">Preferred Tenant</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400 capitalize">
                        {property.preferred_tenant === 'any' ? 'Any (Bachelors/Family)' : 
                         property.preferred_tenant === 'family' ? 'Families Only' : 
                         property.preferred_tenant === 'bachelors' ? 'Bachelors Only' : 
                         property.preferred_tenant === 'company' ? 'Company Lease' : property.preferred_tenant}
                      </span>
                    </div>
                  )}
                  {property.preferred_gender && property.preferred_gender !== 'any' && (
                    <div className="flex justify-between items-center text-sm py-1 border-b border-gray-50 dark:border-gray-800">
                      <span className="text-gray-500 dark:text-gray-400 font-medium">Gender Preference</span>
                      <span className="font-bold text-amber-600 dark:text-amber-500 capitalize">
                        {property.preferred_gender === 'male' ? 'Male Only' : 
                         property.preferred_gender === 'female' ? 'Female Only' : property.preferred_gender}
                      </span>
                    </div>
                  )}
                  {property.gated_community !== undefined && property.gated_community !== null && (
                    <div className="flex justify-between items-center text-sm py-1 border-b border-gray-50 dark:border-gray-800">
                      <span className="text-gray-500 dark:text-gray-400 font-medium">Gated Community</span>
                      <span className="font-bold text-gray-800 dark:text-gray-200">{property.gated_community ? 'Yes' : 'No'}</span>
                    </div>
                  )}
                  {property.is_upstairs !== undefined && property.is_upstairs !== null && (
                    <div className="flex justify-between items-center text-sm py-1 border-b border-gray-50 dark:border-gray-800">
                      <span className="text-gray-500 dark:text-gray-400 font-medium">Floor Unit</span>
                      <span className="font-bold text-gray-800 dark:text-gray-200">{property.is_upstairs ? 'Upstairs Unit' : 'Ground Floor Unit'}</span>
                    </div>
                  )}
                </div>

                {/* Security Features & Badges */}
                <div className="space-y-3">
                  <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Security & Safety Features</span>
                  {property.security_features && property.security_features.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {property.security_features.map((feature) => (
                        <span key={feature} className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100/60 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-semibold capitalize">
                          {feature === 'cctv' ? 'CCTV Cameras' : 
                           feature === 'guard' ? '24/7 Guard' : 
                           feature === 'intercom' ? 'Intercom' : 
                           feature === 'fire' ? 'Fire Safety' : feature}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No security checklist specified</p>
                  )}
                </div>

              </div>
            </Card>
          )}

          {/* Furnishing Card */}
          {property.is_furnished && (
            <Card className="space-y-6">
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-2">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Furnishing & Fittings</h3>
                <span className="px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-semibold">
                  Furnished {property.num_beds ? `(${property.num_beds} Beds)` : ''}
                </span>
              </div>
              
              {property.furniture_list && property.furniture_list.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {property.furniture_list.map((item) => (
                    <div key={item} className="flex items-center space-x-2 text-xs font-semibold text-gray-700 dark:text-gray-300 p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl">
                      <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-500 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">Furnished unit with standard fittings.</p>
              )}
            </Card>
          )}

          {/* Video Tour Card */}
          {property.videos && property.videos.length > 0 && (
            <Card className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-2">Video Tour</h3>
              <div className="aspect-video bg-black rounded-2xl overflow-hidden relative border border-gray-100 dark:border-gray-800">
                <video
                  controls
                  className="w-full h-full object-cover"
                  src={property.videos[0].startsWith('http') || property.videos[0].startsWith('/') || property.videos[0].startsWith('blob') ? property.videos[0] : undefined}
                  poster="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800"
                />
              </div>
            </Card>
          )}

        </div>

        {/* Right Side: Price, Location & Contact Card */}
        <div className="space-y-6">
          
          {/* Main Price & Title Box */}
          <Card className="space-y-6">
            <div className="space-y-3">
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-semibold uppercase tracking-wider">
                  For {property.listing_type}
                </span>
                <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-semibold uppercase tracking-wider">
                  Active
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-snug">{property.title}</h1>
              <div className="flex items-center space-x-1.5 text-sm text-gray-500 dark:text-gray-400">
                <MapPin className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                <span>{property.address}, {property.city}, {property.state}</span>
              </div>
            </div>

            <div className="border-t border-gray-50 dark:border-gray-800 pt-4 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Asking Price</span>
                <span className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
                  {formatPrice(property.price, property.listing_type)}
                </span>
              </div>
              <button
                onClick={() => setIsBookmarked(!isBookmarked)}
                className={`p-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:scale-105 active:scale-95 transition-all duration-200 ${
                  isBookmarked ? 'text-red-500 dark:text-red-500 bg-red-50/50 dark:bg-red-900/20' : ''
                }`}
              >
                <Heart className={`h-5 w-5 ${isBookmarked ? 'fill-red-500 text-red-500' : ''}`} />
              </button>
            </div>
          </Card>

          {/* Owner/Contact Box */}
          <Card className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-lg shadow-sm shrink-0 uppercase">
                {property.user?.full_name?.charAt(0) || 'O'}
              </div>
              <div className="space-y-0.5">
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Listed By</span>
                <h4 className="text-base font-bold text-gray-800 dark:text-gray-200">{property.user?.full_name || 'Owner'}</h4>
                <div className="flex items-center space-x-1 text-xs text-emerald-600 dark:text-emerald-500 font-semibold">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Verified Landlord</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {showContact ? (
                <div className="space-y-3 p-4 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-2xl animate-fade-in text-sm text-gray-800 dark:text-gray-200">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="font-medium">+91 98765 43210</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <span>{property.user?.email || 'contact@example.com'}</span>
                  </div>
                </div>
              ) : (
                <Button onClick={() => setShowContact(true)} className="w-full flex items-center justify-center space-x-2 font-semibold">
                  <Phone className="h-4 w-4" />
                  <span>Reveal Contact Info</span>
                </Button>
              )}

              <Button variant="outline" className="w-full flex items-center justify-center space-x-2 font-semibold">
                <Mail className="h-4 w-4" />
                <span>Send Message</span>
              </Button>
            </div>
          </Card>

        </div>

      </div>

    </div>
  )
}
