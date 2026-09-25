<template>
    <div class="rounded-lg border border-default overflow-hidden bg-default p-4 flex flex-col gap-3">
        <div class="flex flex-row justify-between items-start">
            <div class="flex items-center gap-3">
                <div class="size-10 rounded-full bg-secondary-200 dark:bg-secondary-900/10 flex items-center justify-center shrink-0">
                    <UIcon name="lucide:truck" class="size-5 text-secondary-700 dark:text-secondary-400" />
                </div>
                <div>
                    <h1 class="text-lg font-semibold">{{ supplier.name }}</h1>
                    <p class="text-sm dark:text-gray-500 text-gray-400">{{ supplier.contact_person || '—' }}</p>
                </div>
            </div>
            <UDropdownMenu :items="menuItems">
                <UButton icon="lucide:more-horizontal" variant="ghost" color="neutral" square/>
            </UDropdownMenu>
        </div>

        <div class="space-y-1 text-sm">
            <div class="flex items-center gap-1.5 text-muted">
                <UIcon name="lucide:phone" class="size-3.5"/>
                <span>{{ supplier.contact_number || '—' }}</span>
            </div>
            <div class="flex items-center gap-1.5 text-muted">
                <UIcon name="lucide:mail" class="size-3.5"/>
                <span>{{ supplier.email || '—' }}</span>
            </div>
        </div>

        <div class="flex flex-row justify-end">
            <UBadge
                :color="supplier.is_active ? 'success' : 'error'"
                :label="supplier.is_active ? 'Active' : 'Inactive'"
                variant="subtle"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import type { Supplier } from '~/types/models/supplier.types'

const props = defineProps<{
    supplier: Supplier
}>()

const emit = defineEmits<{
    view: [supplier: Supplier]
    edit: [supplier: Supplier]
    delete: [supplier: Supplier]
}>()

const menuItems: DropdownMenuItem[][] = [
    [
        { label: 'View Supplier', icon: 'lucide:eye', onSelect: () => emit('view', props.supplier) },
        { label: 'Edit Supplier', icon: 'lucide:edit', onSelect: () => emit('edit', props.supplier) },
    ],
    [
        { label: 'Delete Supplier', icon: 'lucide:trash-2', color: 'error' as const, onSelect: () => emit('delete', props.supplier) },
    ],
]
</script>