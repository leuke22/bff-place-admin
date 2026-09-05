<template>
    <div>
        <div class="mb-3">
            <PageHeader v-model:view="view" title="Products" description="Manage your products" :items/>
        </div>
        <div class="flex flex-row justify-end gap-3 mb-3">
            <UButton icon="lucide:refresh-ccw" variant="outline" color="neutral"/>
            <ProductCreateUpdate/>
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
                    <div class="flex flex-row justify-end">
                        <UPagination v-model:page="pagination.page" :sibling-count="2" :total="pagination.total"/>
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
                                <UBadge :label="row.original.category.name" color="secondary" variant="subtle"/>
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
                                        <UButton icon="lucide:eye" variant="outline" color="neutral"/>
                                    </UTooltip>
                                    <UTooltip text="Edit Product">
                                        <UButton icon="lucide:edit" variant="outline" color="tertiary"/>
                                    </UTooltip>
                                    <UTooltip text="Delete Product">
                                        <UButton icon="lucide:trash-2" variant="outline" color="error"/>
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
import { transform } from 'typescript';
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
    headers: { authorization: token ?? '' },
    query: {
        page: 1,
        limit: 10,
        includes: 'category'
    }
});

const { data: products, refresh } = useAsyncData(
    'products-list',
    () => fetchProducts(),
    {
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
    headers: { authorization: token ?? '' },
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

console.log('categories', categories);
</script>