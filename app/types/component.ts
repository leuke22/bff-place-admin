export type ValueType = 'grid' | 'table'

export interface ViewTypes {
    value: ValueType,
    label: string
    icon: string
}

export interface Pagination {
    page: number
    limit: number
    total: number
}

export interface Filter {
    search: string
}

export interface ProductFilter extends Filter {
    category: number 
}

export interface FeaturesLogoTypes {
    title: string
    description: string
    icon: string
}