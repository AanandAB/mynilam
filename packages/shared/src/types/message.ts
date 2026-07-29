import { Property } from './property'
import { User } from './user'
export interface Message {
  id: string
  content: string
  sender_id: string
  sender?: User
  recipient_id: string
  recipient?: User
  property_id?: string
  property?: Property
  is_read: boolean
  created_at: string
}

export interface CreateMessageInput {
  content: string
  recipient_id: string
  property_id?: string
}