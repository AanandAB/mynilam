import type { Property } from './property'
import type { User } from './user'

export type TransactionType = 'purchase' | 'rent_deposit' | 'commission'
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded'

export interface Transaction {
  id: string
  amount: number
  status: TransactionStatus
  type: TransactionType
  property_id: string
  property?: Property
  buyer_id: string
  buyer?: User
  seller_id: string
  seller?: User
  stripe_payment_id?: string
  created_at: string
  updated_at: string
}

export interface CreateTransactionInput {
  amount: number
  type: TransactionType
  property_id: string
}