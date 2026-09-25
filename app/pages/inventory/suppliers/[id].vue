<template>
    <div>
        <div class="mb-3">
            <PageHeader :title="supplier?.name ?? 'Supplier'" :description="mode === 'edit' ? 'Update supplier details' : 'Supplier details'" :items :has-view="false"/>
        </div>

        <div class="my-2 flex flex-row justify-between">
            <UButton v-if="mode === 'view'" icon="lucide:edit" label="Edit" @click="mode = 'edit'"/>
            <div v-else/>
            <UButton icon="lucide:arrow-left" label="Back to Suppliers" variant="ghost" color="neutral" to="/inventory/suppliers"/>
        </div>

        <div v-if="supplier" class="max-w-2xl">
            <SupplierForm :mode="mode" :supplier="supplier" @success="onSuccess" @cancel="onCancel"/>
        </div>

        <div v-else class="max-w-2xl">
            <div class="rounded-lg border border-default p-10 text-center text-muted">
                Supplier not found.
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui'
import type { Supplier } from '~/types/models/supplier.types'
import type { IResponse } from '~/types/response'

definePageMeta({
    layout: 'inventory'
})

const route = useRoute()
const { baseUrl, token } = useAPI()

const mode = ref<'view' | 'edit'>(route.query.isEdit === 'true' ? 'edit' : 'view')

const fetchSupplier = () => $fetch<IResponse & { response: Supplier }>(`/suppliers/${route.params.id}`, {
    baseURL: baseUrl,
    headers: { authorization: token ?? '' }
})

const { data: supplier } = await useAsyncData(
    `supplier-${route.params.id}`,
    () => fetchSupplier(),
    {
        transform: (data: IResponse & { response: Supplier }) => data.response
    }
)

const items = computed<BreadcrumbItem[]>(() => [
    { label: 'Suppliers', to: '/inventory/suppliers' },
    { label: supplier.value?.name ?? 'Supplier', to: route.fullPath }
])

function onSuccess(updated: Supplier) {
    supplier.value = updated
    mode.value = 'view'
}

function onCancel() {
    mode.value = 'view'
}
</script>