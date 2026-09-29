import type { Order, OrderStatus, OrderType } from '~/types/models/order.types'
import type { IResponse } from '~/types/response'

export interface OrderAction {
    status: 'preparing' | 'ready'
    label: string
    icon: string
}

export function nextOrderAction(status: OrderStatus): OrderAction | null {
    if (status === 'pending') return { status: 'preparing', label: 'Start Preparing', icon: 'lucide:chef-hat' }
    if (status === 'preparing') return { status: 'ready', label: 'Mark as Ready', icon: 'lucide:bell-ring' }
    return null
}

export function canCancelOrder(status: OrderStatus) {
    return status === 'pending' || status === 'preparing' || status === 'ready'
}

export function orderTypeLabel(type: OrderType) {
    return type === 'dine_in' ? 'Dine-in' : 'Takeout'
}

export function useOrderActions() {
    const { baseUrl, token } = useAPI()
    const toast = useToast()
    const updatingUuid = ref<string | null>(null)

    // Returns true when the change went through.
    async function updateStatus(order: Order, status: 'preparing' | 'ready' | 'cancelled') {
        updatingUuid.value = order.uuid
        try {
            const response = await $fetch<IResponse & { response: Order }>(`/orders/${order.uuid}/status`, {
                baseURL: baseUrl,
                method: 'PATCH',
                headers: { authorization: token ?? '' },
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