<template>
    <div>
        <div class="mb-3">
            <PageHeader title="Recipes" description="Assign the ingredients used to make each product" :items :has-view="false"/>
        </div>
        <div class="flex flex-row justify-between items-center gap-3 mb-3">
            <UInput v-model="search" icon="i-lucide-search" placeholder="Search products" class="max-w-xs"/>
            <UButton icon="lucide:refresh-ccw" variant="outline" color="neutral" :loading="status === 'pending'" @click="refresh()"/>
        </div>

        <div v-if="filteredProducts.length" class="divide-y divide-default rounded-lg border border-default">
            <div v-for="product in filteredProducts" :key="product.uuid" class="flex flex-row items-center justify-between gap-3 px-4 py-3">
                <div class="flex items-center gap-3">
                    <div class="size-12 rounded-lg overflow-hidden shrink-0 border border-default">
                        <NuxtImg :src="product.image ?? '/images/inasal.webp'" class="w-full h-full object-cover"/>
                    </div>
                    <div>
                        <p class="font-medium">{{ product.name }}</p>
                        <p class="text-xs text-muted">{{ product.categories.map(category => category.name).join(', ') || '—' }}</p>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <UBadge
                        :label="recipeCount(product) ? `${recipeCount(product)} ingredient(s)` : 'No recipe yet'"
                        :color="recipeCount(product) ? 'success' : 'warning'"
                        variant="subtle"
                    />
                    <UButton label="Manage Recipe" icon="lucide:chef-hat" variant="outline" color="neutral" size="sm" :to="`/inventory/recipes/${product.uuid}`"/>
                </div>
            </div>
        </div>
        <div v-else class="rounded-lg border border-default p-10 text-center text-muted">
            No products found.
        </div>
    </div>
</template>

<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui'
import type { Product } from '~/types/models/product.types'
import type { IListResponse } from '~/types/response'

definePageMeta({
    layout: 'inventory'
})

const { baseUrl, token } = useAPI()

const items = ref<BreadcrumbItem[]>([{ label: 'Recipes', to: '/inventory/recipes' }])

const search = ref('')

const { data: products, refresh, status } = useAsyncData(
    'recipes-product-list',
    () => $fetch<IListResponse<Product>>('/products', {
        baseURL: baseUrl,
        headers: { authorization: token.value ?? '' },
        query: { limit: 100, includes: 'ingredients' },
    }),
    {
        transform: (data: IListResponse<Product>) => data.response.rows,
        default: () => [] as Product[]
    }
)

function recipeCount(product: Product) {
    return product.ingredients?.length ?? 0
}

const filteredProducts = computed(() => {
    if (!search.value) return products.value
    const term = search.value.toLowerCase()
    return products.value.filter((p) => p.name.toLowerCase().includes(term))
})
</script>
