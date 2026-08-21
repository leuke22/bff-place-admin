export function formatCurrency(
  value: number | string | null | undefined,
  options?: Intl.NumberFormatOptions
): string {
    const amount = Number(value ?? 0)

    if (Number.isNaN(amount)) {
        return '₱0.00'
    }

    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        ...options,
    }).format(amount)
}