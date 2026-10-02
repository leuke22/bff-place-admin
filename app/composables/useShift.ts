import type { ShiftWithSummary } from '~/types/models/shift.types'
import type { IResponse } from '~/types/response'

export function useShift() {
    const { baseUrl, token } = useAPI()
    const toast = useToast()

    const shift = useState<ShiftWithSummary | null>('pos-current-shift', () => null)
    const loading = useState('pos-shift-loading', () => false)
    const checked = useState('pos-shift-checked', () => false)

    async function fetchCurrent() {
        loading.value = true
        try {
            const response = await $fetch<IResponse & { response: ShiftWithSummary }>('/shifts/current', {
                baseURL: baseUrl,
                headers: { authorization: token ?? '' },
            })
            shift.value = response.success ? response.response : null
        } catch {
            shift.value = null
        } finally {
            loading.value = false
            checked.value = true
        }
    }

    async function open(openingCash: number) {
        loading.value = true
        try {
            const response = await $fetch<IResponse & { response: ShiftWithSummary }>('/shifts', {
                baseURL: baseUrl,
                method: 'POST',
                headers: { authorization: token ?? '' },
                body: { opening_cash: openingCash },
            })
            if (!response.success) throw new Error(response.errorMessage || response.errorDescription || 'Failed to open shift')
            await fetchCurrent() // POST /shifts doesn't return a summary — pull it fresh
            toast.add({ title: 'Shift opened', color: 'success' })
            return true
        } catch (error: any) {
            toast.add({
                title: 'Error opening shift',
                description: error?.data?.statusMessage || error?.data?.message || error?.message || 'Something went wrong',
                color: 'error'
            })
            return false
        } finally {
            loading.value = false
        }
    }

    async function close(closingCash: number) {
        if (!shift.value) return null

        loading.value = true
        try {
            const response = await $fetch<IResponse & { response: import('~/types/models/shift.types').Shift }>(`/shifts/${shift.value.id}/close`, {
                baseURL: baseUrl,
                method: 'PATCH',
                headers: { authorization: token ?? '' },
                body: { closing_cash: closingCash },
            })
            if (!response.success) throw new Error(response.errorMessage || response.errorDescription || 'Failed to close shift')

            const closed = response.response
            shift.value = null
            toast.add({
                title: 'Shift closed',
                description: `Variance: ${formatCurrency(closed.variance ?? 0)}`,
                color: Math.abs(Number(closed.variance)) < 0.01 ? 'success' : 'warning'
            })
            return closed
        } catch (error: any) {
            toast.add({
                title: 'Error closing shift',
                description: error?.data?.statusMessage || error?.data?.message || error?.message || 'Something went wrong',
                color: 'error'
            })
            return null
        } finally {
            loading.value = false
        }
    }

    return { shift, loading, checked, fetchCurrent, open, close }
}