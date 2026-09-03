'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useProperty } from '@/app/hooks/use-properties'
import { useAuth } from '@/app/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  MapPin,
  Heart,
  Phone,
  Mail,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Video,
  Share2,
  Building2,
  Calendar,
  Navigation,
} from 'lucide-react'
import { ReviewSection } from '@/components/properties/ReviewSection'
import { InquiryForm } from '@/components/properties/InquiryForm'
import { VisitRequestForm } from '@/components/properties/VisitRequestForm'
import { LocationSection } from '@/components/properties/LocationSection'
import { DistanceCalculator } from '@/components/properties/DistanceCalculator'
import { NearbyPlaces } from '@/components/properties/NearbyPlaces'
import { PropertyGallery } from '@/components/properties/PropertyGallery'
import { PropertySummaryCards } from '@/components/properties/PropertySummaryCards'
import { AmenitiesBadges } from '@/components/properties/AmenitiesBadges'
import { HostelSummaryBanner } from '@/components/properties/HostelSummaryBanner'
import { RoomBreakdownSection } from '@/components/properties/RoomBreakdownSection'
import { MoveInSummaryDrawer } from '@/components/properties/MoveInSummaryDrawer'
import type { RoomOption } from '@repo/shared'
import { useFavorites, useToggleFavorite } from '@/app/hooks/use-favorites'
import { useGeolocation } from '@/app/hooks/use-geolocation'
import { getDistanceKm, formatDistance } from '@/utils/distance'

export default function PropertyDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const { user } = useAuth()

  const { data: property, isLoading, error } = useProperty(id)
  const { data: favorites } = useFavorites()
  const { mutate: toggleFavorite, isPending: isTogglePending } = useToggleFavorite()

  const geo = useGeolocation()
  const [showContact, setShowContact] = useState(false)
  const [copied, setCopied] = useState(false)
  const [selectedRoomOption, setSelectedRoomOption] = useState<RoomOption | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const isBookmarked = favorites?.some((f) => f.id.toString() === id.toString()) || false

  // Calculate distance
  const distance =
    property &&
    geo.latitude != null && geo.longitude != null &&
    property.latitude != null && property.longitude != null
      ? getDistanceKm(geo.latitude, geo.longitude, property.latitude, property.longitude)
      : null

  // Dynamic SEO: update document title and meta tags when property loads
  useEffect(() => {
    if (!property) return

    const prevTitle = document.title
    const location = [property.city, property.state].filter(Boolean).join(', ')
    const priceFormatted = property.price?.toLocaleString('en-IN', {
      maximumFractionDigits: 0,
      style: 'currency',
      currency: 'INR',
    })
    const title = `${property.title} | ${priceFormatted} - ${property.listing_type === 'rent' ? 'For Rent' : 'For Sale'} in ${location} | MyNilam`
    const description = property.description
      ? property.description.slice(0, 160).replace(/\n/g, ' ')
      : `${property.title} - ${property.bedrooms || 0} BHK ${property.property_type} in ${location}. ${priceFormatted}${property.listing_type === 'rent' ? '/mo' : ''}. Listed on MyNilam.`
    const imageUrl = property.images?.[0] || ''
    const pageUrl = typeof window !== 'undefined' ? window.location.href : ''

    document.title = title

    // Helper to set or create a meta tag
    const setMeta = (property: string, content: string) => {
      let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null
        || document.querySelector(`meta[name="${property}"]`) as HTMLMetaElement | null
      if (!el) {
        el = document.createElement('meta')
        if (property.startsWith('og:') || property.startsWith('twitter:')) {
          el.setAttribute('property', property)
        } else {
          el.setAttribute('name', property)
        }
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }

    // Standard SEO
    setMeta('description', description)
    setMeta('robots', 'index, follow')

    // Open Graph
    setMeta('og:type', 'article')
    setMeta('og:title', title)
    setMeta('og:description', description)
    if (imageUrl) setMeta('og:image', imageUrl)
    if (pageUrl) setMeta('og:url', pageUrl)
    setMeta('og:site_name', 'MyNilam')

    // Twitter Card
    setMeta('twitter:card', imageUrl ? 'summary_large_image' : 'summary')
    setMeta('twitter:title', title)
    setMeta('twitter:description', description)
    if (imageUrl) setMeta('twitter:image', imageUrl)

    // Cleanup: restore previous title on unmount
    return () => {
      document.title = prevTitle
    }
  }, [property])

  React.useEffect(() => {
    if (user && user.role === 'hostel_admin') {
      router.push('/dashboard')
    }
  }, [user, router])

  if (user && user.role === 'hostel_admin') return null

  // Skeleton Loader for Page Loading
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-pulse">
        {/* Back Link Skeleton */}
        <div className="h-4 w-32 rounded-md" style={{ background: 'var(--surface-2)' }} />

        {/* Hero Header Skeleton */}
        <div className="space-y-4">
          <div className="h-8 w-2/3 rounded-xl" style={{ background: 'var(--surface-2)' }} />
          <div className="h-4 w-1/3 rounded-md" style={{ background: 'var(--surface-2)' }} />
        </div>

        {/* Gallery & Sidebar Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="w-full aspect-video rounded-2xl" style={{ background: 'var(--surface-2)' }} />
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-24 rounded-2xl" style={{ background: 'var(--surface-2)' }} />
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <div className="h-44 rounded-2xl" style={{ background: 'var(--surface-2)' }} />
            <div className="h-40 rounded-2xl" style={{ background: 'var(--surface-2)' }} />
            <div className="h-64 rounded-2xl" style={{ background: 'var(--surface-2)' }} />
          </div>
        </div>
      </div>
    )
  }

  if (error || !property) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="rounded-2xl p-8 text-center max-w-md mx-auto space-y-4 shadow-sm" style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.2)', color: '#f43f5e' }}>
          <p className="font-bold text-lg">Property Not Found</p>
          <p className="text-xs leading-relaxed" style={{ color: '#f43f5e' }}>
            {error?.message || 'The property you are looking for does not exist or may have been removed.'}
          </p>
          <Button onClick={() => router.push('/')} className="font-semibold w-full text-white rounded-xl" style={{ background: '#f43f5e' }}>
            Back to Listings
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
    return listingType === 'rent' || listingType === 'roommate' ? `${formatted}/mo` : formatted
  }

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const isOwner = user?.id === property.user_id
  const isUnlocked = !!property.location_unlocked || isOwner

  const scrollToInquiry = () => {
    const element = document.getElementById('sidebar-inquiry-section')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Structured data for Google rich results
  const structuredData = property ? {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: property.title,
    description: property.description || `${property.title} in ${property.city}`,
    url: typeof window !== 'undefined' ? window.location.href : '',
    image: property.images?.[0] || '',
    datePosted: property.created_at || new Date().toISOString(),
    offers: {
      '@type': 'Offer',
      price: property.price,
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: property.address || '',
      addressLocality: property.city || '',
      addressRegion: property.state || '',
      addressCountry: 'IN',
    },
    numberOfRooms: property.bedrooms || undefined,
    floorSize: property.area_sqft ? {
      '@type': 'QuantitativeValue',
      value: property.area_sqft,
      unitCode: 'FTK',
    } : undefined,
  } : null

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 pb-24 lg:pb-12">
      {/* JSON-LD structured data for Google */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}
      {/* Navigation & Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/')}
          className="inline-flex items-center space-x-2 text-xs font-bold transition-colors group" style={{ color: 'var(--text-muted)' }}
        >            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to listings</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            aria-label="Share property link"
            className="p-2.5 rounded-xl transition-all text-xs font-semibold flex items-center gap-1.5" style={{ background: 'var(--surface)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">{copied ? 'Link Copied!' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* 1. HERO SECTION (Above Image Gallery) */}
      <div className="p-6 rounded-2xl space-y-4" style={{ background: 'var(--surface)', border: '1px solid var(--border-color)' }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            {/* Badges Row */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider" style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid rgba(13,148,136,0.2)' }}>
                For {property.listing_type}
              </span>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                {property.num_beds && property.num_beds > 0 ? `${property.num_beds} Beds Available` : 'Active / Available'}
              </span>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1" style={{ background: 'rgba(139,92,246,0.1)', color: '#7c3aed', border: '1px solid rgba(139,92,246,0.2)' }}>
                <Building2 className="w-3.5 h-3.5" />
                {property.property_type}
              </span>
            </div>

            {/* Hostel Title */}
            <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
              {property.title}
            </h1>

            {/* General Location */}
            <div className="flex items-center space-x-1.5 text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }}>
              <MapPin className="h-4 w-4 shrink-0" style={{ color: 'var(--primary)' }} />
              <span>
                {property.address ? `${property.address}, ` : ''}
                {property.city}, {property.state}
                {property.landmark ? ` · Near ${property.landmark}` : ''}
              </span>
            </div>

            {/* Distance from user */}
            {distance !== null && (
              <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--primary)' }}>
                <Navigation className="h-3.5 w-3.5" />
                <span>{formatDistance(distance)} from your location</span>
              </div>
            )}
          </div>

          {/* Monthly Rent & Save Action */}
          <div className="flex items-center justify-between md:flex-col md:items-end gap-2 pt-3 md:pt-0 border-t md:border-t-0" style={{ borderColor: 'var(--border-color)' }}>
            <div className="text-left md:text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>Monthly Rent</span>
              <span className="text-2xl sm:text-3xl font-black" style={{ color: 'var(--primary)' }}>
                {formatPrice(property.price, property.listing_type)}
              </span>
            </div>

            <button
              onClick={() => {
                if (!user || user.role === 'guest') {
                  router.push('/login')
                  return
                }
                toggleFavorite(property.id)
              }}
              disabled={isTogglePending}
              aria-label={isBookmarked ? 'Remove from saved properties' : 'Save property to favorites'}
              className={`p-3 rounded-2xl transition-all duration-200 flex items-center gap-2 ${
                isBookmarked ? '' : ''
              } ${isTogglePending ? 'opacity-50 cursor-not-allowed' : ''}`}
              style={{ background: isBookmarked ? 'rgba(244,63,94,0.1)' : 'var(--surface-2)', border: '1px solid ' + (isBookmarked ? 'rgba(244,63,94,0.3)' : 'var(--border-color)'), color: isBookmarked ? '#f43f5e' : 'var(--text-muted)' }}
            >
              <Heart className={`h-5 w-5 ${isBookmarked ? 'fill-red-500 text-red-500' : ''}`} />
              <span className="text-xs font-bold md:hidden">{isBookmarked ? 'Saved' : 'Save Hostel'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* HOSTEL TOP QUICK SUMMARY BANNER */}
      {['hostel', 'pg'].includes(property.property_type) && (
        <HostelSummaryBanner property={property} />
      )}

      {/* Main Grid: Gallery & Left Content vs Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Side Column (Col-Span 2) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* 2. IMAGE GALLERY */}
          <PropertyGallery images={property.images} title={property.title} hostelPhotos={property.hostel_photos} />

          {/* 3. PROPERTY SUMMARY CARDS */}
          <PropertySummaryCards property={property} />

          {/* ROOM TYPES & PRICING BREAKDOWN (FOR HOSTEL/PG) */}
          {['hostel', 'pg'].includes(property.property_type) && (
            <RoomBreakdownSection
              property={property}
              onSelectRoomOption={(opt) => {
                setSelectedRoomOption(opt)
                setIsDrawerOpen(true)
              }}
            />
          )}

          {/* ABOUT THE PROPERTY / DESCRIPTION */}
          <Card className="p-6 space-y-4 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                <FileText className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                About the Property
              </h3>
            </div>

            {property.description ? (
              <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--text-secondary)' }}>
                {property.description}
              </p>
            ) : (
              /* Empty State for Description */
              <div className="p-6 rounded-2xl text-center space-y-2" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-color)' }}>
                <FileText className="w-8 h-8 mx-auto opacity-60" style={{ color: 'var(--text-muted)' }} />
                <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>No Description Provided</p>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>The property owner has not added a detailed written overview yet.</p>
              </div>
            )}
          </Card>

          {/* 4. AMENITIES & FACILITIES */}
          <AmenitiesBadges property={property} />

          {/* VIDEO TOUR (If present) */}
          {property.videos && property.videos.length > 0 && (
            <Card className="p-6 space-y-4 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border-color)' }}>
              <h3 className="text-lg font-bold flex items-center gap-2 pb-3" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)', borderBottom: '1px solid var(--border-color)' }}>
                <Video className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                Video Walkthrough
              </h3>
              <div className="aspect-video rounded-2xl overflow-hidden relative" style={{ background: '#000', border: '1px solid var(--border-color)' }}>
                <video
                  controls
                  className="w-full h-full object-cover"
                  src={
                    property.videos[0].startsWith('http') ||
                    property.videos[0].startsWith('/') ||
                    property.videos[0].startsWith('blob')
                      ? property.videos[0]
                      : undefined
                  }
                />
              </div>
            </Card>
          )}

          {/* 5. LOCATION PRIVACY & MAP SECTION */}
          <LocationSection
            propertyId={id}
            initialLocationUnlocked={isUnlocked}
            latitude={property.latitude}
            longitude={property.longitude}
            addressLine1={property.address}
            city={property.city}
            state={property.state}
            area={property.city}
            landmark={property.landmark}
          />

          {/* NEARBY PLACES / POINTS OF INTEREST */}
          {property.latitude && property.longitude && (
            <NearbyPlaces
              latitude={property.latitude}
              longitude={property.longitude}
            />
          )}

          {/* REVIEWS SECTION */}
          <div className="pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
            <ReviewSection propertyId={id} />
          </div>
        </div>

        {/* 6. SIDEBAR (Sticky on Desktop) */}
        <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
          
          {/* Card 1: Top Pricing & Availability Card */}
          <Card className="p-6 space-y-5 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>Monthly Rent</span>
                <span className="text-3xl font-black" style={{ color: 'var(--primary)' }}>
                  {formatPrice(property.price, property.listing_type)}
                </span>
              </div>

              <button
                onClick={() => {
                  if (!user || user.role === 'guest') {
                    router.push('/login')
                    return
                  }
                  toggleFavorite(property.id)
                }}
                disabled={isTogglePending}
                aria-label={isBookmarked ? 'Remove from saved' : 'Save property'}
                className={`p-3 rounded-2xl transition-all`}
                style={{ background: isBookmarked ? 'rgba(244,63,94,0.1)' : 'var(--surface-2)', border: '1px solid ' + (isBookmarked ? 'rgba(244,63,94,0.3)' : 'var(--border-color)'), color: isBookmarked ? '#f43f5e' : 'var(--text-muted)' }}
              >
                <Heart className={`h-5 w-5 ${isBookmarked ? 'fill-red-500 text-red-500' : ''}`} />
              </button>
            </div>

            <div className="p-3 rounded-2xl flex items-center justify-between text-xs font-bold" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981' }}>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Availability Status
              </span>
              <span>{property.num_beds && property.num_beds > 0 ? `${property.num_beds} Beds Left` : 'Available'}</span>
            </div>

            {/* Advance / security deposit (rentals) */}
            {property.security_deposit ? (
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="font-semibold" style={{ color: 'var(--text-muted)' }}>Security Deposit</span>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  ₹{property.security_deposit.toLocaleString('en-IN')}
                </span>
              </div>
            ) : null}
          </Card>

          {/* Unified Owner Contact & Inquiry Form Card */}
          <div id="sidebar-inquiry-section">
            <InquiryForm
              propertyId={id}
              ownerId={property.user?.id?.toString() || ''}
              ownerName={property.contact_name || property.user?.full_name}
              ownerPhone={property.contact_phone || property.user?.phone}
              ownerEmail={property.user?.email}
              showContactDetails={!!property.show_contact_details}
            />
          </div>

          {/* Card 4: Schedule Visit Form */}
          <div id="sidebar-visit-section">
            <VisitRequestForm propertyId={id} ownerId={property.user?.id?.toString() || ''} />
          </div>

          {/* Card 5: Distance Calculator */}
          <DistanceCalculator
            propertyLatitude={property.latitude}
            propertyLongitude={property.longitude}
            propertyAddress={property.address}
            propertyCity={property.city}
          />

        </div>
      </div>

      {/* 10. MOBILE STICKY BOTTOM ACTION BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-40 backdrop-blur-md p-3.5 flex items-center justify-between lg:hidden shadow-2xl dark:bg-[#111b2e]/95" style={{ background: 'rgba(255,255,255,0.95)', borderTop: '1px solid var(--border-color)' }}>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>Monthly Rent</span>
          <span className="text-lg font-black" style={{ color: 'var(--primary)' }}>
            {formatPrice(property.starting_price || property.price, property.listing_type)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={scrollToInquiry}
            className="text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 shadow-md"
            style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))' }}
          >
            <Mail className="w-3.5 h-3.5" /> Inquire Now
          </Button>
        </div>
      </div>

      {/* 11. MOVE-IN SUMMARY DRAWER */}
      <MoveInSummaryDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        roomOption={selectedRoomOption}
        property={property}
        onContactClick={scrollToInquiry}
      />
    </div>
  )
}

