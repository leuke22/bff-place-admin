import type { Product } from '~/types/models/product.types'
import type { PaymentMethod } from '~/types/models/payment.types'
import type { OrderType } from '~/types/models/order.types'

export interface CartItem {
    product_id: number
    name: string
    image: string | null
    unit_price: number
    quantity: number
    notes: string
}

export function usePosCart() {
    const items = useState<CartItem[]>('pos-cart-items', () => [])
    const orderType = useState<OrderType>('pos-cart-order-type', () => 'dine_in')
    // string allowed because an emptied number input yields ''
    const discount = useState<number | string>('pos-cart-discount', () => 0)

    const paymentMethod = useState<PaymentMethod>('pos-cart-payment-method', () => 'cash')
    // string allowed because an emptied number input yields ''
    const amountTendered = useState<number | string>('pos-cart-amount-tendered', () => '')

    const discountAmount = computed(() => Math.max(0, Number(discount.value) || 0))
    const subtotal = computed(() => items.value.reduce((sum, i) => sum + i.unit_price * i.quantity, 0))
    const total = computed(() => Math.max(0, subtotal.value - discountAmount.value))
    const count = computed(() => items.value.reduce((sum, i) => sum + i.quantity, 0))
    const discountTooHigh = computed(() => discountAmount.value > subtotal.value)

    const tendered = computed(() => Number(amountTendered.value) || 0)
    // Payment-first: the order can only be placed once the tendered amount covers the total.
    const isPaid = computed(() => items.value.length > 0 && tendered.value > 0 && tendered.value >= total.value)
    const change = computed(() => (isPaid.value ? tendered.value - total.value : 0))

    function quantityOf(productId: number) {
        return items.value.find((i) => i.product_id === productId)?.quantity ?? 0
    }

    function add(product: Product) {
        const existing = items.value.find((i) => i.product_id === product.id)
        if (existing) {
            existing.quantity++
            return
        }
        items.value.push({
            product_id: product.id,
            name: product.name,
            image: product.image,
            unit_price: Number(product.price),
            quantity: 1,
            notes: '',
        })
    }

    function increment(productId: number) {
        const item = items.value.find((i) => i.product_id === productId)
        if (item) item.quantity++
    }

    function remove(productId: number) {
        items.value = items.value.filter((i) => i.product_id !== productId)
    }

    function decrement(productId: number) {
        const item = items.value.find((i) => i.product_id === productId)
        if (!item) return
        if (item.quantity <= 1) remove(productId)
        else item.quantity--
    }

    function setNotes(productId: number, notes: string) {
        const item = items.value.find((i) => i.product_id === productId)
        if (item) item.notes = notes
    }

    function clear() {
        items.value = []
        discount.value = 0
        amountTendered.value = ''
    }

    return {
        items, orderType, discount, paymentMethod, amountTendered,
        discountAmount, subtotal, total, count, discountTooHigh,
        tendered, isPaid, change,
        quantityOf, add, increment, decrement, remove, setNotes, clear,
    }
}