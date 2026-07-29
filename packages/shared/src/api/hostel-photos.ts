import { apiClient, USE_MOCK } from './client'
import type { HostelPhoto, HostelPhotoCategory } from '../types/property'
import { delay } from './mock-data'

const MOCK_INITIAL_PHOTOS: Record<string, HostelPhoto[]> = {
  default: [
    {
      id: 'hp-1',
      hostelId: '1',
      imageUrl: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=1000',
      category: 'COVER',
      isCover: true,
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
    {
      id: 'hp-2',
      hostelId: '1',
      imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800',
      category: 'ENTRANCE',
      isCover: false,
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    },
    {
      id: 'hp-3',
      hostelId: '1',
      imageUrl: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800',
      category: 'ROOM',
      isCover: false,
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: 'hp-4',
      hostelId: '1',
      imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800',
      category: 'BATHROOM',
      isCover: false,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: 'hp-5',
      hostelId: '1',
      imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
      category: 'DINING',
      isCover: false,
      createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
    {
      id: 'hp-6',
      hostelId: '1',
      imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800',
      category: 'COMMON_AREA',
      isCover: false,
      createdAt: new Date().toISOString(),
    },
  ],
}

function getStoredMockPhotos(propertyId: string | number): HostelPhoto[] {
  if (typeof window === 'undefined') return MOCK_INITIAL_PHOTOS.default
  const key = `mock_hostel_photos_${propertyId}`
  const saved = localStorage.getItem(key)
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch {
      // fallback
    }
  }
  localStorage.setItem(key, JSON.stringify(MOCK_INITIAL_PHOTOS.default))
  return MOCK_INITIAL_PHOTOS.default
}

function saveStoredMockPhotos(propertyId: string | number, photos: HostelPhoto[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`mock_hostel_photos_${propertyId}`, JSON.stringify(photos))
  }
}

class HostelPhotosApi {
  async getPhotos(propertyId: string | number): Promise<HostelPhoto[]> {
    if (USE_MOCK) {
      await delay(300)
      return getStoredMockPhotos(propertyId)
    }
    const response = await apiClient.get(`/properties/${propertyId}/hostel-photos/`)
    return response.data.data
  }

  async uploadPhotos(
    propertyId: string | number,
    files: File[],
    category: HostelPhotoCategory = 'COMMON_AREA',
    isCover: boolean = false
  ): Promise<HostelPhoto[]> {
    if (USE_MOCK) {
      await delay(600)
      const current = getStoredMockPhotos(propertyId)
      let updated = [...current]

      if (isCover || category === 'COVER') {
        updated = updated.map((p) => ({ ...p, isCover: false }))
      }

      const newPhotos: HostelPhoto[] = files.map((file, idx) => {
        const id = `hp-${Date.now()}-${idx}`
        const objectUrl = URL.createObjectURL(file)
        const isThisCover = (isCover || category === 'COVER') && idx === 0
        return {
          id,
          hostelId: propertyId,
          imageUrl: objectUrl,
          category: isThisCover ? 'COVER' : category,
          isCover: isThisCover,
          createdAt: new Date().toISOString(),
        }
      })

      const finalPhotos = [...newPhotos, ...updated]
      saveStoredMockPhotos(propertyId, finalPhotos)
      return newPhotos
    }

    const formData = new FormData()
    files.forEach((file) => formData.append('images', file))
    formData.append('category', category)
    if (isCover) formData.append('is_cover', 'true')

    const response = await apiClient.post(`/properties/${propertyId}/hostel-photos/upload/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data.data
  }

  async setCover(propertyId: string | number, photoId: string | number): Promise<HostelPhoto> {
    if (USE_MOCK) {
      await delay(300)
      const photos = getStoredMockPhotos(propertyId)
      let updatedPhoto: HostelPhoto | null = null
      const updated = photos.map((p) => {
        if (String(p.id) === String(photoId)) {
          updatedPhoto = { ...p, isCover: true, category: 'COVER' as HostelPhotoCategory }
          return updatedPhoto
        }
        return { ...p, isCover: false }
      })
      saveStoredMockPhotos(propertyId, updated)
      if (!updatedPhoto) throw new Error('Photo not found')
      return updatedPhoto
    }

    const response = await apiClient.put(`/properties/${propertyId}/hostel-photos/${photoId}/set-cover/`)
    return response.data.data
  }

  async deletePhoto(propertyId: string | number, photoId: string | number): Promise<void> {
    if (USE_MOCK) {
      await delay(300)
      const photos = getStoredMockPhotos(propertyId)
      const updated = photos.filter((p) => String(p.id) !== String(photoId))
      saveStoredMockPhotos(propertyId, updated)
      return
    }

    await apiClient.delete(`/properties/${propertyId}/hostel-photos/${photoId}/`)
  }
}

export const hostelPhotosApi = new HostelPhotosApi()
