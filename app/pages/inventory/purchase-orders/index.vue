<template>
    <div>
        <div class="mb-3">
            <PageHeader v-model:view="view" title="Purchase Orders" description="Manage stock orders from suppliers" :items/>
        </div>
        <div class="flex flex-row justify-end gap-3 mb-3">
            <UButton icon="lucide:refresh-ccw" variant="outline" color="neutral" :loading="status === 'pending'" @click="refresh()"/>
            <UButton icon="lucide:circle-plus" label="Create Purchase Order" to="/inventory/purchase-orders/create"/>
        </div>
        <div>
            <PageView :view>
                <template #grid-filter>
                    <PageViewFilter v-model:search="filter.search" placeholder="Search by order number">
                        <template #filter>
                            <USelectMenu v-model="filter.status" :items="statusOptions" value-key="value" label-key="label" placeholder="All Status"/>
                        </template>
                    </PageViewFilter>
                </template>
                <template #grid-item>
                    <div
                        v-for="po in filteredOrders"
                        :key="po.uuid"
                        class="rounded-lg border border-default overflow-hidden bg-default p-4 flex flex-col gap-3 cursor-pointer"
                        @click="onView(po)"
                    >
                        <div class="flex flex-row justify-between items-start">
                            <div>
                                <h1 class="text-lg font-semibold">{{ po.order_number }}</h1>
                                <p class="text-sm dark:text-gray-500 text-gray-400">{{ po.supplier.name }}</p>
                            </div>
                            <PurchaseOrderStatusBadge :status="po.status"/>
                        </div>
                        <div class="flex flex-row justify-between items-center">
                            <p class="text-sm text-muted">{{ po.items.length }} item(s)</p>
                            <p class="font-medium">{{ formatCurrency(po.total_cost) }}</p>
                        </div>
                        <p class="text-xs text-muted">{{ formatDate(po.created_at, 'date-long') }}</p>
                    </div>
                </template>
                <template #grid-footer>
                    <div class="flex flex-row justify-end">
                        <UPagination v-model:page="pagination.page" :sibling-count="2" :total="pagination.total"/>
                    </div>
                </template>
                <template #table>
                    <div class="w-full pb-4">
                        <div class="px-4 py-3.5 border-b border-accented">
                            <PageViewFilter v-model:search="filter.search" placeholder="Search by order number">
                                <template #filter>
                                    <USelectMenu v-model="filter.status" :items="statusOptions" value-key="value" label-key="label" placeholder="All Status"/>
                                </template>
                            </PageViewFilter>
                        </div>

                        <UTable ref="table" :data="filteredOrders" :columns="orderColumn">
                            <template #order-cell="{ row }">
                                <div>
                                    <h1 class="text-lg font-semibold">{{ row.original.order_number }}</h1>
                                    <p class="dark:text-gray-500 text-gray-400">{{ row.original.supplier.name }}</p>
                                </div>
                            </template>
                            <template #items-cell="{ row }">
                                <p>{{ row.original.items.length }} item(s)</p>
                            </template>
                            <template #total_cost-cell="{ row }">
                                <p class="font-medium">{{ formatCurrency(row.original.total_cost) }}</p>
                            </template>
                            <template #status-cell="{ row }">
                                <PurchaseOrderStatusBadge :status="row.original.status"/>
                            </template>
                            <template #created_date-cell="{ row }">
                                <h1>{{ formatDate(row.original.created_at, 'date-long') }}</h1>
                                <p>{{ formatDate(row.original.created_at, 'time') }}</p>
                            </template>
                            <template #action-cell="{ row }">
                                <UTooltip text="View Purchase Order">
                                    <UButton icon="lucide:eye" variant="outline" color="neutral" @click="onView(row.original)"/>
                                </UTooltip>
                            </template>
                        </UTable>

                        <div class="flex justify-end border-t border-default pt-4 px-4">
                            <UPagination v-model:page="pagination.page" :sibling-count="2" :total="pagination.total"/>
                        </div>
                    </div>
                </template>
            </PageView>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { BreadcrumbItem, TableColumn } from '@nuxt/ui';
import type { Pagination, ValueType } from '~/types/component';
import type { PurchaseOrder } from '~/types/models/purchase_order.types';
import type { IListResponse } from '~/types/response';

definePageMeta({
    layout: 'inventory'
})

const { baseUrl, token } = useAPI();

const items = ref<BreadcrumbItem[]>([
    { label: 'Purchase Orders', to: '/purchase-orders' },
])

const view = ref<ValueType>('grid');

const pagination: Pagination = reactive({
    page: 1,
    limit: 8,
    total: 0
})

const filter = reactive({
    search: '',
    status: 'all' as 'all' | 'pending' | 'ordered' | 'received' | 'cancelled'
})

const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'ordered', label: 'Ordered' },
    { value: 'received', label: 'Received' },
    { value: 'cancelled', label: 'Cancelled' },
]

const orderColumn: TableColumn<PurchaseOrder>[] = [
    { accessorKey: 'order', header: 'Order' },
    { accessorKey: 'items', header: 'Items' },
    { accessorKey: 'total_cost', header: 'Total' },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'created_date', header: 'Date Created' },
    { accessorKey: 'action', header: 'Actions' }
]

const fetchOrders = () => $fetch<IListResponse<PurchaseOrder>>('/purchase-orders', {
    baseURL: baseUrl,
    headers: { authorization: token ?? '' },
});

const { data: orders, refresh, status } = useAsyncData(
    'purchase-orders-list',
    () => fetchOrders(),
    {
        transform: (data: IListResponse<PurchaseOrder>) => {
            pagination.total = data.response.count
            return data.response.rows
        },
        default: () => [] as PurchaseOrder[]
    }
)

const filteredOrders = computed(() => {
    let list = orders.value

    if (filter.status !== 'all') {
        list = list.filter((po) => po.status === filter.status)
    }

    if (filter.search) {
        const search = filter.search.toLowerCase()
        list = list.filter((po) => po.order_number.toLowerCase().includes(search))
    }

    return list
})

function onView(po: PurchaseOrder) {
    navigateTo(`/inventory/purchase-orders/${po.uuid}`)
}
</script>