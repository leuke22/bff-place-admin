import type { Ingredient } from "./ingredient.types"

// The product_ingredient same as recipe
export interface RecipeItem {
  id: number
  product_id: number
  ingredient_id: number
  quantity_used: string
  created_at: string
  updated_at: string
  ingredient: Ingredient
}