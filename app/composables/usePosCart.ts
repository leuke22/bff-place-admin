import type { Product } from '~/types/models/product.types'
import type { PaymentMethod } from '~/types/models/payment.types'
import type { Discount } from '~/types/models/discount.types'
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
    const appliedDiscount = useState<Discount | null>('pos-cart-discount', () => null)

    const paymentMethod = useState<PaymentMethod>('pos-cart-payment-method', () => 'cash')
    // string allowed because an emptied number input yields ''
    const amountTendered = useState<number | string>('pos-cart-amount-tendered', () => '')

    const subtotal = computed(() => items.value.reduce((sum, i) => sum + i.unit_price * i.quantity, 0))
    // Percent discounts follow the cart as it changes; a fixed discount can never exceed the subtotal.
    const discountAmount = computed(() => {
        const discount = appliedDiscount.value
        if (!discount) return 0
        const raw = discount.type === 'percent' ? subtotal.value * Number(discount.value) / 100 : Number(discount.value)
        return Math.min(Math.round(raw * 100) / 100, subtotal.value)
    })
    const total = computed(() => Math.max(0, subtotal.value - discountAmount.value))
    const count = computed(() => items.value.reduce((sum, i) => sum + i.quantity, 0))

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
        appliedDiscount.value = null
        orderType.value = 'dine_in'
        paymentMethod.value = 'cash'
        amountTendered.value = ''
    }

    return {
        items, orderType, appliedDiscount, paymentMethod, amountTendered,
        discountAmount, subtotal, total, count, tendered, isPaid, change,
        quantityOf, add, increment, decrement, remove, setNotes, clear,
    }
}