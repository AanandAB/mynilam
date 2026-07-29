export interface User {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  phone?: string
  role: 'guest' | 'normal' | 'employee' | 'super_admin' | 'hostel_admin',
  assignedHostelId?: string
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  user_id: string
  bio?: string
  preferred_locations?: string[]
  budget_min?: number
  budget_max?: number
  property_types?: ('house' | 'flat' | 'plot' | 'commercial')[]
}