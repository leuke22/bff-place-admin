<template>
    <div>
        <div class="mb-3">
            <PageHeader :title="product?.name ?? 'Product'" :description="mode === 'edit' ? 'Update product details' : 'Product details'" :items :has-view="false"/>
        </div>

        <div class="my-2 flex flex-row justify-between">
            <UButton v-if="mode === 'view'" icon="lucide:edit" label="Edit" @click="mode = 'edit'"/>
            <div v-else/>
            <UButton icon="lucide:arrow-left" label="Back to Products" variant="ghost" color="neutral" to="/inventory/products"/>
        </div>

        <div v-if="product" class="w-full space-y-8 flex flex-row gap-10">
            <ProductForm class="flex-1" :mode="mode" :product="product" @success="onSuccess" @cancel="onCancel"/>

            <ProductRecipe class="flex-1" :product-id="product.id"/>
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

// Plain ref, not computed off the route — computed() has no setter, which is why
// clicking "Edit" wasn't doing anything before. ?isEdit=true still seeds the initial
// mode if someone lands here directly on a deep link, but after that it's just local state.
const mode = ref<'view' | 'edit'>(route.query.isEdit === 'true' ? 'edit' : 'view')

const fetchProduct = () => $fetch<IResponse & { response: Product }>(`/products/${route.params.id}`, {
    baseURL: baseUrl,
    headers: { authorization: token ?? '' },
    query: { includes: 'category' }
})

const { data: product } = await useAsyncData(
    `product-${route.params.id}`,
    () => fetchProduct(),
    {
        transform: (data: IResponse & { response: Product }) => data.response
    }
)

const items = computed<BreadcrumbItem[]>(() => [
    { label: 'Products', to: '/products' },
    { label: product.value?.name ?? 'Product', to: route.fullPath }
])

function onSuccess(updated: Product) {
    product.value = updated
    mode.value = 'view'
}

function onCancel() {
    mode.value = 'view'
}
</script>