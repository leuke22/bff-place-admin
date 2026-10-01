export interface Shift {
    id: number
    cashier_id: number
    opening_cash: string
    closing_cash: string | null
    expected_cash: string | null
    variance: string | null
    opened_at: string
    closed_at: string | null
}