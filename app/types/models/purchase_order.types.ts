 import type { Supplier } from './supplier.types'
import type { Ingredient } from './ingredient.types'

export type PurchaseOrderStatus = 'pending' | 'ordered' | 'received' | 'cancelled'

export interface PurchaseOrderItem {
  id: number
  purchase_order_id: number
  ingredient_id: number
  quantity: string
  unit_cost: string
  subtotal: string
  created_at: string
  ingredient: Ingredient
}

export interface PurchaseOrder {
  id: number
  uuid: string
  order_number: string
  supplier_id: number
  status: PurchaseOrderStatus
  total_cost: string
  ordered_by: number | null
  ordered_at: string | null
  received_at: string | null
  created_at: string
  updated_at: string
  supplier: Supplier
  items: PurchaseOrderItem[]
}

export interface CreatePurchaseOrderItemInput {
  ingredient_id: number
  quantity: number
  unit_cost: number
}

export interface CreatePurchaseOrderInput {
  supplier_id: number
  items: CreatePurchaseOrderItemInput[]
}