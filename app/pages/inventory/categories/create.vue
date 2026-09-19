<template>
    <div>
        <div class="mb-3">
            <PageHeader title="Create Category" description="Add a new product category" :items/>
        </div>
        <div class="max-w-2xl">
            <CategoryForm mode="create" @success="onSuccess" @cancel="onCancel"/>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui'
import type { Category } from '~/types/models/category.types'

definePageMeta({
    layout: 'inventory'
})

const router = useRouter()

const items = ref<BreadcrumbItem[]>([
    { label: 'Categories', to: '/categories' },
    { label: 'Create', to: '/categories/create' }
])

function onSuccess(category: Category) {
    router.push(`/categories/${category.uuid}`)
}

function onCancel() {
    router.push('/categories')
}
</script>