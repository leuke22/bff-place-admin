import type { Category } from "./category.types"

export interface Product {
  id: number
  uuid: string
  category_id: number
  name: string
  description: string | null
  price: string
  image: string | null
  is_active: boolean

  category: Category

  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type CreateProduct = Omit<
  Product,
  'id' | 'uuid' | 'created_at' | 'updated_at' | 'deleted_at' | 'category'
>

export type UpdateProduct = Partial<CreateProduct>