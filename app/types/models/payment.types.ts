import type { Order } from './order.types'

export type PaymentMethod = 'cash' | 'gcash' | 'card' | 'bank_transfer'

export interface Payment {
  id: number
  order_id: number
  method: PaymentMethod
  amount_tendered: string
  change: string
  paid_at: string
}

export interface PaymentResult {
  payment: Payment
  order: Order
}