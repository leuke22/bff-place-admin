<template>
    <div>
        <div class="mb-3">
            <PageHeader v-model:view="view" title="Categories" description="Manage your product categories" :items/>
        </div>
        <div class="flex flex-row justify-end gap-3 mb-3">
            <UButton icon="lucide:refresh-ccw" variant="outline" color="neutral" :loading="status === 'pending'" @click="refresh()"/>
            <UButton icon="lucide:circle-plus" label="Add Category" to="/categories/create"/>
        </div>
        <div>
            <PageView :view>
                <template #grid-filter>
                    <PageViewFilter v-model:search="filter.search" placeholder="Search categories">
                        <template #filter>
                            <USelectMenu v-model="filter.status" :items="statusOptions" value-key="value" label-key="label" placeholder="All Status"/>
                        </template>
                    </PageViewFilter>
                </template>
                <template #grid-item>
                    <CategoryCard
                        v-for="category in categories"
                        :key="category.uuid"
                        :category
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
                            <PageViewFilter v-model:search="filter.search" placeholder="Search categories">
                                <template #filter>
                                    <USelectMenu v-model="filter.status" :items="statusOptions" value-key="value" label-key="label" placeholder="All Status"/>
                                </template>
                            </PageViewFilter>
                        </div>

                        <UTable ref="table" :data="categories" :columns="categoryColumn">
                            <template #category-cell="{ row }">
                                <div class="flex flex-row gap-4 items-center">
                                    <div class="size-15 rounded-lg overflow-hidden shrink-0">
                                        <NuxtImg :src="row.original.image ?? '/images/inasal.webp'" class="w-full h-full object-cover"/>
                                    </div>
                                    <div class="flex items-center gap-3">
                                        <div
                                            class="size-8 rounded-full flex items-center justify-center shrink-0"
                                            :style="{ backgroundColor: row.original.color }"
                                        >
                                            <UIcon :name="row.original.icon" class="size-4 text-white"/>
                                        </div>
                                        <div>
                                            <h1 class="text-lg font-semibold">{{ row.original.name }}</h1>
                                            <p class="dark:text-gray-500 text-gray-400">{{ row.original.description }}</p>
                                        </div>
                                    </div>
                                </div>
                            </template>
                            <template #products_count-cell="{ row }">
                                <div class="flex items-center gap-1.5">
                                    <UIcon name="lucide:box" class="size-4"/>
                                    <span>{{ row.original.products_count }} products</span>
                                </div>
                            </template>
                            <template #status-cell="{ row }">
                                <UBadge :color="row.original.is_active ? 'success' : 'error'" :label="row.original.is_active ? 'Active' : 'Inactive'" variant="subtle"/>
                            </template>
                            <template #created_date-cell="{ row }">
                                <h1>{{ formatDate(row.original.created_at, 'date-long') }}</h1>
                                <p>{{ formatDate(row.original.created_at, 'time') }} </p>
                            </template>
                            <template #action-cell="{ row }">
                                <div class="flex flex-row gap-2">
                                    <UTooltip text="View Category">
                                        <UButton icon="lucide:eye" variant="outline" color="neutral" @click="onView(row.original)"/>
                                    </UTooltip>
                                    <UTooltip text="Edit Category">
                                        <UButton icon="lucide:edit" variant="outline" color="tertiary" @click="onEdit(row.original)"/>
                                    </UTooltip>
                                    <UTooltip text="Delete Category">
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
import type { CategoryProductCount } from '~/types/models/category.types';
import type { IListResponse } from '~/types/response';

definePageMeta({
    layout: 'inventory'
})

const { baseUrl, token } = useAPI();
const toast = useToast();

const items = ref<BreadcrumbItem[]>([
    {
        label: 'Categories',
        to: '/categories'
    },
])

const view = ref<ValueType>('grid');

const pagination: Pagination = reactive({
    page: 1,
    limit: 8,
    total: 0
})

// Local filter shape — add a CategoryFilter type alongside ProductFilter in
// ~/types/component if you'd rather keep this typed there instead.
const filter = reactive({
    search: '',
    status: 'all' as 'all' | 'active' | 'inactive'
})

const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
]

const categoryColumn: TableColumn<CategoryProductCount>[] = [
    { accessorKey: 'category', header: 'Category' },
    { accessorKey: 'products_count', header: 'Products' },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'created_date', header: 'Date Created' },
    { accessorKey: 'action', header: 'Actions' }
]

const fetchCategories = () => $fetch<IListResponse<CategoryProductCount>>('/categories/product-count', {
    baseURL: baseUrl,
    headers: { authorization: token ?? '' },
    query: {
        page: pagination.page,
        limit: pagination.limit,
        search: filter.search || undefined,
        status: filter.status !== 'all' ? filter.status : undefined,
    }
});

const { data: categories, refresh, status } = useAsyncData(
    'categories-list-product-count',
    () => fetchCategories(),
    {
        watch: [() => pagination.page, () => filter.search, () => filter.status],
        transform: (data: IListResponse<CategoryProductCount>) => {
            pagination.total = data.response.count
            return data.response.rows
        },
        default: () => [] as CategoryProductCount[]
    }
)

function onView(category: CategoryProductCount) {
    navigateTo(`/inventory/categories/${category.uuid}`)
}

function onEdit(category: CategoryProductCount) {
    navigateTo({ path: `/inventory/categories/${category.uuid}`, query: { isEdit: 'true' } })
}

async function onDelete(category: CategoryProductCount) {
    try {
        await $fetch(`/categories/${category.id}`, {
            baseURL: baseUrl,
            method: 'DELETE',
            headers: { authorization: token ?? '' },
        })
        toast.add({ title: 'Category deleted', color: 'success' })
        refresh()
    } catch (error: any) {
        toast.add({
            title: 'Error deleting category',
            description: error?.data?.statusMessage || error?.data?.message || error?.message || 'Something went wrong',
            color: 'error'
        })
    }
}
</script>