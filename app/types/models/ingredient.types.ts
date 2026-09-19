export interface Ingredient {
  id: number
  uuid: string
  name: string
  unit: string
  current_stock: string
  reorder_level: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type CreateIngredient = Omit<
  Ingredient,
  'id' | 'uuid' | 'created_at' | 'updated_at' | 'deleted_at'
>

export type UpdateIngredient = Partial<CreateIngredient>