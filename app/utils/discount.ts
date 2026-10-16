import type { Discount } from '~/types/models/discount.types'

export function discountLabel(discount: Pick<Discount, 'type' | 'value'>) {
    return discount.type === 'percent' ? `${Number(discount.value)}%` : formatCurrency(discount.value)
}
