<template>
    <div>
        <div class="mb-3">
            <PageHeader :title="product ? `Recipe — ${product.name}` : 'Recipe'" description="Assign the ingredients used to make this product" :items :has-view="false"/>
        </div>

        <div class="my-2 flex flex-row justify-between items-center">
            <div v-if="product" class="flex items-center gap-3">
                <div class="size-12 rounded-lg overflow-hidden shrink-0 border border-default">
                    <NuxtImg :src="product.image ?? '/images/inasal.webp'" class="w-full h-full object-cover"/>
                </div>
                <div>
                    <p class="font-medium">{{ product.name }}</p>
                    <p class="text-xs text-muted">{{ product.categories.map(category => category.name).join(', ') || '—' }} · {{ formatCurrency(product.price) }}</p>
                </div>
            </div>
            <div v-else/>
            <UButton icon="lucide:arrow-left" label="Back to Recipes" variant="ghost" color="neutral" to="/inventory/recipes"/>
        </div>

        <div v-if="product" class="max-w-2xl">
            <ProductRecipe :product-id="product.id" mode="edit"/>
        </div>

        <div v-else class="max-w-2xl">
            <div class="rounded-lg border border-default p-10 text-center text-muted">
                Product not found.
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui'
import type { Product } from '~/types/models/product.types'
import type { IResponse } from '~/types/response'

definePageMeta({
    layout: 'inventory'
})

const route = useRoute()
const { baseUrl, token } = useAPI()

const { data: product } = await useAsyncData(
    `recipe-product-${route.params.id}`,
    () => $fetch<IResponse & { response: Product }>(`/products/${route.params.id}`, {
        baseURL: baseUrl,
        headers: { authorization: token.value ?? '' },
    }),
    {
        transform: (data: IResponse & { response: Product }) => data.response
    }
)

const items = computed<BreadcrumbItem[]>(() => [
    { label: 'Recipes', to: '/inventory/recipes' },
    { label: product.value?.name ?? 'Recipe', to: route.fullPath }
])
</script>
