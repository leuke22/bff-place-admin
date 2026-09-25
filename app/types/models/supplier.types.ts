export interface Supplier {
  id: number
  uuid: string
  name: string
  contact_person: string | null
  contact_number: string | null
  email: string | null
  address: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type CreateSupplier = Omit<
  Supplier,
  'id' | 'uuid' | 'created_at' | 'updated_at' | 'deleted_at'
>

export type UpdateSupplier = Partial<CreateSupplier>