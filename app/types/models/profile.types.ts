import type { UserRole } from './staff.types'

export interface ProfileUser {
    id: number
    uuid: string
    first_name: string
    middle_name: string | null
    last_name: string
    email: string
    avatar: string | null
    role: UserRole
    created_at: string
}