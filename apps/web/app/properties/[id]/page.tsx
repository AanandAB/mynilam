'use client'

import React, { useState } from 'react'
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
} from 'lucide-react'
import { ReviewSection } from '@/components/properties/ReviewSection'
import { InquiryForm } from '@/components/properties/InquiryForm'
import { VisitRequestForm } from '@/components/properties/VisitRequestForm'
import { LocationSection } from '@/components/properties/LocationSection'
import { PropertyGallery } from '@/components/properties/PropertyGallery'
import { PropertySummaryCards } from '@/components/properties/PropertySummaryCards'
import { AmenitiesBadges } from '@/components/properties/AmenitiesBadges'
import { HostelSummaryBanner } from '@/components/properties/HostelSummaryBanner'
import { RoomBreakdownSection } from '@/components/properties/RoomBreakdownSection'
import { MoveInSummaryDrawer } from '@/components/properties/MoveInSummaryDrawer'
import type { RoomOption } from '@repo/shared'
import { useFavorites, useToggleFavorite } from '@/app/hooks/use-favorites'

export default function PropertyDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const { user } = useAuth()

  const { data: property, isLoading, error } = useProperty(id)
  const { data: favorites } = useFavorites()
  const { mutate: toggleFavorite, isPending: isTogglePending } = useToggleFavorite()

  const [showContact, setShowContact] = useState(false)
  const [copied, setCopied] = useState(false)
  const [selectedRoomOption, setSelectedRoomOption] = useState<RoomOption | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const isBookmarked = favorites?.some((f) => f.id.toString() === id.toString()) || false


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
        <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded-md" />

        {/* Hero Header Skeleton */}
        <div className="space-y-4">
          <div className="h-8 w-2/3 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-800 rounded-md" />
        </div>

        {/* Gallery & Sidebar Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="w-full aspect-video bg-slate-200 dark:bg-slate-800 rounded-3xl" />
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
            <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
            <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !property) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-3xl p-8 text-center text-red-600 dark:text-red-400 max-w-md mx-auto space-y-4 shadow-sm">
          <p className="font-bold text-lg">Property Not Found</p>
          <p className="text-xs text-red-500 dark:text-red-400 leading-relaxed">
            {error?.message || 'The property you are looking for does not exist or may have been removed.'}
          </p>
          <Button onClick={() => router.push('/')} className="font-semibold w-full bg-red-600 hover:bg-red-700 text-white rounded-xl">
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 pb-24 lg:pb-12">
      {/* Navigation & Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/')}
          className="inline-flex items-center space-x-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to catalog</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            aria-label="Share property link"
            className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">{copied ? 'Link Copied!' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* 1. HERO SECTION (Above Image Gallery) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            {/* Badges Row */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full text-[11px] font-bold uppercase tracking-wider">
                For {property.listing_type}
              </span>
              <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {property.num_beds && property.num_beds > 0 ? `${property.num_beds} Beds Available` : 'Active / Available'}
              </span>
              <span className="px-3 py-1 bg-purple-50 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-900/50 text-purple-700 dark:text-purple-300 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                {property.property_type}
              </span>
            </div>

            {/* Hostel Title */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 leading-tight">
              {property.title}
            </h1>

            {/* General Location */}
            <div className="flex items-center space-x-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              <MapPin className="h-4 w-4 text-indigo-500 shrink-0" />
              <span>
                {property.address ? `${property.address}, ` : ''}
                {property.city}, {property.state}
              </span>
            </div>
          </div>

          {/* Monthly Rent & Save Action */}
          <div className="flex items-center justify-between md:flex-col md:items-end gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
            <div className="text-left md:text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Monthly Rent</span>
              <span className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">
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
              className={`p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-all duration-200 flex items-center gap-2 ${
                isBookmarked ? 'text-red-500 dark:text-red-500 bg-red-50/60 dark:bg-red-950/40 border-red-200 dark:border-red-900' : ''
              } ${isTogglePending ? 'opacity-50 cursor-not-allowed' : ''}`}
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
          <Card className="p-6 space-y-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-500" />
                About the Property
              </h3>
            </div>

            {property.description ? (
              <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                {property.description}
              </p>
            ) : (
              /* Empty State for Description */
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-center space-y-2">
                <FileText className="w-8 h-8 text-slate-400 mx-auto opacity-60" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">No Description Provided</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">The property owner has not added a detailed written overview yet.</p>
              </div>
            )}
          </Card>

          {/* 4. AMENITIES & FACILITIES */}
          <AmenitiesBadges property={property} />

          {/* VIDEO TOUR (If present) */}
          {property.videos && property.videos.length > 0 && (
            <Card className="p-6 space-y-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Video className="w-5 h-5 text-indigo-500" />
                Video Walkthrough
              </h3>
              <div className="aspect-video bg-slate-950 rounded-2xl overflow-hidden relative border border-slate-800">
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

          {/* REVIEWS SECTION */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <ReviewSection propertyId={id} />
          </div>
        </div>

        {/* 6. SIDEBAR (Sticky on Desktop) */}
        <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
          
          {/* Card 1: Top Pricing & Availability Card */}
          <Card className="p-6 space-y-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Monthly Rent</span>
                <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
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
                className={`p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-all ${
                  isBookmarked ? 'text-red-500 dark:text-red-500 bg-red-50/60 dark:bg-red-950/40 border-red-200 dark:border-red-900' : ''
                }`}
              >
                <Heart className={`h-5 w-5 ${isBookmarked ? 'fill-red-500 text-red-500' : ''}`} />
              </button>
            </div>

            <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/50 flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Availability Status
              </span>
              <span>{property.num_beds && property.num_beds > 0 ? `${property.num_beds} Beds Left` : 'Available'}</span>
            </div>
          </Card>

          {/* Unified Owner Contact & Inquiry Form Card */}
          <div id="sidebar-inquiry-section">
            <InquiryForm
              propertyId={id}
              ownerId={property.user?.id?.toString() || ''}
              ownerName={property.user?.full_name}
              ownerPhone={property.user?.phone}
              ownerEmail={property.user?.email}
            />
          </div>

          {/* Card 4: Schedule Visit Form */}
          <div id="sidebar-visit-section">
            <VisitRequestForm propertyId={id} ownerId={property.user?.id?.toString() || ''} />
          </div>

        </div>
      </div>

      {/* 10. MOBILE STICKY BOTTOM ACTION BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 p-3.5 flex items-center justify-between lg:hidden shadow-2xl">
        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Monthly Rent</span>
          <span className="text-lg font-black text-indigo-400">
            {formatPrice(property.starting_price || property.price, property.listing_type)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={scrollToInquiry}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 shadow-md"
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

