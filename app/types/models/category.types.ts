import type { Product } from "./product.types"

export interface Category {
    id: number
    uuid: string
    name: string
    description: string | null
    is_active: boolean

    products: Product[]

    created_at: string
    updated_at: string
    deleted_at: string | null
}

export type CreateCategory = Omit<
  Category,
  'id' | 'uuid' | 'created_at' | 'updated_at' | 'deleted_at' | 'products'
>

export type UpdateCategory = Partial<CreateCategory>