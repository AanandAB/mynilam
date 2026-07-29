import { apiClient } from './client'

class GeoApi {
    async searchCities(query: string): Promise<string[]> {
        if (!query.trim()) return []
        const response = await apiClient.get('/geo/cities/autocomplete/', { params: { q: query } })
        return response.data.data
    }
}

export const geoApi = new GeoApi()
