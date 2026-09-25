<template>
    <div>
        <div class="mb-3">
            <PageHeader v-model:view="view" title="Suppliers" description="Manage your ingredient suppliers" :items/>
        </div>
        <div class="flex flex-row justify-end gap-3 mb-3">
            <UButton icon="lucide:refresh-ccw" variant="outline" color="neutral" :loading="status === 'pending'" @click="refresh()"/>
            <UButton icon="lucide:circle-plus" label="Add Supplier" to="/inventory/suppliers/create"/>
        </div>
        <div>
            <PageView :view>
                <template #grid-filter>
                    <PageViewFilter v-model:search="filter.search" placeholder="Search suppliers">
                        <template #filter>
                            <USelectMenu v-model="filter.status" :items="statusOptions" value-key="value" label-key="label" placeholder="All Status"/>
                        </template>
                    </PageViewFilter>
                </template>
                <template #grid-item>
                    <SupplierCard
                        v-for="supplier in filteredSuppliers"
                        :key="supplier.uuid"
                        :supplier
                        @view="onView"
                        @edit="onEdit"
                        @delete="onDelete"
                    />
                </template>
                <template #grid-footer>
                    <div class="flex flex-row justify-end">
                        <UPagination v-model:page="pagination.page" :sibling-count="2" :total="pagination.total"/>
                    </div>
                </template>
                <template #table>
                    <div class="w-full pb-4">
                        <div class="px-4 py-3.5 border-b border-accented">
                            <PageViewFilter v-model:search="filter.search" placeholder="Search suppliers">
                                <template #filter>
                                    <USelectMenu v-model="filter.status" :items="statusOptions" value-key="value" label-key="label" placeholder="All Status"/>
                                </template>
                            </PageViewFilter>
                        </div>

                        <UTable ref="table" :data="filteredSuppliers" :columns="supplierColumn">
                            <template #supplier-cell="{ row }">
                                <div>
                                    <h1 class="text-lg font-semibold">{{ row.original.name }}</h1>
                                    <p class="dark:text-gray-500 text-gray-400">{{ row.original.contact_person || '—' }}</p>
                                </div>
                            </template>
                            <template #contact-cell="{ row }">
                                <p>{{ row.original.contact_number || '—' }}</p>
                                <p class="text-sm text-muted">{{ row.original.email || '—' }}</p>
                            </template>
                            <template #status-cell="{ row }">
                                <UBadge :color="row.original.is_active ? 'success' : 'error'" :label="row.original.is_active ? 'Active' : 'Inactive'" variant="subtle"/>
                            </template>
                            <template #action-cell="{ row }">
                                <div class="flex flex-row gap-2">
                                    <UTooltip text="View Supplier">
                                        <UButton icon="lucide:eye" variant="outline" color="neutral" @click="onView(row.original)"/>
                                    </UTooltip>
                                    <UTooltip text="Edit Supplier">
                                        <UButton icon="lucide:edit" variant="outline" color="tertiary" @click="onEdit(row.original)"/>
                                    </UTooltip>
                                    <UTooltip text="Delete Supplier">
                                        <UButton icon="lucide:trash-2" variant="outline" color="error" @click="onDelete(row.original)"/>
                                    </UTooltip>
                                </div>
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
import type { Supplier } from '~/types/models/supplier.types';
import type { IListResponse } from '~/types/response';

definePageMeta({
    layout: 'inventory'
})

const { baseUrl, token } = useAPI();
const toast = useToast();

const items = ref<BreadcrumbItem[]>([
    { label: 'Suppliers', to: '/suppliers' },
])

const view = ref<ValueType>('grid');

const pagination: Pagination = reactive({
    page: 1,
    limit: 8,
    total: 0
})

const filter = reactive({
    search: '',
    status: 'all' as 'all' | 'active' | 'inactive'
})

const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
]

const supplierColumn: TableColumn<Supplier>[] = [
    { accessorKey: 'supplier', header: 'Supplier' },
    { accessorKey: 'contact', header: 'Contact' },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'action', header: 'Actions' }
]

const fetchSuppliers = () => $fetch<IListResponse<Supplier>>('/suppliers', {
    baseURL: baseUrl,
    headers: { authorization: token ?? '' },
});

const { data: suppliers, refresh, status } = useAsyncData(
    'suppliers-list',
    () => fetchSuppliers(),
    {
        transform: (data: IListResponse<Supplier>) => {
            pagination.total = data.response.count
            return data.response.rows
        },
        default: () => [] as Supplier[]
    }
)

const filteredSuppliers = computed(() => {
    let list = suppliers.value

    if (filter.status !== 'all') {
        list = list.filter((s) => (filter.status === 'active' ? s.is_active : !s.is_active))
    }

    if (filter.search) {
        const search = filter.search.toLowerCase()
        list = list.filter((s) => s.name.toLowerCase().includes(search))
    }

    return list
})

function onView(supplier: Supplier) {
    navigateTo(`/inventory/suppliers/${supplier.uuid}`)
}

function onEdit(supplier: Supplier) {
    navigateTo({ path: `/inventory/suppliers/${supplier.uuid}`, query: { isEdit: 'true' } })
}

async function onDelete(supplier: Supplier) {
    try {
        await $fetch(`/suppliers/${supplier.uuid}`, {
            baseURL: baseUrl,
            method: 'DELETE',
            headers: { authorization: token ?? '' },
        })
        toast.add({ title: 'Supplier deleted', color: 'success' })
        refresh()
    } catch (error: any) {
        toast.add({
            title: 'Error deleting supplier',
            description: error?.data?.statusMessage || error?.data?.message || error?.message || 'Something went wrong',
            color: 'error'
        })
    }
}
</script>