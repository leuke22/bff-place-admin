<template>
    <div>
        <div class="mb-3">
            <PageHeader title="Create Supplier" description="Add a new ingredient supplier" :items/>
        </div>
        <div class="max-w-2xl">
            <SupplierForm mode="create" @success="onSuccess" @cancel="onCancel"/>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui'
import type { Supplier } from '~/types/models/supplier.types'

definePageMeta({
    layout: 'inventory'
})

const router = useRouter()

const items = ref<BreadcrumbItem[]>([
    { label: 'Suppliers', to: '/inventory/suppliers' },
    { label: 'Create', to: '/inventory/suppliers/create' }
])

function onSuccess(supplier: Supplier) {
    router.push(`/inventory/suppliers/${supplier.uuid}`)
}

function onCancel() {
    router.push('/inventory/suppliers')
}
</script>