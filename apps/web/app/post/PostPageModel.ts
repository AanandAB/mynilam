'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCreateProperty } from '@/app/hooks/use-properties'
import { useAuth } from '@/app/hooks/use-auth'
import type { CreatePropertyInput, PropertyType, ListingType } from '@repo/shared'

export type Step = 1 | 2 | 3 | 4 | 5
export type FormListingType = 'sale' | 'rent' | 'looking' | 'roommate'

export function usePostPageModel() {
  const router = useRouter()
  const createPropertyMutation = useCreateProperty()
  const { user, isLoading: isAuthLoading } = useAuth()
  const [step, setStep] = useState<Step>(1)
  
  // Form values
  const [listingType, setListingType] = useState<FormListingType>('rent')
  const [propertyType, setPropertyType] = useState<PropertyType | 'roommate' | 'flatshare'>('flat')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [bedrooms, setBedrooms] = useState('')
  const [bathrooms, setBathrooms] = useState('')
  const [areaSqft, setAreaSqft] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [images, setImages] = useState<File[]>([])
  
  // Advanced specs
  const [totalRooms, setTotalRooms] = useState('')
  const [isFurnished, setIsFurnished] = useState(false)
  const [numBeds, setNumBeds] = useState('')
  const [furnitureList, setFurnitureList] = useState<string[]>([])
  const [isUpstairs, setIsUpstairs] = useState(false)
  const [videos, setVideos] = useState<File[]>([])
  const [videoDragActive, setVideoDragActive] = useState(false)

  // Hostel & PG spec states
  const [sharingOccupancy, setSharingOccupancy] = useState<'1' | '2' | '3' | '4' | '5' | '6' | 'dorm'>('1')
  const [foodIncluded, setFoodIncluded] = useState(false)
  const [wifiAvailable, setWifiAvailable] = useState(false)
  const [acAvailable, setAcAvailable] = useState(false)
  const [laundryAvailable, setLaundryAvailable] = useState(false)

  // Utilities and convenience states
  const [waterSource, setWaterSource] = useState('municipal')
  const [powerBackup, setPowerBackup] = useState('none')
  const [parking, setParking] = useState('none')
  const [gatedCommunity, setGatedCommunity] = useState(false)
  const [securityFeatures, setSecurityFeatures] = useState<string[]>([])
  const [preferredTenant, setPreferredTenant] = useState('any')
  const [preferredGender, setPreferredGender] = useState<'any' | 'male' | 'female'>('any')
  
  // Drag and drop state
  const [dragActive, setDragActive] = useState(false)

  // Route protection
  useEffect(() => {
    if (!isAuthLoading) {
      if (!user) {
        router.push('/login')
      } else if (user.role === 'guest' || user.role === 'hostel_admin') {
        router.push('/dashboard')
      }
    }
  }, [user, isAuthLoading, router])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFiles = Array.from(e.dataTransfer.files)
      setImages(prev => [...prev, ...droppedFiles])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFiles = Array.from(e.target.files)
      setImages(prev => [...prev, ...selectedFiles])
    }
  }

  const handleAdSubmit = async () => {
    try {
      const mappedPropertyType = (propertyType === 'roommate' || propertyType === 'flatshare') 
        ? 'flat' 
        : propertyType as PropertyType

      const inputData: CreatePropertyInput = {
        title,
        description: description || undefined,
        price: Number(price),
        property_type: mappedPropertyType,
        listing_type: listingType === 'looking' ? 'rent' : listingType as ListingType,
        bedrooms: bedrooms ? Number(bedrooms) : undefined,
        bathrooms: bathrooms ? Number(bathrooms) : undefined,
        area_sqft: areaSqft ? Number(areaSqft) : undefined,
        address,
        city,
        state,
        zip_code: zipCode || undefined,
        images,
        videos: videos.length > 0 ? videos : undefined,
        total_rooms: totalRooms ? Number(totalRooms) : undefined,
        is_furnished: isFurnished,
        furniture_list: isFurnished ? furnitureList : undefined,
        num_beds: isFurnished && numBeds ? Number(numBeds) : undefined,
        is_upstairs: propertyType === 'house' ? isUpstairs : undefined,
        water_source: waterSource,
        power_backup: powerBackup,
        parking: parking === 'none' ? undefined : parking,
        gated_community: gatedCommunity,
        security_features: gatedCommunity ? securityFeatures : undefined,
        preferred_tenant: listingType === 'rent' ? preferredTenant : undefined,
        preferred_gender: (listingType === 'roommate' || listingType === 'rent') ? preferredGender : undefined,
        sharing_occupancy: (mappedPropertyType === 'hostel' || mappedPropertyType === 'pg') ? sharingOccupancy : undefined,
        food_included: (mappedPropertyType === 'hostel' || mappedPropertyType === 'pg') ? foodIncluded : undefined,
        wifi_available: (mappedPropertyType === 'hostel' || mappedPropertyType === 'pg') ? wifiAvailable : undefined,
        ac_available: (mappedPropertyType === 'hostel' || mappedPropertyType === 'pg') ? acAvailable : undefined,
        laundry_available: (mappedPropertyType === 'hostel' || mappedPropertyType === 'pg') ? laundryAvailable : undefined,
      }

      await createPropertyMutation.mutateAsync(inputData)
      setStep(5)
    } catch (err) {
      console.error(err)
      alert('Failed to post ad. Please try again.')
    }
  }

  return {
    step,
    setStep,
    listingType,
    setListingType,
    propertyType,
    setPropertyType,
    title,
    setTitle,
    description,
    setDescription,
    price,
    setPrice,
    bedrooms,
    setBedrooms,
    bathrooms,
    setBathrooms,
    areaSqft,
    setAreaSqft,
    address,
    setAddress,
    city,
    setCity,
    state,
    setState,
    zipCode,
    setZipCode,
    images,
    setImages,
    totalRooms,
    setTotalRooms,
    isFurnished,
    setIsFurnished,
    numBeds,
    setNumBeds,
    furnitureList,
    setFurnitureList,
    isUpstairs,
    setIsUpstairs,
    videos,
    setVideos,
    videoDragActive,
    setVideoDragActive,
    waterSource,
    setWaterSource,
    powerBackup,
    setPowerBackup,
    parking,
    setParking,
    gatedCommunity,
    setGatedCommunity,
    securityFeatures,
    setSecurityFeatures,
    preferredTenant,
    setPreferredTenant,
    preferredGender,
    setPreferredGender,
    dragActive,
    setDragActive,
    sharingOccupancy,
    setSharingOccupancy,
    foodIncluded,
    setFoodIncluded,
    wifiAvailable,
    setWifiAvailable,
    acAvailable,
    setAcAvailable,
    laundryAvailable,
    setLaundryAvailable,
    handleDrag,
    handleDrop,
    handleFileChange,
    handleAdSubmit,
    isPending: createPropertyMutation.isPending,
    user,
    isAuthLoading,
    router
  }
}
