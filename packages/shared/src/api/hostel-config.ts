import { apiClient } from './client'
import type { HostelConfig, UpdateHostelConfigInput } from '../types/communications'

class HostelConfigApi {
  async getConfig(propertyId: string | number): Promise<{ success: boolean; data: HostelConfig }> {
    const response = await apiClient.get(`/properties/${propertyId}/hostel-config/`)
    return response.data
  }

  async updateConfig(propertyId: string | number, data: UpdateHostelConfigInput): Promise<{ success: boolean; data: HostelConfig }> {
    const response = await apiClient.put(`/properties/${propertyId}/hostel-config/update/`, data)
    return response.data
  }
}

export const hostelConfigApi = new HostelConfigApi()
