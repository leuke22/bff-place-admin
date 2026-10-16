export type DiscountType = 'percent' | 'fixed'

export interface Discount {
    id: number
    uuid: string
    name: string
    type: DiscountType
    // numeric columns come back from the API as strings
    value: string
    is_active: boolean
    created_at: string
    updated_at: string
}
