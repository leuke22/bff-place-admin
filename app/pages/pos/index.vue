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

                <UButton
                    label="Place Order"
                    icon="lucide:check"
                    size="lg"
                    block
                    :loading="placing"
                    :disabled="!items.length || discountTooHigh"
                    @click="onPlaceOrder"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Category } from '~/types/models/category.types'
import type { Order } from '~/types/models/order.types'
import type { Product } from '~/types/models/product.types'
import type { IListResponse, IResponse } from '~/types/response'

definePageMeta({
    middleware: 'require-auth',
    layout: 'pos'
})

const { baseUrl, token } = useAPI()
const toast = useToast()

const {
    items, orderType, discount, discountAmount, subtotal, total, count, discountTooHigh,
    quantityOf, add, increment, decrement, remove, setNotes, clear,
} = usePosCart()

const search = ref('')
const selectedCategory = ref(0)

// The products endpoint caps a page at 100 items; that's plenty for one menu for now.
const { data: products, refresh, status } = useAsyncData(
    'pos-products',
    () => $fetch<IListResponse<Product>>('/products', {
        baseURL: baseUrl,
        headers: { authorization: token ?? '' },
        query: { limit: 100, includes: 'category' },
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
        if (product.category && !map.has(product.category.id)) {
            map.set(product.category.id, product.category)
        }
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
})

const filteredProducts = computed(() => {
    let list = products.value

    if (selectedCategory.value) {
        list = list.filter((p) => p.category_id === selectedCategory.value)
    }

    if (search.value) {
        const term = search.value.toLowerCase()
        list = list.filter((p) => p.name.toLowerCase().includes(term))
    }

    return list
})

const placing = ref(false)

async function onPlaceOrder() {
    if (!items.value.length || discountTooHigh.value) return

    placing.value = true
    try {
        const response = await $fetch<IResponse & { response: Order }>('/orders', {
            baseURL: baseUrl,
            method: 'POST',
            headers: { authorization: token ?? '' },
            body: {
                order_type: orderType.value,
                discount: discountAmount.value,
                items: items.value.map((item) => ({
                    product_id: item.product_id,
                    quantity: item.quantity,
                    notes: item.notes.trim() || undefined,
                })),
            },
        })

        if (!response.success) {
            throw new Error(response.errorMessage || response.errorDescription || 'Failed to place order')
        }

        toast.add({ title: `Order ${response.response.order_number} placed`, color: 'success' })
        clear()
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