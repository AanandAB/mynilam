/**
 * Maintenance API client — thin wrapper over `apiClient` (axios).
 * Each method returns the raw backend envelope: `{ success, data, message }`.
 */
import { apiClient } from './client'
import type {
  MaintenanceCategory,
  MaintenanceRequest,
  CreateMaintenanceRequestInput,
  UpdateMaintenanceRequestStatusInput,
} from '../types/maintenance'

interface Envelope<T> {
  success: boolean
  data: T
  message?: string
}

class MaintenanceApi {
  async getCategories(): Promise<Envelope<MaintenanceCategory[]>> {
    const response = await apiClient.get('/maintenance/categories/')
    return response.data
  }

  async getRequests(type: 'reported' | 'received' = 'reported'): Promise<Envelope<MaintenanceRequest[]>> {
    const response = await apiClient.get('/maintenance/requests/', { params: { type } })
    return response.data
  }

  async createRequest(data: CreateMaintenanceRequestInput): Promise<Envelope<MaintenanceRequest>> {
    const response = await apiClient.post('/maintenance/requests/create/', data)
    return response.data
  }

  async getRequest(id: string | number): Promise<Envelope<MaintenanceRequest>> {
    const response = await apiClient.get(`/maintenance/requests/${id}/`)
    return response.data
  }

  async updateRequestStatus(
    id: string | number,
    data: UpdateMaintenanceRequestStatusInput,
  ): Promise<Envelope<MaintenanceRequest>> {
    const response = await apiClient.patch(`/maintenance/requests/${id}/status/`, data)
    return response.data
  }
}

export const maintenanceApi = new MaintenanceApi()
