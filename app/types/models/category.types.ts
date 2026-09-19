import type { BadgeProps } from "@nuxt/ui"
import type { Product } from "./product.types"

export interface Category {
  id: number
  uuid: string
  name: string
  description: string | null
  icon: string
  color: string
  image: string | null
  is_active: boolean

  products: Product[]

  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface CategoryProductCount {
  id: number
  uuid: string
  name: string
  description: string | null
  icon: string
  color: string 
  image: string | null
  is_active: boolean
  products_count: string
  created_at: string
}

export type CreateCategory = Omit<
  Category,
  'id' | 'uuid' | 'created_at' | 'updated_at' | 'deleted_at' | 'products'
>

export type UpdateCategory = Partial<CreateCategory>