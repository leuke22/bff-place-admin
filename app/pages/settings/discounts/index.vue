<template>
    <div class="space-y-6">
        <PageHeader title="Settings" description="Manage discounts cashiers can apply on the POS" :items :has-view="false"/>

        <SettingsNav/>

        <div class="flex flex-row justify-between items-center">
            <h2 class="text-lg font-semibold">Discounts</h2>
            <div class="flex flex-row gap-3">
                <UButton icon="lucide:refresh-ccw" variant="outline" color="neutral" :loading="status === 'pending'" @click="refresh()"/>
                <UButton icon="lucide:circle-plus" label="Add Discount" @click="onCreate"/>
            </div>
        </div>

        <div v-if="discounts.length" class="divide-y divide-default rounded-lg border border-default">
            <div v-for="discount in discounts" :key="discount.uuid" class="flex flex-row items-center justify-between gap-3 px-4 py-3">
                <div>
                    <p class="font-medium">{{ discount.name }}</p>
                    <p class="text-xs text-muted">{{ discountLabel(discount) }} off</p>
                </div>
                <div class="flex items-center gap-3">
                    <UBadge :label="discount.is_active ? 'Active' : 'Inactive'" :color="discount.is_active ? 'success' : 'error'" variant="subtle"/>
                    <UButton icon="lucide:edit" variant="ghost" color="neutral" size="sm" @click="onEdit(discount)"/>
                    <UButton icon="lucide:trash-2" variant="ghost" color="error" size="sm" @click="onDelete(discount)"/>
                </div>
            </div>
        </div>
        <div v-else class="rounded-lg border border-default p-10 text-center text-muted">
            No discounts yet. Add one so cashiers can apply it on the POS.
        </div>

        <UModal
            v-model:open="modalOpen"
            :title="editingDiscount ? 'Edit Discount' : 'Add Discount'"
            :description="editingDiscount ? 'Update this discount\'s details' : 'Create a discount cashiers can apply on the POS'"
        >
            <template #body>
                <DiscountForm
                    :key="editingDiscount?.uuid ?? 'new'"
                    :mode="editingDiscount ? 'edit' : 'create'"
                    :discount="editingDiscount"
                    @success="onSaved"
                    @cancel="modalOpen = false"
                />
            </template>
        </UModal>
    </div>
</template>

<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui'
import type { Discount } from '~/types/models/discount.types'
import type { IListResponse } from '~/types/response'

definePageMeta({
    middleware: 'require-auth',
    layout: 'account'
})

const { baseUrl, token } = useAPI()
const { data: authData } = useAuth()
const toast = useToast()

// Managing discounts is admin/manager only (the API enforces it too).
if (authData.value?.role === 'cashier') {
    await navigateTo('/pos')
}

const items = ref<BreadcrumbItem[]>([
    { label: 'Settings', to: '/settings' },
    { label: 'Discounts', to: '/settings/discounts' },
])

const { data: discounts, refresh, status } = useAsyncData(
    'discounts-list',
    () => $fetch<IListResponse<Discount>>('/discounts', {
        baseURL: baseUrl,
        headers: { authorization: token.value ?? '' },
    }),
    {
        transform: (data: IListResponse<Discount>) => data.response.rows,
        default: () => [] as Discount[]
    }
)

const modalOpen = ref(false)
const editingDiscount = ref<Discount | undefined>(undefined)

function onCreate() {
    editingDiscount.value = undefined
    modalOpen.value = true
}

function onEdit(discount: Discount) {
    editingDiscount.value = discount
    modalOpen.value = true
}

function onSaved() {
    modalOpen.value = false
    refresh()
}

async function onDelete(discount: Discount) {
    if (!confirm(`Delete discount "${discount.name}"?`)) return

    try {
        await $fetch(`/discounts/${discount.uuid}`, {
            baseURL: baseUrl,
            method: 'DELETE',
            headers: { authorization: token.value ?? '' },
        })
        toast.add({ title: 'Discount deleted', color: 'success' })
        refresh()
    } catch (error: any) {
        toast.add({
            title: 'Error deleting discount',
            description: error?.data?.statusMessage || error?.data?.message || error?.message || 'Something went wrong',
            color: 'error'
        })
    }
}
</script>
