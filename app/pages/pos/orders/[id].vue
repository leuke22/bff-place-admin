<template>
    <div>
        <div class="mb-3">
            <PageHeader :title="order?.order_number ?? 'Order'" description="Order details" :items :has-view="false"/>
        </div>

        <div class="my-2 flex flex-row justify-end">
            <UButton icon="lucide:arrow-left" label="Back to Orders" variant="ghost" color="neutral" to="/pos/orders"/>
        </div>

        <div v-if="order" class="max-w-3xl space-y-6">
            <div class="rounded-lg border border-default p-5 space-y-4">
                <div class="flex flex-row justify-between items-start">
                    <div>
                        <p class="text-xs uppercase text-muted tracking-wide">Order Number</p>
                        <p class="text-lg font-semibold">{{ order.order_number }}</p>
                    </div>
                    <OrderStatusBadge :status="order.status"/>
                </div>

                <div class="grid grid-cols-3 gap-6 text-sm">
                    <div>
                        <p class="text-xs uppercase text-muted tracking-wide">Type</p>
                        <p class="mt-1">{{ orderTypeLabel(order.order_type) }}</p>
                    </div>
                    <div>
                        <p class="text-xs uppercase text-muted tracking-wide">Cashier</p>
                        <p class="mt-1">{{ order.cashier ? `${order.cashier.first_name} ${order.cashier.last_name}` : '—' }}</p>
                    </div>
                    <div>
                        <p class="text-xs uppercase text-muted tracking-wide">Placed</p>
                        <p class="mt-1">{{ formatDate(order.created_at, 'datetime') }}</p>
                    </div>
                </div>

                <div v-if="nextOrderAction(order.status) || canCancelOrder(order.status) || canPayOrder(order.status)" class="flex flex-row justify-end gap-2 pt-2 border-t border-default">
                    <UButton
                        v-if="canCancelOrder(order.status)"
                        label="Cancel Order"
                        color="error"
                        variant="soft"
                        :disabled="updatingUuid === order.uuid"
                        @click="onCancel"
                    />
                    <UButton
                        v-if="nextOrderAction(order.status)"
                        :label="nextOrderAction(order.status)!.label"
                        :icon="nextOrderAction(order.status)!.icon"
                        variant="outline"
                        :loading="updatingUuid === order.uuid"
                        @click="onAdvance"
                    />
                    <UButton
                        v-if="canPayOrder(order.status)"
                        label="Take Payment"
                        icon="lucide:banknote"
                        color="success"
                        @click="paymentModalOpen = true"
                    />
                </div>
            </div>

            <div class="space-y-3">
                <h2 class="text-lg font-semibold">Items</h2>
                <div class="divide-y divide-default rounded-lg border border-default">
                    <div
                        v-for="item in order.items"
                        :key="item.id"
                        class="flex flex-row items-center justify-between gap-3 px-4 py-3"
                    >
                        <div>
                            <p class="font-medium">{{ item.quantity }}× {{ item.product.name }}</p>
                            <p class="text-xs text-muted">{{ formatCurrency(item.unit_price) }} each</p>
                            <p v-if="item.notes" class="text-xs text-muted italic">“{{ item.notes }}”</p>
                        </div>
                        <p class="font-medium">{{ formatCurrency(item.subtotal) }}</p>
                    </div>
                </div>

                <div class="space-y-1 text-sm pt-2">
                    <div class="flex justify-between text-muted">
                        <span>Subtotal</span>
                        <span>{{ formatCurrency(order.subtotal) }}</span>
                    </div>
                    <div v-if="Number(order.discount) > 0" class="flex justify-between text-muted">
                        <span>Discount</span>
                        <span>−{{ formatCurrency(order.discount) }}</span>
                    </div>
                    <div class="flex justify-between text-lg font-semibold">
                        <span>Total</span>
                        <span>{{ formatCurrency(order.total) }}</span>
                    </div>
                </div>
            </div>
        </div>

        <div v-else class="max-w-3xl">
            <div class="rounded-lg border border-default p-10 text-center text-muted">
                Order not found.
            </div>
        </div>

        <UModal v-model:open="paymentModalOpen" title="Take Payment" :description="order ? `Order ${order.order_number}` : ''">
            <template #body>
                <OrderPaymentModal v-if="order" :order="order" @success="onPaid" @cancel="paymentModalOpen = false"/>
            </template>
        </UModal>
    </div>
</template>

<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui'
import type { Order } from '~/types/models/order.types'
import type { IResponse } from '~/types/response'

definePageMeta({
    middleware: 'require-auth',
    layout: 'pos'
})

const route = useRoute()
const { baseUrl, token } = useAPI()
const { updateStatus, updatingUuid } = useOrderActions()

const { data: order, refresh } = await useAsyncData(
    `pos-order-${route.params.id}`,
    () => $fetch<IResponse & { response: Order }>(`/orders/${route.params.id}`, {
        baseURL: baseUrl,
        headers: { authorization: token ?? '' },
    }),
    {
        transform: (data: IResponse & { response: Order }) => data.response
    }
)

const items = computed<BreadcrumbItem[]>(() => [
    { label: 'Orders', to: '/pos/orders' },
    { label: order.value?.order_number ?? 'Order', to: route.fullPath }
])

const paymentModalOpen = ref(false)

function onPaid() {
    paymentModalOpen.value = false
    refresh()
}

async function onAdvance() {
    if (!order.value) return
    const action = nextOrderAction(order.value.status)
    if (!action) return
    if (await updateStatus(order.value, action.status)) refresh()
}

async function onCancel() {
    if (!order.value) return
    if (!confirm(`Cancel order ${order.value.order_number}?`)) return
    if (await updateStatus(order.value, 'cancelled')) refresh()
}
</script>