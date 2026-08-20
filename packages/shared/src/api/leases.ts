/**
 * Leases API client — thin wrapper over `apiClient` (axios).
 * Each method returns the raw backend envelope: `{ success, data, message }`.
 */
import { apiClient } from './client'
import type {
  LeaseApplication,
  LeaseContract,
  LeasePayment,
  LeaseInvoice,
  CreateLeaseApplicationInput,
  UpdateLeaseApplicationStatusInput,
  CreateLeaseContractInput,
  UpdateLeaseContractStatusInput,
  CreateLeasePaymentInput,
  UpdateLeasePaymentStatusInput,
  CreateLeaseInvoiceInput,
} from '../types/leases'

interface Envelope<T> {
  success: boolean
  data: T
  message?: string
}

class LeasesApi {
  // -------------------------------------------------------------------------
  // Applications
  // -------------------------------------------------------------------------
  async getApplications(type: 'sent' | 'received' = 'sent'): Promise<Envelope<LeaseApplication[]>> {
    const response = await apiClient.get('/leases/applications/', { params: { type } })
    return response.data
  }

  async createApplication(data: CreateLeaseApplicationInput): Promise<Envelope<LeaseApplication>> {
    const response = await apiClient.post('/leases/applications/create/', data)
    return response.data
  }

  async getApplication(id: string | number): Promise<Envelope<LeaseApplication>> {
    const response = await apiClient.get(`/leases/applications/${id}/`)
    return response.data
  }

  async updateApplicationStatus(
    id: string | number,
    data: UpdateLeaseApplicationStatusInput,
  ): Promise<Envelope<LeaseApplication>> {
    const response = await apiClient.patch(`/leases/applications/${id}/status/`, data)
    return response.data
  }

  // -------------------------------------------------------------------------
  // Contracts
  // -------------------------------------------------------------------------
  async getContracts(): Promise<Envelope<LeaseContract[]>> {
    const response = await apiClient.get('/leases/contracts/')
    return response.data
  }

  async createContract(data: CreateLeaseContractInput): Promise<Envelope<LeaseContract>> {
    const response = await apiClient.post('/leases/contracts/create/', data)
    return response.data
  }

  async getContract(id: string | number): Promise<Envelope<LeaseContract>> {
    const response = await apiClient.get(`/leases/contracts/${id}/`)
    return response.data
  }

  async updateContractStatus(
    id: string | number,
    data: UpdateLeaseContractStatusInput,
  ): Promise<Envelope<LeaseContract>> {
    const response = await apiClient.patch(`/leases/contracts/${id}/status/`, data)
    return response.data
  }

  // -------------------------------------------------------------------------
  // Payments
  // -------------------------------------------------------------------------
  async getPayments(): Promise<Envelope<LeasePayment[]>> {
    const response = await apiClient.get('/leases/payments/')
    return response.data
  }

  async createPayment(data: CreateLeasePaymentInput): Promise<Envelope<LeasePayment>> {
    const response = await apiClient.post('/leases/payments/create/', data)
    return response.data
  }

  async updatePaymentStatus(
    id: string | number,
    data: UpdateLeasePaymentStatusInput,
  ): Promise<Envelope<LeasePayment>> {
    const response = await apiClient.patch(`/leases/payments/${id}/status/`, data)
    return response.data
  }

  // -------------------------------------------------------------------------
  // Invoices
  // -------------------------------------------------------------------------
  async getInvoices(): Promise<Envelope<LeaseInvoice[]>> {
    const response = await apiClient.get('/leases/invoices/')
    return response.data
  }

  async createInvoice(data: CreateLeaseInvoiceInput): Promise<Envelope<LeaseInvoice>> {
    const response = await apiClient.post('/leases/invoices/create/', data)
    return response.data
  }

  async getInvoice(id: string | number): Promise<Envelope<LeaseInvoice>> {
    const response = await apiClient.get(`/leases/invoices/${id}/`)
    return response.data
  }
}

export const leasesApi = new LeasesApi()
