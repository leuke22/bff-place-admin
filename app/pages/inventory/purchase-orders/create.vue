<template>
    <div>
        <div class="mb-3">
            <PageHeader title="Create Purchase Order" description="Order stock from a supplier" :items/>
        </div>
        <div class="max-w-3xl space-y-4">
            <UFormField label="Supplier" name="supplier_id" required>
                <USelectMenu
                    v-model="supplierId"
                    :items="supplierOptions"
                    value-key="value"
                    label-key="label"
                    placeholder="Select a supplier"
                    class="w-full"
                />
            </UFormField>

            <UFormField label="Items" required>
                <PurchaseOrderItemBuilder v-model="orderItems"/>
            </UFormField>

            <div class="flex justify-end gap-2 pt-2">
                <UButton label="Cancel" color="neutral" variant="soft" :disabled="submitting" @click="router.push('/inventory/purchase-orders')"/>
                <UButton label="Create Purchase Order" :loading="submitting" :disabled="!canSubmit" @click="onSubmit"/>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui'
import type { CreatePurchaseOrderItemInput, PurchaseOrder } from '~/types/models/purchase_order.types'
import type { Supplier } from '~/types/models/supplier.types'
import type { IListResponse, IResponse } from '~/types/response'

definePageMeta({
    layout: 'inventory'
})

const router = useRouter()
const { baseUrl, token } = useAPI()
const toast = useToast()

const items = ref<BreadcrumbItem[]>([
    { label: 'Purchase Orders', to: '/inventory/purchase-orders' },
    { label: 'Create', to: '/inventory/purchase-orders/create' }
])

const supplierId = ref<number | undefined>(undefined)
const orderItems = ref<CreatePurchaseOrderItemInput[]>([{ ingredient_id: 0, quantity: 0, unit_cost: 0 }])
const submitting = ref(false)

const { data: suppliers } = await useLazyFetch('/suppliers', {
    key: 'suppliers-for-po',
    baseURL: baseUrl,
    headers: { authorization: token ?? '' },
    transform: (data: IListResponse<Supplier>) => data.response.rows.filter((s) => s.is_active),
})

const supplierOptions = computed(() =>
    (suppliers.value ?? []).map((s) => ({ value: s.id, label: s.name }))
)

const canSubmit = computed(() =>
    !!supplierId.value &&
    orderItems.value.length > 0 &&
    orderItems.value.every((item) => item.ingredient_id > 0 && item.quantity > 0)
)

async function onSubmit() {
    if (!canSubmit.value || !supplierId.value) return

    submitting.value = true
    try {
        const response = await $fetch<IResponse & { response: PurchaseOrder }>('/purchase-orders', {
            baseURL: baseUrl,
            method: 'POST',
            headers: { authorization: token ?? '' },
            body: {
                supplier_id: supplierId.value,
                items: orderItems.value,
            },
        })

        if (!response.success) {
            throw new Error(response.errorMessage || response.errorDescription || 'Failed to create purchase order')
        }

        toast.add({ title: 'Purchase order created', color: 'success' })
        router.push(`/inventory/purchase-orders/${response.response.uuid}`)
    } catch (error: any) {
        toast.add({
            title: 'Error creating purchase order',
            description: error?.data?.statusMessage || error?.data?.message || error?.message || 'Something went wrong',
            color: 'error'
        })
    } finally {
        submitting.value = false
    }
}
</script>