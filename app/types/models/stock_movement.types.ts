import type { Ingredient } from "./ingredient.types"

export type StockMovementType = "in" | "out" | "adjustment"

export interface StockMovement {
  id: number
  ingredient_id: number
  type: StockMovementType
  quantity: string
  reason: string | null
  reference_type: string | null
  reference_id: number | null
  created_by: number | null
  created_at: string
  ingredient: Ingredient
}

export interface StockMovementResult {
  movement: StockMovement
  ingredient: Ingredient
}