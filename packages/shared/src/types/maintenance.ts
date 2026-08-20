/**
 * Types for the maintenance domain (tenant <-> landlord repair requests).
 *
 * Field names mirror the Django API's JSON output (snake_case). Decimal amounts
 * come back as strings to preserve precision — format them with a currency
 * helper in the UI. `UserBrief` / `PropertyBrief` are reused from the leases
 * types (single source of truth for nested entity summaries).
 */
import type { UserBrief, PropertyBrief } from './leases'

export type MaintenancePriority = 'Low' | 'Medium' | 'High' | 'Urgent'

export type MaintenanceStatus =
  | 'Submitted'
  | 'Acknowledged'
  | 'InProgress'
  | 'OnHold'
  | 'Completed'
  | 'Cancelled'

export interface MaintenanceCategory {
  id: string
  name: string
  description: string | null
}

export interface MaintenanceRequest {
  id: string
  property: PropertyBrief
  category: { id: string; name: string }
  reported_by: UserBrief
  assigned_to: UserBrief | null
  lease_id: string | null
  title: string
  description: string
  priority: MaintenancePriority
  status: MaintenanceStatus
  scheduled_date: string | null
  completed_date: string | null
  resolution_notes: string | null
  estimated_cost: string | null
  actual_cost: string | null
  currency_code: string | null
  created_at: string
}

export interface CreateMaintenanceRequestInput {
  property_id: number | string
  category_id: number | string
  title: string
  description: string
  priority?: MaintenancePriority
  lease_id?: number | string
}

// `Submitted` is the initial state and is never the target of a status update.
export type MaintenanceStatusAction = Exclude<MaintenanceStatus, 'Submitted'>

export interface UpdateMaintenanceRequestStatusInput {
  status: MaintenanceStatusAction
  assigned_to?: number | string
  scheduled_date?: string
  resolution_notes?: string
  estimated_cost?: number
  actual_cost?: number
}
