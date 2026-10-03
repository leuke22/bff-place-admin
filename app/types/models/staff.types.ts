export type UserRole = 'admin' | 'manager' | 'cashier'

export interface Staff {
    id: number
    uuid: string
    first_name: string
    middle_name: string | null
    last_name: string
    email: string
    avatar: string | null
    role: UserRole
    is_active: boolean | null
    created_at: string
    updated_at: string
}