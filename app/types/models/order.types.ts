export type OrderType = 'dine_in' | 'takeout'
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled'

export interface OrderItem {
  id: number
  order_id: number
  product_id: number
  variant_id: number | null
  quantity: number
  unit_price: string
  subtotal: string
  notes: string | null
  created_at: string
  product: { id: number; name: string; image?: string | null }
}

export interface Order {
  id: number
  uuid: string
  order_number: string
  order_type: OrderType
  table_id: number | null
  status: OrderStatus
  subtotal: string
  discount: string
  total: string
  cashier_id: number
  created_at: string
  updated_at: string
  items: OrderItem[]
  cashier?: { id: number; first_name: string; last_name: string }
}