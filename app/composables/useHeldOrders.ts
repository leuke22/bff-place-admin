import type { Discount } from '~/types/models/discount.types'
import type { OrderType } from '~/types/models/order.types'
import type { CartItem } from '~/composables/usePosCart'

export interface HeldOrder {
    id: string
    held_at: string
    order_type: OrderType
    items: CartItem[]
    discount: Discount | null
    subtotal: number
}

const STORAGE_KEY = 'bff-pos-held-orders'

// Held carts live in this browser only (nothing is sent to the server), so they
// survive a refresh but not a different device or cleared site data.
export function useHeldOrders() {
    const held = useState<HeldOrder[]>('pos-held-orders', () => [])

    onMounted(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY)
            if (raw && !held.value.length) held.value = JSON.parse(raw) as HeldOrder[]
        } catch {
            // storage unavailable or corrupt — start empty
        }
    })

    function persist() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(held.value))
        } catch {
            // storage unavailable — held orders stay in memory for this session
        }
    }

    function hold(order: Omit<HeldOrder, 'id' | 'held_at'>) {
        held.value = [{ ...order, id: crypto.randomUUID(), held_at: new Date().toISOString() }, ...held.value]
        persist()
    }

    function discard(id: string) {
        held.value = held.value.filter((h) => h.id !== id)
        persist()
    }

    return { held, hold, discard }
}
