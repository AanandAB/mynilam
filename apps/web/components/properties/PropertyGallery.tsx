'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Image as ImageIcon, ChevronLeft, ChevronRight, X, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

import type { HostelPhoto } from '@repo/shared'

interface PropertyGalleryProps {
  images?: string[]
  title: string
  hostelPhotos?: HostelPhoto[]
}

const CATEGORY_NAMES: Record<string, string> = {
  COVER: 'Cover Image',
  ENTRANCE: 'Hostel Entrance',
  ROOM: 'Rooms',
  BATHROOM: 'Bathrooms',
  DINING: 'Dining Area',
  COMMON_AREA: 'Common Area',
}

export function PropertyGallery({ images = [], title, hostelPhotos = [] }: PropertyGalleryProps) {
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL')

  // Filter gallery images by category if hostelPhotos available
  const availableCategories = React.useMemo(() => {
    if (!hostelPhotos || hostelPhotos.length === 0) return []
    const cats = new Set(hostelPhotos.map((p) => p.category))
    return Array.from(cats)
  }, [hostelPhotos])

  const displayImages = React.useMemo(() => {
    if (selectedCategoryFilter === 'ALL' || !hostelPhotos || hostelPhotos.length === 0) {
      return images
    }
    const filtered = hostelPhotos
      .filter((hp) => hp.category === selectedCategoryFilter)
      .map((hp) => hp.imageUrl)
    return filtered.length > 0 ? filtered : images
  }, [images, hostelPhotos, selectedCategoryFilter])

  const [activeIdx, setActiveIdx] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [imgErrorMap, setImgErrorMap] = useState<Record<number, boolean>>({})

  // Reset index when filter changes
  useEffect(() => {
    setActiveIdx(0)
  }, [selectedCategoryFilter])

  const totalImages = displayImages.length
  const displayThumbnails = displayImages.slice(0, 4)
  const extraCount = totalImages > 4 ? totalImages - 4 : 0


  const handlePrev = useCallback(() => {
    setActiveIdx((prev) => (prev === 0 ? totalImages - 1 : prev - 1))
  }, [totalImages])

  const handleNext = useCallback(() => {
    setActiveIdx((prev) => (prev === totalImages - 1 ? 0 : prev + 1))
  }, [totalImages])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isLightboxOpen) return
      if (e.key === 'Escape') setIsLightboxOpen(false)
      if (e.key === 'ArrowLeft') handlePrev()
      if (e.key === 'ArrowRight') handleNext()
    },
    [isLightboxOpen, handlePrev, handleNext]
  )

  useEffect(() => {
    if (isLightboxOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isLightboxOpen, handleKeyDown])

  const openLightbox = (index: number) => {
    setActiveIdx(index)
    setIsLightboxOpen(true)
  }

  const handleImageError = (index: number) => {
    setImgErrorMap((prev) => ({ ...prev, [index]: true }))
  }

  if (!images || images.length === 0) {
    return (
      <div className="w-full aspect-[16/9] sm:aspect-[21/9] bg-slate-100 dark:bg-slate-800/80 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 space-y-3 p-6 shadow-inner">
        <div className="p-4 rounded-2xl bg-slate-200/60 dark:bg-slate-700/50">
          <ImageIcon className="w-10 h-10 text-slate-400 dark:text-slate-500" />
        </div>
        <div className="text-center space-y-1">
          <h4 className="font-semibold text-slate-700 dark:text-slate-300 text-base">No Photos Available</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">The property owner has not uploaded photo previews yet.</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {/* Category Filter Pills (if hostel photo categories exist) */}
        {availableCategories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedCategoryFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                selectedCategoryFilter === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All Photos ({images.length})
            </button>
            {availableCategories.map((catKey) => {
              const label = CATEGORY_NAMES[catKey] || catKey
              const count = hostelPhotos.filter((hp) => hp.category === catKey).length
              return (
                <button
                  key={catKey}
                  type="button"
                  onClick={() => setSelectedCategoryFilter(catKey)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                    selectedCategoryFilter === catKey
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {label} ({count})
                </button>
              )
            })}
          </div>
        )}

        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4">
          
          {/* Main Featured Image */}
          <div
            onClick={() => openLightbox(activeIdx)}
            className="md:col-span-3 relative rounded-3xl overflow-hidden aspect-[16/10] sm:aspect-[16/9] border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/60 group cursor-pointer shadow-sm hover:shadow-md transition-all duration-300"
          >
            {!imgErrorMap[activeIdx] && displayImages[activeIdx] ? (
              <Image
                src={displayImages[activeIdx]}
                alt={`${title} - Photo ${activeIdx + 1}`}
                fill
                onError={() => handleImageError(activeIdx)}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-400">
                <ImageIcon className="w-8 h-8 mb-2" />
                <span className="text-xs">Image unavailable</span>
              </div>
            )}

            {/* Hover overlay hint */}
            <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <span className="px-4 py-2 bg-slate-900/80 backdrop-blur text-white text-xs font-semibold rounded-full border border-white/20 flex items-center gap-2 shadow-lg">
                <Maximize2 className="w-3.5 h-3.5" /> View Fullscreen
              </span>
            </div>

            {/* Photo count indicator pill */}
            <div className="absolute bottom-3 right-3 px-3 py-1 bg-slate-950/70 backdrop-blur-md text-white text-xs font-medium rounded-full border border-white/10 flex items-center gap-1.5 shadow-md">
              <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span>{activeIdx + 1} / {totalImages}</span>
            </div>
          </div>

          {/* Side Thumbnail Stack (Desktop) */}
          <div className="hidden md:flex flex-col gap-3">
            {displayThumbnails.map((img, idx) => {
              const isSelected = activeIdx === idx
              const isLastAndExtra = idx === 3 && extraCount > 0

              return (
                <button
                  key={idx}
                  onClick={() => openLightbox(idx)}
                  aria-label={`View image ${idx + 1} of ${totalImages}`}
                  className={`relative flex-1 rounded-2xl overflow-hidden border-2 transition-all duration-200 group text-left ${
                    isSelected
                      ? 'border-indigo-500 ring-2 ring-indigo-500/30'
                      : 'border-transparent hover:border-slate-400 dark:hover:border-slate-600'
                  }`}
                >
                  {!imgErrorMap[idx] ? (
                    <Image
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      fill
                      onError={() => handleImageError(idx)}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-500 text-xs">
                      Error
                    </div>
                  )}

                  {/* Extra overlay badge on 4th item */}
                  {isLastAndExtra && (
                    <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-xs flex flex-col items-center justify-center text-white transition-all group-hover:bg-slate-950/85">
                      <span className="font-extrabold text-base sm:text-lg">+{extraCount}</span>
                      <span className="text-[10px] font-medium uppercase tracking-wider text-slate-300">More</span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Mobile Horizontal Thumbnail Bar */}
        <div className="flex md:hidden gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          {displayImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIdx(idx)}
              aria-label={`Select photo ${idx + 1}`}
              className={`relative rounded-xl overflow-hidden h-16 w-24 shrink-0 border-2 transition-all ${
                activeIdx === idx
                  ? 'border-indigo-500 ring-2 ring-indigo-500/30'
                  : 'border-slate-200 dark:border-slate-800 opacity-70'
              }`}
            >
              <Image src={img} alt={`Thumb ${idx + 1}`} fill className="w-full h-full object-cover" />
            </button>
          ))}
        </div>

        {/* View All Photos Action Button */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => openLightbox(0)}
            aria-label="View all photos in gallery"
            className="text-xs font-semibold flex items-center gap-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl py-2 px-4 shadow-xs"
          >
            <Maximize2 className="w-4 h-4 text-indigo-500" />
            View All Photos ({totalImages})
          </Button>
        </div>
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-fade-in">
          
          {/* Lightbox Header */}
          <div className="flex items-center justify-between text-white border-b border-slate-800/80 pb-4">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-100 line-clamp-1">{title}</h3>
              <p className="text-xs text-slate-400">
                Image {activeIdx + 1} of {totalImages}
              </p>
            </div>
            <button
              onClick={() => setIsLightboxOpen(false)}
              aria-label="Close Lightbox"
              className="p-2.5 rounded-full bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Lightbox Center Area with Image and Nav Buttons */}
          <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden">
            {/* Prev Button */}
            <button
              onClick={handlePrev}
              aria-label="Previous Image"
              className="absolute left-2 sm:left-6 z-10 p-3 rounded-full bg-slate-900/80 border border-slate-700 text-white hover:bg-indigo-600 hover:border-indigo-500 transition-all duration-200 shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Active Image */}
            <div className="max-w-5xl max-h-[75vh] w-full flex items-center justify-center p-2 relative h-[75vh]">
              <Image
                src={displayImages[activeIdx]}
                alt={`${title} - Full view ${activeIdx + 1}`}
                fill
                className="object-contain rounded-2xl shadow-2xl transition-all duration-300"
              />
            </div>

            {/* Next Button */}
            <button
              onClick={handleNext}
              aria-label="Next Image"
              className="absolute right-2 sm:right-6 z-10 p-3 rounded-full bg-slate-900/80 border border-slate-700 text-white hover:bg-indigo-600 hover:border-indigo-500 transition-all duration-200 shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Lightbox Bottom Strip (Thumbnails) */}
          <div className="flex gap-2 overflow-x-auto justify-center pb-2 max-w-4xl mx-auto scrollbar-none">
            {displayImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIdx(idx)}
                aria-label={`Jump to photo ${idx + 1}`}
                className={`relative rounded-xl overflow-hidden h-14 w-20 shrink-0 border-2 transition-all ${
                  activeIdx === idx
                    ? 'border-indigo-500 ring-2 ring-indigo-500/40 opacity-100'
                    : 'border-slate-800 opacity-40 hover:opacity-80'
                }`}
              >
                <Image src={img} alt={`Lightbox thumb ${idx + 1}`} fill className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )

}
