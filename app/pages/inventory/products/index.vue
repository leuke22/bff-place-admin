<template>
    <div>
        <div class="mb-3">
            <PageHeader v-model:view="view" title="Products" description="Manage your products" :items/>
        </div>
        <div class="flex flex-row justify-end gap-3 mb-3">
            <UButton icon="lucide:refresh-ccw" variant="outline" color="neutral" @click="() => { refresh }"/>
            <UButton icon="lucide:plus" label="Add Product" to="/inventory/products/create"/>
        </div>
        <div>
            <PageView :view>
                <template #grid-filter>
                    <PageViewFilter v-model:search="filter.search" placeholder="Search by Name">
                        <template #filter>
                            <USelectMenu v-model="filter.category" :items="categories" value-key="value" label-key="label" placeholder="Select Category"/>
                        </template>
                    </PageViewFilter>
                </template>
                <template #grid-item>
                    <ProductCard v-for="product in products" :key="product.uuid" :product/>
                </template>
                <template #grid-footer>
                    <div class="flex flex-row items-center justify-end gap-4">
                        <div class="flex items-center gap-2 text-sm text-muted"><span>Rows per page</span><USelect v-model="pagination.limit" :items="pageSizeOptions" class="w-20" aria-label="Rows per page" /></div>
                        <UPagination v-model:page="pagination.page" :items-per-page="pagination.limit" :sibling-count="2" :total="pagination.total"/>
                    </div>
                </template>
                <template #table>
                    <div class="w-full pb-4">
                        <div class="px-4 py-3.5 border-b border-accented">
                            <PageViewFilter v-model:search="filter.search" placeholder="Search by Name">
                                <template #filter>
                                    <USelectMenu v-model="filter.category" :items="categories" value-key="value" label-key="label" placeholder="Select Category"/>
                                </template>
                            </PageViewFilter>
                        </div>

                        <UTable ref="table" :data="products" :columns="productColumn" >
                            <template #product-cell="{ row }">
                                <div class="flex flex-row gap-4">
                                    <div class="size-15 rounded-lg overflow-hidden">
                                        <NuxtImg :src="row.original.image ?? '/images/inasal.webp'" class="w-full"/>
                                    </div>
                                    <div>
                                        <h1 class="text-lg font-semibold">{{ row.original.name }}</h1>
                                        <p>{{ row.original.description }}</p>
                                    </div>
                                </div>
                            </template>
                            <template #category-cell="{ row }">
                                <div class="flex flex-wrap gap-1">
                                    <UBadge
                                        v-for="category in row.original.categories"
                                        :key="category.id"
                                        :label="category.name"
                                        variant="subtle"
                                        :style="{ backgroundColor: category.color, color: 'white' }"
                                    >
                                        <template #leading>
                                            <UIcon :name="category.icon" class="size-3" />
                                        </template>
                                    </UBadge>
                                </div>
                            </template>
                            <template #price-cell="{ row }">
                                <p>{{ formatCurrency(row.original.price) }}</p>
                            </template>
                            <template #status-cell="{ row }">
                                <UBadge :color="row.original.is_active ? 'success' : 'error'" :label="row.original.is_active ? 'Active' : 'Inactive'"/>
                            </template>
                            <template #created_date-cell="{ row }">
                                <h1>{{ formatDate(row.original.created_at, 'date-long') }}</h1>
                                <p>{{ formatDate(row.original.created_at, 'time') }} </p>
                            </template>
                            <template #action-cell="{ row }">
                                <div class="flex flex-row gap-2">
                                    <UTooltip text="View Product">
                                        <UButton icon="lucide:eye" variant="outline" color="neutral" :to="`/inventory/products/${row.original.uuid}`"/>
                                    </UTooltip>
                                    <UTooltip text="Edit Product">
                                        <UButton icon="lucide:edit" variant="outline" color="tertiary" :to="{ path: `/inventory/products/${row.original.uuid}`, query: { isEdit: 'true' } }"/>
                                    </UTooltip>
                                    <UTooltip text="Delete Product">
                                        <UButton icon="lucide:trash-2" variant="outline" color="error"/>
                                    </UTooltip>
                                </div>
                            </template>
                        </UTable>

                        <div class="flex items-center justify-end gap-4 border-t border-default pt-4 px-4">
                            <div class="flex items-center gap-2 text-sm text-muted"><span>Rows per page</span><USelect v-model="pagination.limit" :items="pageSizeOptions" class="w-20" aria-label="Rows per page" /></div>
                            <UPagination v-model:page="pagination.page" :items-per-page="pagination.limit" :sibling-count="2" :total="pagination.total"/>
                        </div>
                    </div>
                </template>
            </PageView>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { BreadcrumbItem, TableColumn } from '@nuxt/ui';
import type { Pagination, ProductFilter, ValueType } from '~/types/component';
import type { Category } from '~/types/models/category.types';
import type { Product } from '~/types/models/product.types';
import type { IListResponse } from '~/types/response';

definePageMeta({
    layout: 'inventory'
})

const { baseUrl, token } = useAPI();

const items = ref<BreadcrumbItem[]>([
    {
        label: 'Products',
        to: '/products'
    },
])

const view = ref<ValueType>('grid');
const pagination: Pagination = reactive({
    page: 1,
    limit: 8,
    total: 0
})
const pageSizeOptions = [6, 8, 12, 24, 48]

const filter: ProductFilter = reactive({
    search: '',
    category: 0
})

const productColumn: TableColumn<Product>[] = [
    { accessorKey: 'product', header: 'Product' },
    { accessorKey: 'category', header: 'Category' },
    { accessorKey: 'price', header: 'Price' },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'created_date', header: 'Date Created' },
    { accessorKey: 'action', header: 'Actions' }
]

const fetchProducts = () => $fetch<IListResponse<Product>>('/products', {
    baseURL: baseUrl,
    headers: { authorization: token.value ?? '' },
    query: {
        page: pagination.page,
        limit: pagination.limit,
    }
});

const { data: products, refresh } = useAsyncData(
    'products-list',
    () => fetchProducts(),
    {
        watch: [() => pagination.page, () => pagination.limit],
        transform: (data: IListResponse<Product>) => {
            pagination.total = data.response.count
            return data.response.rows
        },
        default: () => [] as Product[]
    }
)

const { data: categories } = await useLazyFetch('/categories', {
    key: 'categories-filter', 
    baseURL: baseUrl,
    headers: { authorization: token.value ?? '' },
    transform: (data: IListResponse<Category>) => {
        return [
            { value: 0, label: 'All Categories' },
            ...data.response.rows.map(category => ({
                value: category.id,
                label: category.name
            }))
        ]
    }
})

watch(() => pagination.limit, () => {
    pagination.page = 1
})
</script>
