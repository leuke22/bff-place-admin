<template>
    <div>
        <div class="mb-3">
            <PageHeader v-model:view="view" title="Products" :items/>
        </div>
        <div class="flex flex-row justify-end gap-3">
            <UButton icon="lucide:refresh-ccw" variant="outline" color="neutral"/>
            <UButton icon="lucide:circle-plus" label="Add Products"/>
        </div>
        <div>
            <PageView :view>
                <template #grid-filter>
                    <PageViewFilter v-model:search="search" placeholder="Search by Name">
                        <template #filter>
                            <slot name="filter" />
                        </template>
                    </PageViewFilter>
                </template>
                <template #grid-item>
                    <ProductCard v-for="product in products" :key="product.uuid" :product/>
                </template>
            </PageView>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui';
import { transform } from 'typescript';
import type { ValueType } from '~/types/component';
import type { Product } from '~/types/models/product.types';
import type { IListResponse } from '~/types/response';

const { baseUrl, token } = useAPI();

const items = ref<BreadcrumbItem[]>([
    {
        label: 'Products',
        to: '/products'
    },
])

const view = ref<ValueType>('grid');
const search = ref<string>('');
const total = ref<number>(0);

const fetchProducts = () => $fetch<IListResponse<Product>>('/products', {
    baseURL: baseUrl,
    headers: { authorization: token ?? '' },
    query: {
        page: 1,
        limit: 10,
        includes: 'category'
    }
});

const { data: products } = useAsyncData(
    'products-list',
    () => fetchProducts(),
    {
        transform: (data: IListResponse<Product>) => {
            total.value = data.response.count
            return data.response.rows
        },
        default: () => [] as Product[]
    }
)
</script>