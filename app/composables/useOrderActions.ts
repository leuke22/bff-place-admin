import type { Order, OrderStatus, OrderType } from '~/types/models/order.types'
import type { IResponse } from '~/types/response'

export interface OrderAction {
    status: 'ready' | 'completed'
    label: string
    icon: string
}

export function nextOrderAction(status: OrderStatus): OrderAction | null {
    if (status === 'preparing') return { status: 'ready', label: 'Mark as Ready', icon: 'lucide:bell-ring' }
    if (status === 'ready') return { status: 'completed', label: 'Complete Order', icon: 'lucide:check-check' }
    return null
}

export function canCancelOrder(status: OrderStatus) {
    return status === 'pending' || status === 'preparing' || status === 'ready'
}

// Only a freshly-placed order can be paid — payment is what kicks off preparing.
export function canPayOrder(status: OrderStatus) {
    return status === 'pending'
}

export function orderTypeLabel(type: OrderType) {
    return type === 'dine_in' ? 'Dine-in' : 'Takeout'
}

export function useOrderActions() {
    const { baseUrl, token } = useAPI()
    const toast = useToast()
    const updatingUuid = ref<string | null>(null)

    async function updateStatus(order: Order, status: 'ready' | 'completed' | 'cancelled') {
        updatingUuid.value = order.uuid
        try {
            const response = await $fetch<IResponse & { response: Order }>(`/orders/${order.uuid}/status`, {
                baseURL: baseUrl,
                method: 'PATCH',
                headers: { authorization: token.value ?? '' },
                body: { status },
            })

            if (!response.success) {
                throw new Error(response.errorMessage || response.errorDescription || 'Failed to update order')
            }

            toast.add({ title: `Order ${order.order_number} updated`, color: 'success' })
            return true
        } catch (error: any) {
            toast.add({
                title: 'Error updating order',
                description: error?.data?.statusMessage || error?.data?.message || error?.message || 'Something went wrong',
                color: 'error'
            })
            return false
        } finally {
            updatingUuid.value = null
        }
    }

    return { updateStatus, updatingUuid }
}