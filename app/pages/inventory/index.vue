<template>
    <div class="space-y-6">
        <PageHeader title="Dashboard" description="Overview of your inventory" :items :has-view="false"/>

        <!-- Stat cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="rounded-lg border border-default p-4 flex flex-row items-center gap-3">
                <div class="size-10 rounded-full bg-secondary-200 dark:bg-secondary-900/10 flex items-center justify-center shrink-0">
                    <UIcon name="lucide:wheat" class="size-5 text-secondary-700 dark:text-secondary-400"/>
                </div>
                <div>
                    <p class="text-xs uppercase text-muted tracking-wide">Ingredients</p>
                    <p class="text-xl font-semibold">{{ ingredients.length }}</p>
                </div>
            </div>

            <div class="rounded-lg border border-default p-4 flex flex-row items-center gap-3">
                <div class="size-10 rounded-full bg-error/10 flex items-center justify-center shrink-0">
                    <UIcon name="lucide:triangle-alert" class="size-5 text-error"/>
                </div>
                <div>
                    <p class="text-xs uppercase text-muted tracking-wide">Low Stock</p>
                    <p class="text-xl font-semibold">{{ lowStockIngredients.length }}</p>
                </div>
            </div>

            <div class="rounded-lg border border-default p-4 flex flex-row items-center gap-3">
                <div class="size-10 rounded-full bg-warning/10 flex items-center justify-center shrink-0">
                    <UIcon name="lucide:clipboard-list" class="size-5 text-warning"/>
                </div>
                <div>
                    <p class="text-xs uppercase text-muted tracking-wide">Open Purchase Orders</p>
                    <p class="text-xl font-semibold">{{ openPurchaseOrders.length }}</p>
                </div>
            </div>

            <div class="rounded-lg border border-default p-4 flex flex-row items-center gap-3">
                <div class="size-10 rounded-full bg-primary-200 dark:bg-primary-900/10 flex items-center justify-center shrink-0">
                    <UIcon name="lucide:box" class="size-5 text-primary-700 dark:text-primary-400"/>
                </div>
                <div>
                    <p class="text-xs uppercase text-muted tracking-wide">Products</p>
                    <p class="text-xl font-semibold">{{ productCount }}</p>
                </div>
            </div>
        </div>

        <div class="grid lg:grid-cols-2 gap-6">
            <!-- Low stock ingredients -->
            <div class="rounded-lg border border-default">
                <div class="flex flex-row justify-between items-center px-4 py-3.5 border-b border-default">
                    <h2 class="font-semibold">Low Stock Ingredients</h2>
                    <UButton label="View All" variant="link" size="sm" to="/inventory/ingredients"/>
                </div>
                <div v-if="lowStockIngredients.length" class="divide-y divide-default">
                    <NuxtLink
                        v-for="ingredient in lowStockIngredients.slice(0, 6)"
                        :key="ingredient.id"
                        :to="`/inventory/ingredients/${ingredient.id}`"
                        class="flex flex-row items-center justify-between gap-3 px-4 py-3 hover:bg-elevated/50"
                    >
                        <div class="flex items-center gap-3">
                            <div class="size-8 rounded-full overflow-hidden shrink-0 border border-default">
                                <NuxtImg :src="ingredient.image ?? '/images/inasal.webp'" class="w-full h-full object-cover"/>
                            </div>
                            <p class="font-medium">{{ ingredient.name }}</p>
                        </div>
                        <div class="text-right">
                            <p class="text-sm">{{ Number(ingredient.current_stock) }} {{ ingredient.unit }}</p>
                            <p class="text-xs text-muted">reorder at {{ Number(ingredient.reorder_level) }}</p>
                        </div>
                    </NuxtLink>
                </div>
                <div v-else class="p-8 text-center text-muted">
                    Everything's well stocked.
                </div>
            </div>

            <!-- Open purchase orders -->
            <div class="rounded-lg border border-default">
                <div class="flex flex-row justify-between items-center px-4 py-3.5 border-b border-default">
                    <h2 class="font-semibold">Open Purchase Orders</h2>
                    <UButton label="View All" variant="link" size="sm" to="/inventory/purchase-orders"/>
                </div>
                <div v-if="openPurchaseOrders.length" class="divide-y divide-default">
                    <NuxtLink
                        v-for="po in openPurchaseOrders.slice(0, 6)"
                        :key="po.uuid"
                        :to="`/inventory/purchase-orders/${po.uuid}`"
                        class="flex flex-row items-center justify-between gap-3 px-4 py-3 hover:bg-elevated/50"
                    >
                        <div>
                            <p class="font-medium">{{ po.order_number }}</p>
                            <p class="text-xs text-muted">{{ po.supplier.name }}</p>
                        </div>
                        <div class="flex items-center gap-3">
                            <p class="text-sm">{{ formatCurrency(po.total_cost) }}</p>
                            <PurchaseOrderStatusBadge :status="po.status"/>
                        </div>
                    </NuxtLink>
                </div>
                <div v-else class="p-8 text-center text-muted">
                    No open purchase orders.
                </div>
            </div>
        </div>

        <!-- Recent stock movements -->
        <div class="rounded-lg border border-default">
            <div class="flex flex-row justify-between items-center px-4 py-3.5 border-b border-default">
                <h2 class="font-semibold">Recent Stock Movements</h2>
            </div>
            <div v-if="recentMovements.length" class="divide-y divide-default">
                <NuxtLink
                    v-for="movement in recentMovements"
                    :key="movement.id"
                    :to="`/inventory/ingredients/${movement.ingredient_id}`"
                    class="flex flex-row items-center justify-between gap-3 px-4 py-3 hover:bg-elevated/50"
                >
                    <div class="flex items-center gap-3">
                        <UBadge :color="typeColor(movement.type)" :label="typeLabel(movement.type)" variant="subtle"/>
                        <div>
                            <p class="font-medium">{{ movement.ingredient.name }}</p>
                            <p v-if="movement.reason" class="text-xs text-muted">{{ movement.reason }}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-sm">
                            {{ movement.type === 'adjustment' ? 'Set to' : movement.type === 'in' ? '+' : '−' }}
                            {{ Number(movement.quantity) }} {{ movement.ingredient.unit }}
                        </p>
                        <p class="text-xs text-muted">{{ formatDate(movement.created_at, 'datetime') }}</p>
                    </div>
                </NuxtLink>
            </div>
            <div v-else class="p-8 text-center text-muted">
                No stock movements recorded yet.
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui'
import type { Ingredient } from '~/types/models/ingredient.types'
import type { PurchaseOrder } from '~/types/models/purchase_order.types'
import type { StockMovement, StockMovementType } from '~/types/models/stock_movement.types'
import type { IListResponse } from '~/types/response'

definePageMeta({
    middleware: 'require-auth',
    layout: 'inventory'
})

const { baseUrl, token } = useAPI()

const items = ref<BreadcrumbItem[]>([])

const { data: ingredients } = await useLazyFetch('/ingredients', {
    key: 'dashboard-ingredients',
    baseURL: baseUrl,
    headers: { authorization: token.value ?? '' },
    transform: (data: IListResponse<Ingredient>) => data.response.rows,
    default: () => [] as Ingredient[],
})

const lowStockIngredients = computed(() =>
    ingredients.value.filter((i) => Number(i.current_stock) <= Number(i.reorder_level))
)

const { data: purchaseOrders } = await useLazyFetch('/purchase-orders', {
    key: 'dashboard-purchase-orders',
    baseURL: baseUrl,
    headers: { authorization: token.value ?? '' },
    transform: (data: IListResponse<PurchaseOrder>) => data.response.rows,
    default: () => [] as PurchaseOrder[],
})

const openPurchaseOrders = computed(() =>
    purchaseOrders.value.filter((po) => po.status === 'pending' || po.status === 'ordered')
)

const { data: movements } = await useLazyFetch('/stock-movements', {
    key: 'dashboard-stock-movements',
    baseURL: baseUrl,
    headers: { authorization: token.value ?? '' },
    transform: (data: IListResponse<StockMovement>) => data.response.rows,
    default: () => [] as StockMovement[],
})

const recentMovements = computed(() => movements.value.slice(0, 8))

const { data: productCount } = await useLazyFetch('/products', {
    key: 'dashboard-product-count',
    baseURL: baseUrl,
    headers: { authorization: token.value ?? '' },
    query: { limit: 1 },
    transform: (data: IListResponse<unknown>) => data.response.count,
    default: () => 0,
})

function typeLabel(type: StockMovementType) {
    return type === 'in' ? 'In' : type === 'out' ? 'Out' : 'Adjustment'
}

function typeColor(type: StockMovementType) {
    return type === 'in' ? 'success' as const : type === 'out' ? 'error' as const : 'neutral' as const
}
</script>