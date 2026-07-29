import { apiClient } from './client'

export interface HostelBed {
  id: string
  bed_name: string
  bed_status: 'Vacant' | 'Occupied' | 'Reserved' | 'Maintenance'
  assigned_tenant?: {
    id: string
    name: string
    email: string
  } | null
  check_in_date?: string | null
  check_out_date?: string | null
}

export interface HostelRoom {
  id: string
  room_number: string
  floor_number: number
  sharing_type: string
  monthly_rate: number | null
  is_ac: boolean
  has_attached_bathroom: boolean
  notes: string
  total_beds: number
  vacant_beds: number
  occupied_beds: number
  beds: HostelBed[]
}

export interface CreateRoomInput {
  room_number: string
  floor_number: number
  sharing_type: string
  monthly_rate?: number
  is_ac?: boolean
  has_attached_bathroom?: boolean
}

export const hostelRoomsApi = {
  async getRooms(propertyId: number | string): Promise<HostelRoom[]> {
    const res = await apiClient.get<any>(`/properties/${propertyId}/rooms/`)
    const resData = res.data
    if (Array.isArray(resData)) return resData
    if (Array.isArray(resData?.data)) return resData.data
    return []
  },

  async createRoom(propertyId: number | string, input: CreateRoomInput): Promise<HostelRoom> {
    const res = await apiClient.post<any>(`/properties/${propertyId}/rooms/`, input)
    return res.data?.data || res.data
  },

  async updateBed(bedId: number | string, data: { bed_status?: string; tenant_id?: string }): Promise<HostelBed> {
    const res = await apiClient.patch<any>(`/properties/beds/${bedId}/`, data)
    return res.data?.data || res.data
  },

  async updateRoom(roomId: string, input: Partial<CreateRoomInput>): Promise<HostelRoom> {
    const res = await apiClient.patch<any>(`/properties/rooms/${roomId}/`, input)
    return res.data?.data || res.data
  },

  async deleteRoom(roomId: string): Promise<void> {
    await apiClient.delete(`/properties/rooms/${roomId}/`)
  }
}
