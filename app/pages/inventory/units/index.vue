<template>
    <div>
        <div class="mb-3">
            <PageHeader title="Units" description="Manage the measurement units ingredients can use" :items :has-view="false"/>
        </div>
        <div class="flex flex-row justify-end gap-3 mb-3">
            <UButton icon="lucide:refresh-ccw" variant="outline" color="neutral" :loading="status === 'pending'" @click="refresh()"/>
            <UButton icon="lucide:circle-plus" label="Add Unit" @click="onCreate"/>
        </div>

        <div v-if="units.length" class="divide-y divide-default rounded-lg border border-default">
            <div v-for="unit in units" :key="unit.uuid" class="flex flex-row items-center justify-between gap-3 px-4 py-3">
                <div>
                    <p class="font-medium">{{ unit.name }}</p>
                    <p class="text-xs text-muted">Symbol: {{ unit.symbol }}</p>
                </div>
                <div class="flex items-center gap-3">
                    <UBadge :label="unit.is_active ? 'Active' : 'Inactive'" :color="unit.is_active ? 'success' : 'error'" variant="subtle"/>
                    <UButton icon="lucide:edit" variant="ghost" color="neutral" size="sm" @click="onEdit(unit)"/>
                    <UButton icon="lucide:trash-2" variant="ghost" color="error" size="sm" @click="onDelete(unit)"/>
                </div>
            </div>
        </div>
        <div v-else class="rounded-lg border border-default p-10 text-center text-muted">
            No units yet. Add one to start assigning it to ingredients.
        </div>

        <UModal
            v-model:open="modalOpen"
            :title="editingUnit ? 'Edit Unit' : 'Add Unit'"
            :description="editingUnit ? 'Update this unit\'s details' : 'Add a new unit of measurement'"
        >
            <template #body>
                <UnitForm
                    :key="editingUnit?.uuid ?? 'new'"
                    :mode="editingUnit ? 'edit' : 'create'"
                    :unit="editingUnit"
                    @success="onSaved"
                    @cancel="modalOpen = false"
                />
            </template>
        </UModal>
    </div>
</template>

<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui'
import type { Unit } from '~/types/models/unit.types'
import type { IListResponse } from '~/types/response'

definePageMeta({
    layout: 'inventory'
})

const { baseUrl, token } = useAPI()
const toast = useToast()

const items = ref<BreadcrumbItem[]>([{ label: 'Units', to: '/inventory/units' }])

const { data: units, refresh, status } = useAsyncData(
    'units-list',
    () => $fetch<IListResponse<Unit>>('/units', {
        baseURL: baseUrl,
        headers: { authorization: token.value ?? '' },
    }),
    {
        transform: (data: IListResponse<Unit>) => data.response.rows,
        default: () => [] as Unit[]
    }
)

const modalOpen = ref(false)
const editingUnit = ref<Unit | undefined>(undefined)

function onCreate() {
    editingUnit.value = undefined
    modalOpen.value = true
}

function onEdit(unit: Unit) {
    editingUnit.value = unit
    modalOpen.value = true
}

function onSaved() {
    modalOpen.value = false
    refresh()
}

async function onDelete(unit: Unit) {
    if (!confirm(`Delete unit "${unit.name}" (${unit.symbol})?`)) return

    try {
        await $fetch(`/units/${unit.uuid}`, {
            baseURL: baseUrl,
            method: 'DELETE',
            headers: { authorization: token.value ?? '' },
        })
        toast.add({ title: 'Unit deleted', color: 'success' })
        refresh()
    } catch (error: any) {
        toast.add({
            title: 'Error deleting unit',
            description: error?.data?.statusMessage || error?.data?.message || error?.message || 'Something went wrong',
            color: 'error'
        })
    }
}
</script>