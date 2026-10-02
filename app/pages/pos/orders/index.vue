<template>
    <div>
        <div class="mb-3">
            <PageHeader title="Orders" description="Track and manage customer orders" :items :has-view="false"/>
        </div>

        <div class="flex flex-row justify-between items-center gap-3 mb-4">
            <div class="flex flex-row gap-2 overflow-x-auto">
                <UButton
                    v-for="tab in tabs"
                    :key="tab.value"
                    :label="`${tab.label} (${tabCount(tab.value)})`"
                    color="neutral"
                    size="sm"
                    class="shrink-0"
                    :variant="activeTab === tab.value ? 'solid' : 'outline'"
                    @click="activeTab = tab.value"
                />
            </div>
            <div class="flex flex-row gap-3">
                <UButton icon="lucide:refresh-ccw" variant="outline" color="neutral" :loading="status === 'pending'" @click="refresh()"/>
                <UButton icon="lucide:circle-plus" label="New Order" to="/pos"/>
            </div>
        </div>

        <div v-if="filteredOrders.length" class="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            <div
                v-for="order in filteredOrders"
                :key="order.uuid"
                class="rounded-lg border border-default bg-default p-4 flex flex-col gap-3 cursor-pointer"
                @click="toggleExpand(order.uuid)"
            >
                <div class="flex flex-row justify-between items-start">
                    <div>
                        <NuxtLink :to="`/pos/orders/${order.uuid}`" class="text-lg font-semibold hover:underline" @click.stop>
                            {{ order.order_number }}
                        </NuxtLink>
                        <div class="flex items-center gap-1.5 text-sm text-muted">
                            <UIcon :name="order.order_type === 'dine_in' ? 'lucide:utensils' : 'lucide:shopping-bag'" class="size-4"/>
                            <span>{{ orderTypeLabel(order.order_type) }}</span>
                            <span>·</span>
                            <span>{{ formatDate(order.created_at, 'time') }}</span>
                        </div>
                    </div>
                    <OrderStatusBadge :status="order.status"/>
                </div>

                <!-- Collapsed: quick summary -->
                <p v-if="expandedUuid !== order.uuid" class="text-sm line-clamp-2">
                    {{ order.items.map((i) => `${i.quantity} \u00D7 ${i.product.name}`).join(', ') }}
                </p>

                <!-- Expanded: itemized breakdown + payment, if any -->
                <div v-else class="space-y-2">
                    <div v-for="item in order.items" :key="item.id" class="flex flex-row justify-between text-sm">
                        <span>{{ item.quantity }}× {{ item.product.name }}</span>
                        <span class="text-muted">{{ formatCurrency(item.subtotal) }}</span>
                    </div>
                    <div v-if="order.payments?.length" class="pt-2 border-t border-default text-sm text-muted capitalize">
                        Paid via {{ order.payments[0]?.method }} · {{ formatDate(order.payments[0]?.paid_at, 'datetime') }}
                    </div>
                </div>

                <div class="flex flex-row justify-between items-center pt-2 border-t border-default">
                    <p class="font-semibold">{{ formatCurrency(order.total) }}</p>
                    <div class="flex flex-row gap-2" @click.stop>
                        <UButton
                            v-if="canCancelOrder(order.status)"
                            label="Cancel"
                            color="error"
                            variant="ghost"
                            size="sm"
                            :disabled="updatingUuid === order.uuid"
                            @click="onCancel(order)"
                        />
                        <UButton
                            v-if="nextOrderAction(order.status)"
                            :label="nextOrderAction(order.status)!.label"
                            :icon="nextOrderAction(order.status)!.icon"
                            variant="outline"
                            size="sm"
                            :loading="updatingUuid === order.uuid"
                            @click="onAdvance(order)"
                        />
                        <UButton
                            v-if="canPayOrder(order.status)"
                            label="Pay"
                            icon="lucide:banknote"
                            color="success"
                            size="sm"
                            @click="openPayment(order)"
                        />
                    </div>
                </div>
            </div>
        </div>

        <div v-else class="rounded-lg border border-default p-10 text-center text-muted">
            No orders found.
        </div>

        <UModal v-model:open="paymentModalOpen" title="Take Payment" :description="payingOrder ? `Order ${payingOrder.order_number}` : ''">
            <template #body>
                <OrderPaymentModal v-if="payingOrder" :order="payingOrder" @success="onPaid" @cancel="paymentModalOpen = false"/>
            </template>
        </UModal>
    </div>
</template>

<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui'
import type { Order, OrderStatus } from '~/types/models/order.types'
import type { IListResponse } from '~/types/response'

definePageMeta({
    middleware: 'require-auth',
    layout: 'pos'
})

const { baseUrl, token } = useAPI()
const { updateStatus, updatingUuid } = useOrderActions()

const items = ref<BreadcrumbItem[]>([
    { label: 'Orders', to: '/pos/orders' },
])

type Tab = 'active' | 'all' | OrderStatus

const tabs: { value: Tab; label: string }[] = [
    { value: 'active', label: 'Active' },
    { value: 'pending', label: 'Pending' },
    { value: 'preparing', label: 'Preparing' },
    { value: 'ready', label: 'Ready' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'all', label: 'All' },
]

const activeTab = ref<Tab>('active')
const expandedUuid = ref<string | null>(null)

const paymentModalOpen = ref(false)
const payingOrder = ref<Order | null>(null)

const { data: orders, refresh, status } = useAsyncData(
    'pos-orders',
    () => $fetch<IListResponse<Order>>('/orders', {
        baseURL: baseUrl,
        headers: { authorization: token ?? '' },
        query: { limit: 100 },
    }),
    {
        transform: (data: IListResponse<Order>) => data.response.rows,
        default: () => [] as Order[]
    }
)

function matchesTab(order: Order, tab: Tab) {
    if (tab === 'all') return true
    if (tab === 'active') return ['pending', 'preparing', 'ready'].includes(order.status)
    return order.status === tab
}

function tabCount(tab: Tab) {
    return orders.value.filter((o) => matchesTab(o, tab)).length
}

const filteredOrders = computed(() => orders.value.filter((o) => matchesTab(o, activeTab.value)))

function toggleExpand(uuid: string) {
    expandedUuid.value = expandedUuid.value === uuid ? null : uuid
}

async function onAdvance(order: Order) {
    const action = nextOrderAction(order.status)
    if (!action) return
    if (await updateStatus(order, action.status)) refresh()
}

async function onCancel(order: Order) {
    if (!confirm(`Cancel order ${order.order_number}?`)) return
    if (await updateStatus(order, 'cancelled')) refresh()
}

function openPayment(order: Order) {
    payingOrder.value = order
    paymentModalOpen.value = true
}

function onPaid() {
    paymentModalOpen.value = false
    refresh()
}

// Keep the list fresh without anyone having to hit refresh
let timer: ReturnType<typeof setInterval> | undefined

onMounted(() => {
    timer = setInterval(() => {
        if (status.value !== 'pending') refresh()
    }, 15000)
})

onBeforeUnmount(() => {
    if (timer) clearInterval(timer)
})
</script>