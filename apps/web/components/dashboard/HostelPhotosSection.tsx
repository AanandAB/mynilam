'use client'

import React, { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { hostelPhotosApi, type HostelPhoto, type HostelPhotoCategory } from '@repo/shared'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  UploadCloud,
  Image as ImageIcon,
  Trash2,
  Star,
  CheckCircle2,
  AlertCircle,
  Plus,
  Grid,
  Sparkles,
  Camera,
} from 'lucide-react'

interface HostelPhotosSectionProps {
  propertyId: string | number
}

const CATEGORY_MAP: { id: HostelPhotoCategory; label: string; description: string }[] = [
  { id: 'ENTRANCE', label: 'Hostel Entrance', description: 'Main gate, exterior facade, reception' },
  { id: 'ROOM', label: 'Rooms', description: 'Bedrooms, beds, furniture layout' },
  { id: 'BATHROOM', label: 'Bathrooms', description: 'Attached/common washrooms, hygiene' },
  { id: 'DINING', label: 'Dining Area', description: 'Mess, dining tables, kitchen area' },
  { id: 'COMMON_AREA', label: 'Common Area', description: 'Study hall, TV lounge, balcony, terrace' },
]

export function HostelPhotosSection({ propertyId }: HostelPhotosSectionProps) {
  const queryClient = useQueryClient()
  const coverInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  const [selectedCategory, setSelectedCategory] = useState<HostelPhotoCategory>('COMMON_AREA')
  const [filterCategory, setFilterCategory] = useState<string>('ALL')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [successMessage, setSuccessMessage] = useState<string>('')

  // Query photos
  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['hostelPhotos', propertyId],
    queryFn: () => hostelPhotosApi.getPhotos(propertyId),
    enabled: !!propertyId,
  })

  // Mutations
  const uploadMutation = useMutation({
    mutationFn: ({ files, category, isCover }: { files: File[]; category: HostelPhotoCategory; isCover?: boolean }) =>
      hostelPhotosApi.uploadPhotos(propertyId, files, category, isCover),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['hostelPhotos', propertyId] })
      queryClient.invalidateQueries({ queryKey: ['properties'] })
      queryClient.invalidateQueries({ queryKey: ['hostelConfig', propertyId] })
      setSuccessMessage(variables.isCover ? 'Cover image updated successfully!' : `${data.length} photo(s) uploaded successfully!`)
      setErrorMessage('')
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Failed to upload image(s).')
    },
  })

  const setCoverMutation = useMutation({
    mutationFn: (photoId: string | number) => hostelPhotosApi.setCover(propertyId, photoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostelPhotos', propertyId] })
      queryClient.invalidateQueries({ queryKey: ['properties'] })
      queryClient.invalidateQueries({ queryKey: ['hostelConfig', propertyId] })
      setSuccessMessage('Cover image updated successfully!')
      setErrorMessage('')
    },
    onError: (err: any) => setErrorMessage(err.message || 'Failed to set cover image.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (photoId: string | number) => hostelPhotosApi.deletePhoto(propertyId, photoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostelPhotos', propertyId] })
      queryClient.invalidateQueries({ queryKey: ['properties'] })
      queryClient.invalidateQueries({ queryKey: ['hostelConfig', propertyId] })
      setSuccessMessage('Photo deleted successfully.')
      setErrorMessage('')
    },
    onError: (err: any) => setErrorMessage(err.message || 'Failed to delete photo.'),
  })

  // File validation
  const validateFiles = (fileList: FileList): File[] | null => {
    const filesArray = Array.from(fileList)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp']
    const maxSize = 5 * 1024 * 1024 // 5MB

    for (const f of filesArray) {
      const ext = f.name.substring(f.name.lastIndexOf('.')).toLowerCase()
      if (!allowedTypes.includes(f.type) && !allowedExts.includes(ext)) {
        setErrorMessage(`Invalid file format '${f.name}'. Only JPG, PNG, and WebP are allowed.`)
        return null
      }
      if (f.size > maxSize) {
        setErrorMessage(`File '${f.name}' exceeds maximum size of 5MB.`)
        return null
      }
    }
    return filesArray
  }

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const valid = validateFiles(e.target.files)
    if (valid) {
      uploadMutation.mutate({ files: valid, category: 'COVER', isCover: true })
    }
    e.target.value = ''
  }

  const handleGallerySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const valid = validateFiles(e.target.files)
    if (valid) {
      uploadMutation.mutate({ files: valid, category: selectedCategory, isCover: false })
    }
    e.target.value = ''
  }

  const coverPhoto = photos.find((p) => p.isCover) || photos.find((p) => p.category === 'COVER') || photos[0]

  const filteredPhotos = filterCategory === 'ALL'
    ? photos
    : photos.filter((p) => p.category === filterCategory)

  return (
    <Card className="p-6 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6 rounded-3xl shadow-sm">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-indigo-500" />
            <span>Hostel Photos Management</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Upload, preview, categorize, and manage cover image & photo gallery for public listing.
          </p>
        </div>
        <span className="text-[11px] font-bold px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-full border border-indigo-100 dark:border-indigo-900/50 self-start sm:self-auto">
          {photos.length} Total Photos
        </span>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs font-semibold rounded-2xl flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage('')} className="ml-auto text-xs opacity-75 hover:opacity-100">Dismiss</button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-800 dark:text-red-300 text-xs font-semibold rounded-2xl flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage('')} className="ml-auto text-xs opacity-75 hover:opacity-100">Dismiss</button>
        </div>
      )}

      {/* SECTION 1: COVER IMAGE */}
      <div className="space-y-3 bg-slate-50/70 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              Cover Image
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Primary banner image shown on hostel catalog card & hero header.
            </p>
          </div>
          <div>
            <input
              type="file"
              ref={coverInputRef}
              onChange={handleCoverSelect}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
            />
            <Button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={uploadMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-2 shadow-xs"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{coverPhoto ? 'Change Cover Image' : 'Upload Cover Image'}</span>
            </Button>
          </div>
        </div>

        {coverPhoto ? (
          <div className="relative rounded-2xl overflow-hidden aspect-[21/9] sm:aspect-[24/9] border border-slate-200 dark:border-slate-700 bg-slate-900 group">
            <img
              src={coverPhoto.imageUrl}
              alt="Hostel Cover"
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
            />
            <div className="absolute top-3 left-3 px-3 py-1 bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider rounded-full shadow-md flex items-center gap-1">
              <Star className="w-3 h-3 fill-slate-950 text-slate-950" />
              <span>Current Cover Image</span>
            </div>
          </div>
        ) : (
          <div
            onClick={() => coverInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors cursor-pointer bg-white dark:bg-slate-900/60"
          >
            <ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No Cover Image Set</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Click here to upload your hostel banner image (JPG, PNG, WebP up to 5MB)</p>
          </div>
        )}
      </div>

      {/* SECTION 2: GALLERY UPLOAD & CATEGORY SELECTION */}
      <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Grid className="w-4 h-4 text-indigo-500" />
              <span>Photo Gallery</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">Select category first, then upload multiple gallery images.</p>
          </div>

          <div>
            <input
              type="file"
              ref={galleryInputRef}
              onChange={handleGallerySelect}
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
            />
            <Button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              disabled={uploadMutation.isPending}
              className="bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-2 shadow-xs"
            >
              <Plus className="w-4 h-4 text-indigo-400" />
              <span>+ Upload Photos</span>
            </Button>
          </div>
        </div>

        {/* Category Selector Radio List */}
        <div className="space-y-2">
          <span className="block text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
            Select Category for New Uploads:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {CATEGORY_MAP.map((cat) => {
              const isSelected = selectedCategory === cat.id
              return (
                <label
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`p-3 rounded-2xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-800 dark:text-slate-200'}`}>
                      {cat.label}
                    </span>
                    <input
                      type="radio"
                      name="uploadCategory"
                      checked={isSelected}
                      onChange={() => setSelectedCategory(cat.id)}
                      className="text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
                    {cat.description}
                  </span>
                </label>
              )
            })}
          </div>
        </div>
      </div>

      {/* SECTION 3: PHOTO PREVIEW GRID & CATEGORY FILTER */}
      <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">Filter Preview:</span>
          <button
            type="button"
            onClick={() => setFilterCategory('ALL')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 ${
              filterCategory === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All Photos ({photos.length})
          </button>
          {CATEGORY_MAP.map((cat) => {
            const count = photos.filter((p) => p.category === cat.id).length
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFilterCategory(cat.id)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 ${
                  filterCategory === cat.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat.label} ({count})
              </button>
            )
          })}
        </div>

        {/* Photos Grid */}
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400 animate-pulse">Loading hostel photos...</div>
        ) : filteredPhotos.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
            <ImageIcon className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400">No photos in this category</p>
            <p className="text-[11px] text-slate-400">Use "+ Upload Photos" button above to add images.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredPhotos.map((photo) => {
              const catObj = CATEGORY_MAP.find((c) => c.id === photo.category)
              const catLabel = photo.isCover ? 'Cover Image' : catObj?.label || photo.category

              return (
                <div
                  key={photo.id}
                  className="group relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 shadow-xs hover:shadow-md transition-all flex flex-col"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-950">
                    <img
                      src={photo.imageUrl}
                      alt={catLabel}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Badge */}
                    <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                      {photo.isCover && (
                        <span className="px-2 py-0.5 bg-amber-500 text-slate-950 font-bold text-[10px] rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                          <Star className="w-3 h-3 fill-slate-950" /> Cover
                        </span>
                      )}
                      <span className="px-2.5 py-0.5 bg-slate-950/70 backdrop-blur-md text-white text-[10px] font-bold rounded-full uppercase tracking-wider border border-white/10">
                        {catLabel}
                      </span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    {!photo.isCover ? (
                      <button
                        type="button"
                        onClick={() => setCoverMutation.mutate(photo.id)}
                        disabled={setCoverMutation.isPending}
                        className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors"
                      >
                        <Star className="w-3.5 h-3.5" /> Make Cover
                      </button>
                    ) : (
                      <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" /> Primary Cover
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this photo?')) {
                          deleteMutation.mutate(photo.id)
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-semibold"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Card>
  )
}
