<template>
    <div>
        <div class="mb-3">
            <PageHeader title="Create Product" description="Add a new product to your inventory" :items/>
        </div>
        <div class="max-w-2xl">
            <ProductForm mode="create" @success="onSuccess" @cancel="onCancel"/>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui'
import type { Product } from '~/types/models/product.types'

definePageMeta({
    layout: 'inventory'
})

const router = useRouter()

const items = ref<BreadcrumbItem[]>([
    { label: 'Products', to: '/products' },
    { label: 'Create', to: '/products/create' }
])

function onSuccess(product: Product) {
    router.push(`/products/${product.uuid}`)
}

function onCancel() {
    router.push('/products')
}
</script>