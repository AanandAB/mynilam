import { User } from './user';

export type PropertyType = 'house' | 'flat' | 'plot' | 'commercial' | 'hostel' | 'pg';
export type ListingType = 'sale' | 'rent' | 'roommate';
export type PropertyStatus = 'draft' | 'pending' | 'published' | 'rejected';

export interface Property {
  id: string
  title: string
  description: string | null
  price: number
  property_type: PropertyType
  listing_type: ListingType
  bedrooms: number | null
  bathrooms: number | null
  area_sqft: number | null
  address: string
  city: string
  state: string
  zip_code: string | null
  latitude: number | null
  longitude: number | null
  images: string[]
  videos?: string[] | null
  status: PropertyStatus
  is_published: boolean
  user_id: string
  user?: User
  total_rooms?: number | null
  is_furnished?: boolean | null
  furniture_list?: string[] | null
  num_beds?: number | null
  is_upstairs?: boolean | null
  water_source?: string | null
  power_backup?: string | null
  parking?: string | null
  gated_community?: boolean | null
  security_features?: string[] | null
  preferred_tenant?: string | null
  preferred_gender?: 'any' | 'male' | 'female' | null
  sharing_occupancy?: '1' | '2' | '3' | '4' | '5' | '6' | 'dorm' | null
  food_included?: boolean | null
  wifi_available?: boolean | null
  ac_available?: boolean | null
  laundry_available?: boolean | null
  created_at: string
  updated_at: string
}

export interface CreatePropertyInput {
  title: string
  description?: string
  price: number
  property_type: PropertyType
  listing_type: ListingType
  bedrooms?: number
  bathrooms?: number
  area_sqft?: number
  address: string
  city: string
  state: string
  zip_code?: string
  latitude?: number
  longitude?: number
  images: File[]
  videos?: File[]
  total_rooms?: number
  is_furnished?: boolean
  furniture_list?: string[]
  num_beds?: number
  is_upstairs?: boolean
  water_source?: string
  power_backup?: string
  parking?: string
  gated_community?: boolean
  security_features?: string[]
  preferred_tenant?: string
  preferred_gender?: 'any' | 'male' | 'female'
  sharing_occupancy?: '1' | '2' | '3' | '4' | '5' | '6' | 'dorm'
  food_included?: boolean
  wifi_available?: boolean
  ac_available?: boolean
  laundry_available?: boolean
}

export interface UpdatePropertyInput extends Partial<CreatePropertyInput> {}