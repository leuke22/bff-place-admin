<template>
    <UModal v-model:open="open" title="Void Order" description="Cancel an order that has already been placed">
        <template #body>
            <div v-if="status === 'pending'" class="text-center text-muted py-6">Loading orders...</div>

            <div v-else-if="activeOrders.length" class="divide-y divide-default rounded-lg border border-default">
                <div v-for="order in activeOrders" :key="order.uuid" class="flex flex-row items-center justify-between gap-3 px-4 py-3">
                    <div class="min-w-0">
                        <div class="flex items-center gap-2">
                            <p class="font-medium">{{ order.order_number }}</p>
                            <OrderStatusBadge :status="order.status"/>
                        </div>
                        <p class="text-xs text-muted truncate">
                            {{ order.items.map((i) => `${i.quantity}× ${i.product.name}`).join(', ') }}
                        </p>
                        <p class="text-xs text-muted">{{ formatCurrency(order.total) }} · {{ formatDate(order.created_at, 'time') }}</p>
                    </div>
                    <UButton
                        label="Void"
                        color="error"
                        variant="soft"
                        size="sm"
                        :loading="updatingUuid === order.uuid"
                        @click="onVoid(order)"
                    />
                </div>
            </div>
            <div v-else class="rounded-lg border border-default p-8 text-center text-muted text-sm">
                No active orders to void.
            </div>
        </template>
    </UModal>
</template>

<script setup lang="ts">
import type { Order } from '~/types/models/order.types'
import type { IListResponse } from '~/types/response'

const open = defineModel<boolean>('open', { default: false })

const { baseUrl, token } = useAPI()
const toast = useToast()
const { updateStatus, updatingUuid } = useOrderActions()

const orders = ref<Order[]>([])
const status = ref<'idle' | 'pending' | 'error'>('idle')

// Same states the Orders page treats as cancellable.
const activeOrders = computed(() => orders.value.filter((o) => canCancelOrder(o.status)))

async function load() {
    status.value = 'pending'
    try {
        const response = await $fetch<IListResponse<Order>>('/orders', {
            baseURL: baseUrl,
            headers: { authorization: token.value ?? '' },
            query: { limit: 100 },
        })
        orders.value = response.response.rows
        status.value = 'idle'
    } catch (error: any) {
        status.value = 'error'
        toast.add({
            title: 'Error loading orders',
            description: error?.data?.message || error?.message || 'Something went wrong',
            color: 'error'
        })
    }
}

watch(open, (isOpen) => {
    if (isOpen) load()
})

async function onVoid(order: Order) {
    if (!confirm(`Void order ${order.order_number}? This cancels the order.`)) return
    if (await updateStatus(order, 'cancelled')) load()
}
</script>
