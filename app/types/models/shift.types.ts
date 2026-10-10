export interface Shift {
    id: number
    cashier_id: number
    opening_cash: string
    closing_cash: string | null
    expected_cash: string | null
    variance: string | null
    opened_at: string
    closed_at: string | null
    cashier?: { id: number; first_name: string; last_name: string }
}

export interface ShiftSummary {
    order_count: number
    total_sales: string
    cash_collected: string
}

export interface ShiftWithSummary extends Shift {
    summary: ShiftSummary
}

export interface ShiftPayment {
    id: number
    method: 'cash' | 'gcash' | 'card' | 'bank_transfer'
    amount_tendered: string
    change: string
    paid_at: string
    order_id: number
    order_uuid: string
    order_number: string
    order_total: string
}

export interface ShiftDetail extends ShiftWithSummary {
    payments: ShiftPayment[]
}
export type ShiftStatusFilter = 'all' | 'open' | 'balanced' | 'variance'

export interface ShiftListStats {
    total_shifts: number
    open_shifts: number
    total_expected: string
    total_variance: string
    variance_shifts: number
}
