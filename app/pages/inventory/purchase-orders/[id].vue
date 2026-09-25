<template>
    <div>
        <div class="mb-3">
            <PageHeader :title="purchaseOrder?.order_number ?? 'Purchase Order'" description="Purchase order details" :items :has-view="false"/>
        </div>

        <div class="my-2 flex flex-row justify-between">
            <UButton icon="lucide:arrow-left" label="Back to Purchase Orders" variant="ghost" color="neutral" to="/inventory/purchase-orders"/>
        </div>

        <div v-if="purchaseOrder" class="max-w-3xl space-y-6">
            <!-- Header -->
            <div class="rounded-lg border border-default p-5 space-y-4">
                <div class="flex flex-row justify-between items-start">
                    <div>
                        <p class="text-xs uppercase text-muted tracking-wide">Order Number</p>
                        <p class="text-lg font-semibold">{{ purchaseOrder.order_number }}</p>
                    </div>
                    <PurchaseOrderStatusBadge :status="purchaseOrder.status"/>
                </div>

                <div class="grid grid-cols-2 gap-6">
                    <div>
                        <p class="text-xs uppercase text-muted tracking-wide">Supplier</p>
                        <p class="mt-1">{{ purchaseOrder.supplier.name }}</p>
                    </div>
                    <div>
                        <p class="text-xs uppercase text-muted tracking-wide">Total Cost</p>
                        <p class="mt-1 font-medium">{{ formatCurrency(purchaseOrder.total_cost) }}</p>
                    </div>
                </div>

                <div class="grid grid-cols-3 gap-6 text-sm">
                    <div>
                        <p class="text-xs uppercase text-muted tracking-wide">Created</p>
                        <p class="mt-1">{{ formatDate(purchaseOrder.created_at, 'date-short') }}</p>
                    </div>
                    <div>
                        <p class="text-xs uppercase text-muted tracking-wide">Ordered</p>
                        <p class="mt-1">{{ purchaseOrder.ordered_at ? formatDate(purchaseOrder.ordered_at, 'date-short') : '—' }}</p>
                    </div>
                    <div>
                        <p class="text-xs uppercase text-muted tracking-wide">Received</p>
                        <p class="mt-1">{{ purchaseOrder.received_at ? formatDate(purchaseOrder.received_at, 'date-short') : '—' }}</p>
                    </div>
                </div>

                <!-- Status actions -->
                <div class="flex flex-row justify-end gap-2 pt-2 border-t border-default">
                    <template v-if="purchaseOrder.status === 'pending'">
                        <UButton label="Cancel Order" color="error" variant="soft" :loading="actionLoading" @click="onCancel"/>
                        <UButton label="Mark as Ordered" :loading="actionLoading" @click="onMarkAsOrdered"/>
                    </template>
                    <template v-else-if="purchaseOrder.status === 'ordered'">
                        <UButton label="Cancel Order" color="error" variant="soft" :loading="actionLoading" @click="onCancel"/>
                        <UButton label="Receive Order" color="success" :loading="actionLoading" @click="onReceive"/>
                    </template>
                </div>
            </div>

            <!-- Items -->
            <div class="space-y-3">
                <h2 class="text-lg font-semibold">Items</h2>
                <div class="divide-y divide-default rounded-lg border border-default">
                    <div
                        v-for="item in purchaseOrder.items"
                        :key="item.id"
                        class="flex flex-row items-center justify-between gap-3 px-4 py-3"
                    >
                        <div>
                            <p class="font-medium">{{ item.ingredient.name }}</p>
                            <p class="text-xs text-muted">{{ Number(item.quantity) }} {{ item.ingredient.unit }} × {{ formatCurrency(item.unit_cost) }}</p>
                        </div>
                        <p class="font-medium">{{ formatCurrency(item.subtotal) }}</p>
                    </div>
                </div>
            </div>
        </div>

        <div v-else class="max-w-3xl">
            <div class="rounded-lg border border-default p-10 text-center text-muted">
                Purchase order not found.
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui'
import type { PurchaseOrder } from '~/types/models/purchase_order.types'
import type { IResponse } from '~/types/response'

definePageMeta({
    layout: 'inventory'
})

const route = useRoute()
const { baseUrl, token } = useAPI()
const toast = useToast()

const fetchPurchaseOrder = () => $fetch<IResponse & { response: PurchaseOrder }>(`/purchase-orders/${route.params.id}`, {
    baseURL: baseUrl,
    headers: { authorization: token ?? '' }
})

const { data: purchaseOrder, refresh } = await useAsyncData(
    `purchase-order-${route.params.id}`,
    () => fetchPurchaseOrder(),
    {
        transform: (data: IResponse & { response: PurchaseOrder }) => data.response
    }
)

const items = computed<BreadcrumbItem[]>(() => [
    { label: 'Purchase Orders', to: '/inventory/purchase-orders' },
    { label: purchaseOrder.value?.order_number ?? 'Purchase Order', to: route.fullPath }
])

const actionLoading = ref(false)

async function runAction(action: 'order' | 'receive' | 'cancel', successMessage: string) {
    actionLoading.value = true
    try {
        const response = await $fetch<IResponse & { response: PurchaseOrder }>(`/purchase-orders/${route.params.id}/${action}`, {
            baseURL: baseUrl,
            method: 'PATCH',
            headers: { authorization: token ?? '' },
        })

        if (!response.success) {
            throw new Error(response.errorMessage || response.errorDescription || 'Action failed')
        }

        toast.add({ title: successMessage, color: 'success' })
        await refresh()
    } catch (error: any) {
        toast.add({
            title: 'Error',
            description: error?.data?.statusMessage || error?.data?.message || error?.message || 'Something went wrong',
            color: 'error'
        })
    } finally {
        actionLoading.value = false
    }
}

function onMarkAsOrdered() {
    runAction('order', 'Purchase order marked as ordered')
}

function onReceive() {
    runAction('receive', 'Purchase order received — stock updated')
}

function onCancel() {
    runAction('cancel', 'Purchase order cancelled')
}
</script>