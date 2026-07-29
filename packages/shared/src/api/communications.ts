import { apiClient } from './client'
import type { PaginatedResponse } from '../types/api'
import type { Property } from '../types/property'
import type {
  Inquiry, CreateInquiryInput,
  PropertyReview, CreateReviewInput, PropertyRatingSummary,
  Conversation, Message, StartConversationInput, SendMessageInput
} from '../types/communications'

class CommunicationsApi {
  // ---------------------------------------------------------------------------
  // FAVORITES
  // ---------------------------------------------------------------------------
  async toggleFavorite(propertyId: string | number): Promise<{ success: boolean; data: { id: number; property: number; is_favorited: boolean } }> {
    const response = await apiClient.post('/communications/favorites/toggle/', { property_id: propertyId })
    return response.data
  }

  async getFavorites(): Promise<{ success: boolean; data: Property[] }> {
    const response = await apiClient.get('/communications/favorites/')
    return response.data
  }

  // ---------------------------------------------------------------------------
  // INQUIRIES
  // ---------------------------------------------------------------------------
  async createInquiry(data: CreateInquiryInput): Promise<{ success: boolean; data: Inquiry }> {
    const response = await apiClient.post('/communications/inquiries/create/', data)
    return response.data
  }

  async getInquiries(type: 'sent' | 'received' = 'sent'): Promise<{ success: boolean; data: Inquiry[] }> {
    const response = await apiClient.get('/communications/inquiries/', { params: { type } })
    return response.data
  }

  async acceptInquiry(inquiryId: string | number): Promise<{ success: boolean; data: Inquiry }> {
    const response = await apiClient.patch(`/communications/inquiries/${inquiryId}/accept/`)
    return response.data
  }

  // ---------------------------------------------------------------------------
  // REVIEWS
  // ---------------------------------------------------------------------------
  async getPropertyReviews(propertyId: string | number): Promise<{ success: boolean; data: { reviews: PropertyReview[], rating_summary: PropertyRatingSummary } }> {
    const response = await apiClient.get('/communications/reviews/', { params: { property_id: propertyId } })
    return response.data
  }

  async createReview(data: CreateReviewInput): Promise<{ success: boolean; data: PropertyReview }> {
    const response = await apiClient.post('/communications/reviews/create/', data)
    return response.data
  }

  // ---------------------------------------------------------------------------
  // MESSAGES
  // ---------------------------------------------------------------------------
  async getConversations(): Promise<{ success: boolean; data: Conversation[] }> {
    const response = await apiClient.get('/communications/messages/')
    return response.data
  }

  async getConversationMessages(convId: string | number): Promise<{ success: boolean; data: Message[] }> {
    const response = await apiClient.get(`/communications/messages/${convId}/`)
    return response.data
  }

  async startConversation(data: StartConversationInput): Promise<{ success: boolean; data: { conversation: Conversation, message: Message } }> {
    const response = await apiClient.post('/communications/messages/start/', data)
    return response.data
  }

  async sendMessage(convId: string | number, data: SendMessageInput): Promise<{ success: boolean; data: Message }> {
    const response = await apiClient.post(`/communications/messages/${convId}/send/`, data)
    return response.data
  }
}

export const communicationsApi = new CommunicationsApi()
