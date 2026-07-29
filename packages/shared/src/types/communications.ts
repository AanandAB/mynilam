import type { User } from './user'
import type { Property } from './property'

// -----------------------------------------------------------------------------
// INQUIRIES
// -----------------------------------------------------------------------------
export type InquiryStatus = 'pending' | 'responded' | 'accepted' | 'closed'

export interface Inquiry {
  id: number
  property: Property
  sender: User
  recipient: User
  message: string
  phone_number?: string
  status: InquiryStatus
  created_at: string
  updated_at: string
}

export interface CreateInquiryInput {
  property_id: number | string
  message: string
  phone_number?: string
}

// -----------------------------------------------------------------------------
// REVIEWS
// -----------------------------------------------------------------------------
export interface PropertyReview {
  id: number
  property: number | string
  reviewer: User
  overall_rating: number
  accuracy_rating?: number
  communication_rating?: number
  cleanliness_rating?: number
  location_rating?: number
  value_rating?: number
  title?: string
  body: string
  is_published: boolean
  is_flagged: boolean
  created_at: string
  updated_at: string
}

export interface CreateReviewInput {
  property_id: number | string
  overall_rating: number
  accuracy_rating?: number
  communication_rating?: number
  cleanliness_rating?: number
  location_rating?: number
  value_rating?: number
  title?: string
  body: string
}

export interface PropertyRatingSummary {
  property_id: number | string
  average_rating: number
  total_reviews: number
  rating_distribution: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
}

// -----------------------------------------------------------------------------
// MESSAGES (Replaces existing message.ts)
// -----------------------------------------------------------------------------
export interface Conversation {
  id: number
  property?: Property
  other_user: User
  last_message_preview?: string
  last_message_at?: string
  unread_count: number
  created_at: string
  updated_at: string
}

export interface Message {
  id: number
  conversation: number
  sender: User
  body: string
  is_read: boolean
  created_at: string
}

export interface StartConversationInput {
  property_id: number | string
  recipient_id: number | string
  message: string
}

export interface SendMessageInput {
  body: string
}

// -----------------------------------------------------------------------------
// VISITS
// -----------------------------------------------------------------------------
export type VisitStatus = 'requested' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'

export interface PropertyVisit {
  id: number
  property: Property
  visitor: User
  visit_date: string // YYYY-MM-DD
  visit_time: string // HH:MM
  status: VisitStatus
  visitor_notes?: string
  owner_notes?: string
  created_at: string
  updated_at: string
}

export interface RequestVisitInput {
  property_id: number | string
  visit_date: string
  visit_time: string
  visitor_notes?: string
}

export interface UpdateVisitStatusInput {
  status: VisitStatus
  notes?: string
}

// -----------------------------------------------------------------------------
// HOSTEL CONFIG
// -----------------------------------------------------------------------------
export interface HostelConfig {
  id?: number | string
  hostelName?: string
  totalBedSpaces?: number
  totalRooms?: number
  bathroomCount?: number
  attachedBathrooms?: boolean
  genderType?: 'boys' | 'girls' | 'unisex'
  sharings?: string[]
  wifiEnabled?: boolean
  wifiSpeed?: string
  hotWater?: boolean
  waterFilter?: boolean
  messFood?: boolean
  laundryEnabled?: boolean
  acAvailable?: boolean
  waterSource?: string
  vacantBeds?: number
  vacantRooms?: number
  vacantSharings?: string[]
  priceMonthly?: number
  hostelPricing?: any[]
  landmark?: string
  streetAddress?: string
  address?: string
  city?: string
  state?: string
  area?: string
  zipCode?: string
  latitude?: number
  longitude?: number
  description?: string
  parking?: string
  preferredTenant?: string
  isUpstairs?: boolean
}

export interface UpdateHostelConfigInput extends HostelConfig {}
