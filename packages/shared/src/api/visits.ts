import { apiClient } from './client'
import type { PropertyVisit, RequestVisitInput, UpdateVisitStatusInput } from '../types/communications'

class VisitsApi {
  async getVisits(role: 'visitor' | 'owner' = 'visitor'): Promise<{ success: boolean; data: PropertyVisit[] }> {
    const response = await apiClient.get('/properties/visits/', { params: { role } })
    return response.data
  }

  async requestVisit(data: RequestVisitInput): Promise<{ success: boolean; data: PropertyVisit }> {
    const response = await apiClient.post('/properties/visits/request/', data)
    return response.data
  }

  async updateVisitStatus(visitId: string | number, data: UpdateVisitStatusInput): Promise<{ success: boolean; data: PropertyVisit }> {
    const response = await apiClient.patch(`/properties/visits/${visitId}/status/`, data)
    return response.data
  }
}

export const visitsApi = new VisitsApi()
