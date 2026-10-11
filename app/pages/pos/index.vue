<template>
    <div class="grid lg:grid-cols-[minmax(0,1fr)_24rem] gap-4 items-start">
        <!-- Menu -->
        <div class="space-y-4 min-w-0">
            <div class="flex flex-row gap-2">
                <UInput v-model="search" icon="i-lucide-search" placeholder="Search menu..." class="flex-1"/>
                <UButton icon="lucide:refresh-ccw" variant="outline" color="neutral" :loading="status === 'pending'" @click="refresh()"/>
            </div>

            <div class="flex flex-row gap-2 overflow-x-auto pb-1">
                <UButton
                    label="All"
                    color="neutral"
                    class="shrink-0"
                    :variant="selectedCategory === 0 ? 'solid' : 'outline'"
                    @click="selectedCategory = 0"
                />
                <UButton
                    v-for="category in categories"
                    :key="category.id"
                    :label="category.name"
                    :icon="category.icon"
                    color="neutral"
                    class="shrink-0"
                    :variant="selectedCategory === category.id ? 'solid' : 'outline'"
                    @click="selectedCategory = category.id"
                />
            </div>

            <div v-if="filteredProducts.length" class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                <button
                    v-for="product in filteredProducts"
                    :key="product.id"
                    type="button"
                    class="relative text-left rounded-lg border border-default overflow-hidden bg-default hover:border-primary active:scale-[0.98] transition"
                    @click="add(product)"
                >
                    <NuxtImg :src="product.image ?? '/images/inasal.webp'" class="w-full h-28 object-cover"/>
                    <UBadge
                        v-if="quantityOf(product.id)"
                        class="absolute top-2 right-2"
                        color="primary"
                        :label="`×${quantityOf(product.id)}`"
                    />
                    <div class="p-3">
                        <p class="font-medium leading-tight">{{ product.name }}</p>
                        <p class="text-sm text-muted mt-1">{{ formatCurrency(product.price) }}</p>
                    </div>
                </button>
            </div>
            <div v-else class="rounded-lg border border-default p-10 text-center text-muted">
                No menu items found.
            </div>
        </div>

        <!-- Current order -->
        <div class="rounded-lg border border-default bg-default flex flex-col lg:sticky lg:top-4 lg:max-h-[calc(100dvh-7rem)]">
            <div class="flex flex-row justify-between items-center px-4 py-3 border-b border-default">
                <div>
                    <h2 class="font-semibold">Current Order</h2>
                    <p class="text-xs text-muted">{{ count }} item(s)</p>
                </div>
                <UButton v-if="items.length" label="Clear" icon="lucide:trash-2" variant="ghost" color="error" size="sm" @click="clear"/>
            </div>

            <div class="grid grid-cols-2 gap-2 p-3 border-b border-default">
                <UButton
                    label="Dine-in"
                    icon="lucide:utensils"
                    color="neutral"
                    block
                    :variant="orderType === 'dine_in' ? 'solid' : 'outline'"
                    @click="orderType = 'dine_in'"
                />
                <UButton
                    label="Takeout"
                    icon="lucide:shopping-bag"
                    color="neutral"
                    block
                    :variant="orderType === 'takeout' ? 'solid' : 'outline'"
                    @click="orderType = 'takeout'"
                />
            </div>

            <div v-if="items.length" class="flex-1 overflow-y-auto divide-y divide-default min-h-32">
                <div v-for="item in items" :key="item.product_id" class="flex flex-col gap-1.5 px-4 py-3">
                    <div class="flex flex-row justify-between gap-2">
                        <p class="font-medium leading-tight">{{ item.name }}</p>
                        <p class="font-medium whitespace-nowrap">{{ formatCurrency(item.unit_price * item.quantity) }}</p>
                    </div>
                    <div class="flex flex-row items-center justify-between">
                        <div class="flex items-center gap-1">
                            <UButton icon="lucide:minus" size="xs" variant="outline" color="neutral" @click="decrement(item.product_id)"/>
                            <span class="w-8 text-center text-sm">{{ item.quantity }}</span>
                            <UButton icon="lucide:plus" size="xs" variant="outline" color="neutral" @click="increment(item.product_id)"/>
                        </div>
                        <UButton icon="lucide:x" size="xs" variant="ghost" color="error" @click="remove(item.product_id)"/>
                    </div>
                    <UInput
                        :model-value="item.notes"
                        placeholder="Notes (e.g. no onions)"
                        size="xs"
                        @update:model-value="setNotes(item.product_id, String($event ?? ''))"
                    />
                </div>
            </div>
            <div v-else class="flex-1 flex items-center justify-center p-8 text-center text-muted min-h-32">
                Tap a menu item to start an order.
            </div>

            <div class="border-t border-default p-4 space-y-3">
                <div class="flex flex-row justify-between items-center gap-3">
                    <span class="text-sm text-muted">Discount</span>
                    <UInput v-model.number="discount" type="number" min="0" step="0.01" size="sm" class="w-32">
                        <template #leading>
                            <span class="text-muted text-sm">₱</span>
                        </template>
                    </UInput>
                </div>
                <p v-if="discountTooHigh" class="text-xs text-error">Discount can't be more than the subtotal.</p>

                <div class="space-y-1 text-sm">
                    <div class="flex justify-between text-muted">
                        <span>Subtotal</span>
                        <span>{{ formatCurrency(subtotal) }}</span>
                    </div>
                    <div v-if="discountAmount" class="flex justify-between text-muted">
                        <span>Discount</span>
                        <span>−{{ formatCurrency(discountAmount) }}</span>
                    </div>
                    <div class="flex justify-between text-lg font-semibold">
                        <span>Total</span>
                        <span>{{ formatCurrency(total) }}</span>
                    </div>
                </div>

                <div class="space-y-2">
                    <p class="text-sm font-medium">Payment</p>
                    <div class="grid grid-cols-2 gap-2">
                        <UTooltip
                            v-for="option in paymentOptions"
                            :key="option.value"
                            :text="option.available ? undefined : 'Coming soon'"
                            :disabled="option.available"
                        >
                            <UButton
                                :label="option.label"
                                :icon="option.icon"
                                color="neutral"
                                size="sm"
                                block
                                :variant="paymentMethod === option.value ? 'solid' : 'outline'"
                                :disabled="!option.available"
                                @click="paymentMethod = option.value"
                            >
                                <template v-if="!option.available" #trailing>
                                    <UBadge label="Soon" size="sm" color="neutral" variant="subtle"/>
                                </template>
                            </UButton>
                        </UTooltip>
                    </div>

                    <UInput v-model.number="amountTendered" type="number" min="0" step="0.01" size="sm" placeholder="Amount tendered" class="w-full" :disabled="!items.length">
                        <template #leading>
                            <span class="text-muted text-sm">₱</span>
                        </template>
                    </UInput>
                    <div v-if="items.length" class="flex flex-row gap-2 flex-wrap">
                        <UButton
                            v-for="preset in quickAmounts"
                            :key="preset"
                            :label="formatCurrency(preset)"
                            size="xs"
                            variant="outline"
                            color="neutral"
                            @click="amountTendered = preset"
                        />
                    </div>
                    <div class="flex justify-between items-center text-sm rounded-md px-3 py-2" :class="isPaid ? 'bg-success/10 text-success' : 'bg-muted text-muted'">
                        <span>{{ isPaid ? 'Paid' : 'Awaiting payment' }}</span>
                        <span class="font-semibold">Change: {{ isPaid ? formatCurrency(change) : '—' }}</span>
                    </div>
                </div>

                <UButton
                    label="Place Order"
                    icon="lucide:check"
                    size="lg"
                    block
                    :loading="placing"
                    :disabled="!items.length || discountTooHigh || !shift || !isPaid"
                    @click="onPlaceOrder"
                />
                <p v-if="!shift" class="text-xs text-error text-center">Open a shift above before taking orders.</p>
                <p v-else-if="items.length && !isPaid" class="text-xs text-muted text-center">Enter the amount tendered to enable Place Order.</p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Category } from '~/types/models/category.types'
import type { Order } from '~/types/models/order.types'
import type { PaymentMethod } from '~/types/models/payment.types'
import type { Product } from '~/types/models/product.types'
import type { IListResponse, IResponse } from '~/types/response'

definePageMeta({
    middleware: 'require-auth',
    layout: 'pos'
})

const { baseUrl, token } = useAPI()
const toast = useToast()

const {
    items, orderType, discount, paymentMethod, amountTendered, discountAmount, subtotal, total, count, discountTooHigh,
    tendered, isPaid, change,
    quantityOf, add, increment, decrement, remove, setNotes, clear,
} = usePosCart()

const { shift } = useShift()

const search = ref('')
const selectedCategory = ref(0)

// The products endpoint caps a page at 100 items; that's plenty for one menu for now.
const { data: products, refresh, status } = useAsyncData(
    'pos-products',
    () => $fetch<IListResponse<Product>>('/products', {
        baseURL: baseUrl,
        headers: { authorization: token.value ?? '' },
        query: { limit: 100 },
    }),
    {
        transform: (data: IListResponse<Product>) => data.response.rows.filter((p) => p.is_active),
        default: () => [] as Product[]
    }
)

// Only categories that actually have items on the menu
const categories = computed(() => {
    const map = new Map<number, Category>()
    for (const product of products.value) {
        const productCategories = product.categories
        for (const category of productCategories) {
            if (category && !map.has(category.id)) {
                map.set(category.id, category)
            }
        }
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
})

const filteredProducts = computed(() => {
    let list = products.value

    if (selectedCategory.value) {
        list = list.filter((product) =>
            product.categories
                .some((category) => category?.id === selectedCategory.value),
        )
    }

    if (search.value) {
        const term = search.value.toLowerCase()
        list = list.filter((p) => p.name.toLowerCase().includes(term))
    }

    return list
})

const paymentOptions: { value: PaymentMethod; label: string; icon: string; available: boolean }[] = [
    { value: 'cash', label: 'Cash', icon: 'lucide:banknote', available: true },
    { value: 'gcash', label: 'GCash', icon: 'lucide:smartphone', available: false },
    { value: 'card', label: 'Card', icon: 'lucide:credit-card', available: false },
    { value: 'bank_transfer', label: 'Bank Transfer', icon: 'lucide:landmark', available: false },
]

// Rounds up to the nearest ₱50 above the total, then a couple of common bill combos above that
const quickAmounts = computed(() => {
    const exact = total.value
    if (exact <= 0) return []
    const rounded = Math.ceil(exact / 50) * 50
    return [...new Set([exact, rounded, rounded + 50, rounded + 100])].sort((a, b) => a - b).slice(0, 4)
})

const placing = ref(false)

async function onPlaceOrder() {
    if (!items.value.length || discountTooHigh.value || !isPaid.value) return

    placing.value = true
    try {
        const response = await $fetch<IResponse & { response: Order }>('/orders', {
            baseURL: baseUrl,
            method: 'POST',
            headers: { authorization: token.value ?? '' },
            body: {
                order_type: orderType.value,
                discount: discountAmount.value,
                items: items.value.map((item) => ({
                    product_id: item.product_id,
                    quantity: item.quantity,
                    notes: item.notes.trim() || undefined,
                })),
                payment: {
                    method: paymentMethod.value,
                    amount_tendered: tendered.value,
                },
            },
        })

        if (!response.success) {
            throw new Error(response.errorMessage || response.errorDescription || 'Failed to place order')
        }

        toast.add({
            title: `Order ${response.response.order_number} placed`,
            description: `Paid · Change: ${formatCurrency(change.value)}`,
            color: 'success'
        })
        const placedUuid = response.response.uuid
        clear()
        await navigateTo({ path: `/pos/orders/${placedUuid}/print`, query: { auto: '1' } })
    } catch (error: any) {
        toast.add({
            title: 'Error placing order',
            description: error?.data?.statusMessage || error?.data?.message || error?.message || 'Something went wrong',
            color: 'error'
        })
    } finally {
        placing.value = false
    }
}
</script>
