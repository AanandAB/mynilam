import { apiClient, USE_MOCK } from './client'
import type { Property, CreatePropertyInput } from '../types/property'
import type { PaginatedResponse } from '../types/api'
import { mockProperties, delay, saveMockPropertiesToStorage } from './mock-data'

export interface PropertyFilters {
    page?: number
    page_size?: number
    city?: string
    state?: string
    min_price?: number
    max_price?: number
    property_type?: string
    listing_type?: string
    bedrooms?: number
    bathrooms?: number
    search?: string
    preferred_gender?: string
    sharing_occupancy?: string
    food_included?: boolean
    wifi_available?: boolean
    ac_available?: boolean
    laundry_available?: boolean
    user_id?: string
    is_published?: boolean
}

class PropertiesApi {
    async getProperties(filters: PropertyFilters = {}): Promise<PaginatedResponse<Property>> {
        // If using mock data
        if (USE_MOCK) {
            await delay(500) // Simulate network delay

            let filtered = [...mockProperties]

            // Apply filters
            if (filters.city) {
                filtered = filtered.filter(p =>
                    p.city.toLowerCase().includes(filters.city!.toLowerCase())
                )
            }
            if (filters.state) {
                filtered = filtered.filter(p =>
                    p.state.toLowerCase().includes(filters.state!.toLowerCase())
                )
            }
            if (filters.min_price) {
                filtered = filtered.filter(p => p.price >= filters.min_price!)
            }
            if (filters.max_price) {
                filtered = filtered.filter(p => p.price <= filters.max_price!)
            }
            if (filters.property_type) {
                filtered = filtered.filter(p => p.property_type === filters.property_type)
            }
            if (filters.listing_type) {
                filtered = filtered.filter(p => p.listing_type === filters.listing_type)
            }
            if (filters.bedrooms) {
                filtered = filtered.filter(p => p.bedrooms === filters.bedrooms)
            }
            if (filters.preferred_gender && filters.preferred_gender !== 'any') {
                filtered = filtered.filter(p => p.preferred_gender === filters.preferred_gender || p.preferred_gender === 'any' || !p.preferred_gender)
            }
            if (filters.sharing_occupancy) {
                filtered = filtered.filter(p => p.sharing_occupancy === filters.sharing_occupancy)
            }
            if (filters.food_included) {
                filtered = filtered.filter(p => p.food_included === true)
            }
            if (filters.wifi_available) {
                filtered = filtered.filter(p => p.wifi_available === true)
            }
            if (filters.ac_available) {
                filtered = filtered.filter(p => p.ac_available === true)
            }
            if (filters.laundry_available) {
                filtered = filtered.filter(p => p.laundry_available === true)
            }
            if (filters.search) {
                const search = filters.search.toLowerCase()
                filtered = filtered.filter(p =>
                    p.title.toLowerCase().includes(search) ||
                    p.description?.toLowerCase().includes(search) ||
                    p.city.toLowerCase().includes(search)
                )
            }

            // Pagination
            const page = filters.page || 1
            const pageSize = filters.page_size || 10
            const start = (page - 1) * pageSize
            const end = start + pageSize
            const paginatedResults = filtered.slice(start, end)

            return {
                results: paginatedResults,
                count: filtered.length,
                next: end < filtered.length ? `/properties/?page=${page + 1}` : null,
                previous: page > 1 ? `/properties/?page=${page - 1}` : null,
            }
        }

        // Real API call
        const response = await apiClient.get('/properties/', { params: filters })
        const payload = response.data
        return {
            results: payload.data || [],
            count: payload.pagination?.total || (payload.data?.length ?? 0),
            next: payload.pagination?.hasNext ? `/properties/?page=${(filters.page || 1) + 1}` : null,
            previous: payload.pagination?.hasPrevious ? `/properties/?page=${(filters.page || 1) - 1}` : null,
        }
    }

    async getProperty(id: string): Promise<Property> {
        // If using mock data
        if (USE_MOCK) {
            await delay(300)
            const property = mockProperties.find(p => p.id === id)
            if (!property) {
                throw new Error('Property not found')
            }
            return property
        }

        // Real API call
        const response = await apiClient.get(`/properties/${id}/`)
        return response.data.data
    }

    async getPropertyLocation(id: string): Promise<{ latitude: number | null, longitude: number | null, address_line_1: string, google_maps_url: string | null }> {
        if (USE_MOCK) {
            await delay(300)
            const property = mockProperties.find(p => p.id === id)
            if (!property) throw new Error('Property not found')
            return {
                latitude: property.latitude,
                longitude: property.longitude,
                address_line_1: property.address,
                google_maps_url: `https://www.google.com/maps/search/?api=1&query=${property.latitude},${property.longitude}`
            }
        }
        
        const response = await apiClient.get(`/properties/${id}/location/`)
        return response.data.data
    }

    async createProperty(data: CreatePropertyInput): Promise<Property> {
        // If using mock data
        if (USE_MOCK) {
            await delay(800)

            const newProperty: Property = {
                id: String(Date.now()),
                title: data.title,
                description: data.description || null,
                price: data.price,
                property_type: data.property_type,
                listing_type: data.listing_type,
                bedrooms: data.bedrooms || null,
                bathrooms: data.bathrooms || null,
                area_sqft: data.area_sqft || null,
                address: data.address,
                city: data.city,
                state: data.state,
                zip_code: data.zip_code || null,
                latitude: data.latitude || null,
                longitude: data.longitude || null,
                images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500'], // Mock image
                videos: data.videos ? data.videos.map((_, i) => `mock-video-${i}.mp4`) : null,
                status: 'published',
                is_published: true,
                user_id: 'normal_user',
                user: {
                    id: 'normal_user',
                    email: 'normal@rentel.com',
                    full_name: 'Normal User',
                    role: 'normal',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                },
                total_rooms: data.total_rooms || null,
                is_furnished: data.is_furnished || null,
                furniture_list: data.furniture_list || null,
                num_beds: data.num_beds || null,
                is_upstairs: data.is_upstairs || null,
                water_source: data.water_source || null,
                power_backup: data.power_backup || null,
                parking: data.parking || null,
                gated_community: data.gated_community || null,
                security_features: data.security_features || null,
                preferred_tenant: data.preferred_tenant || null,
                preferred_gender: data.preferred_gender || null,
                sharing_occupancy: data.sharing_occupancy || null,
                food_included: data.food_included || null,
                wifi_available: data.wifi_available || null,
                ac_available: data.ac_available || null,
                laundry_available: data.laundry_available || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }

            // Add to mock list (for demo purposes)
            mockProperties.unshift(newProperty)
            saveMockPropertiesToStorage()

            return newProperty
        }

        // Real API call
        const formData = new FormData()
        Object.entries(data).forEach(([key, value]) => {
            if (key === 'images' && Array.isArray(value)) {
                value.forEach((file: File) => {
                    formData.append('images', file)
                })
            } else if (value !== undefined && value !== null) {
                formData.append(key, String(value))
            }
        })

        const response = await apiClient.post('/properties/post-ads/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
        return response.data.data
    }

    async updateProperty(id: string, data: Partial<CreatePropertyInput>): Promise<Property> {
        // If using mock data
        if (USE_MOCK) {
            await delay(500)
            const index = mockProperties.findIndex(p => p.id === id)
            if (index === -1) {
                throw new Error('Property not found')
            }
            const updated: Property = {
                ...mockProperties[index],
                ...data,
                images: data.images
                    ? data.images.map((_, i) => `https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500&id=${i}`)
                    : mockProperties[index].images,
                videos: data.videos
                    ? data.videos.map((_, i) => `mock-video-${i}.mp4`)
                    : mockProperties[index].videos,
                updated_at: new Date().toISOString(),
            }
            mockProperties[index] = updated
            saveMockPropertiesToStorage()
            return updated
        }

        // Real API call
        const response = await apiClient.put(`/properties/${id}/`, data)
        return response.data.data
    }

    async deleteProperty(id: string): Promise<void> {
        // If using mock data
        if (USE_MOCK) {
            await delay(500)
            const index = mockProperties.findIndex(p => p.id === id)
            if (index !== -1) {
                mockProperties.splice(index, 1)
                saveMockPropertiesToStorage()
            }
            return
        }

        // Real API call
        await apiClient.delete(`/properties/${id}/`)
    }

    async getPropertiesNearby(lat: number, lng: number, radius: number = 10): Promise<Property[]> {
        // If using mock data
        if (USE_MOCK) {
            await delay(300)
            // Simple distance filter (mock)
            return mockProperties.filter(p =>
                p.latitude && p.longitude &&
                Math.abs(p.latitude - lat) < 0.1 &&
                Math.abs(p.longitude - lng) < 0.1
            )
        }

        // Real API call
        const response = await apiClient.get('/properties/nearby/', {
            params: { lat, lng, radius }
        })
        return response.data.data
    }

    async getFeaturedProperties(limit: number = 10): Promise<Property[]> {
        // If using mock data
        if (USE_MOCK) {
            await delay(300)
            return mockProperties.slice(0, limit)
        }

        // Real API call
        const response = await apiClient.get('/properties/featured/', {
            params: { limit }
        })
        return response.data.data
    }

    // ---------------------------------------------------------------------------
    // DASHBOARD & EMPLOYEE METHODS
    // ---------------------------------------------------------------------------
    async getUserProperties(): Promise<Property[]> {
        if (USE_MOCK) {
            await delay(300)
            const email = typeof window !== 'undefined' ? localStorage.getItem('currentUserEmail') : null
            return mockProperties.filter(p => p.user?.email === email)
        }
        
        const response = await apiClient.get('/properties/', { params: { user_id: 'me', page_size: 100 } })
        return response.data.data
    }

    async getUnverifiedProperties(): Promise<Property[]> {
        if (USE_MOCK) {
            await delay(300)
            return mockProperties.filter(p => !p.is_published)
        }
        
        const response = await apiClient.get('/properties/', { params: { is_published: 'false', page_size: 100 } })
        return response.data.data
    }

    async verifyProperty(id: string): Promise<Property> {
        if (USE_MOCK) {
            await delay(500)
            const index = mockProperties.findIndex(p => p.id === id)
            if (index === -1) throw new Error('Property not found')
            
            const updated = { ...mockProperties[index], is_published: true, status: 'published' as const }
            mockProperties[index] = updated as Property
            saveMockPropertiesToStorage()
            return updated as Property
        }
        
        const response = await apiClient.patch(`/properties/${id}/verify/`)
        return response.data.data
    }

    // ---------------------------------------------------------------------------
    // HOSTEL CONFIG METHODS
    // ---------------------------------------------------------------------------
    async getHostelConfig(propertyId: string): Promise<any> {
        if (USE_MOCK) {
            await delay(300)
            const saved = typeof window !== 'undefined' ? localStorage.getItem('mock_hostel_admin_config') : null
            return saved ? JSON.parse(saved) : null
        }
        
        const response = await apiClient.get(`/properties/${propertyId}/hostel-config/`)
        return response.data.data
    }

    async updateHostelConfig(propertyId: string, data: any): Promise<any> {
        if (USE_MOCK) {
            await delay(500)
            if (typeof window !== 'undefined') {
                localStorage.setItem('mock_hostel_admin_config', JSON.stringify(data))
            }
            return data
        }
        
        const response = await apiClient.put(`/properties/${propertyId}/hostel-config/update/`, data)
        return response.data.data
    }

    async getHostelList(): Promise<any[]> {
        if (USE_MOCK) {
            await delay(300)
            return [] // Mock empty list or some dummy data
        }
        
        const response = await apiClient.get('/properties/hostels/')
        return response.data.data
    }

    async createHostelAdmin(data: { hostel_name: string; email: string; first_name: string; last_name: string }): Promise<any> {
        if (USE_MOCK) {
            await delay(500)
            return {
                message: 'Hostel and admin created successfully.',
                hostel_id: 999,
                admin_credentials: {
                    email: data.email,
                    password: 'MockPassword123!'
                }
            }
        }
        
        const response = await apiClient.post(`/properties/hostels/`, data)
        return response.data
    }
}

export const propertiesApi = new PropertiesApi()