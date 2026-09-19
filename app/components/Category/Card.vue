<template>
    <div class="rounded-lg border border-default overflow-hidden bg-default">
        <div class="relative">
            <NuxtImg
                :src="category.image ?? '/images/inasal.webp'"
                class="w-full h-44 object-cover"
            />

            <div class="absolute top-3 right-3">
                <UDropdownMenu :items="menuItems">
                    <UButton
                        icon="lucide:more-horizontal"
                        color="neutral"
                        variant="solid"
                        size="sm"
                        class="bg-white/90 text-gray-700 hover:bg-white"
                        square
                    />
                </UDropdownMenu>
            </div>

            <div class="absolute -bottom-6 left-4">
                <div
                    class="size-12 rounded-full flex items-center justify-center ring-4 ring-default"
                    :style="{ backgroundColor: category.color }"
                >
                    <UIcon :name="category.icon" class="size-5 text-white" />
                </div>
            </div>
        </div>

        <div class="pt-8 pb-4 px-4">
            <h1 class="text-lg font-semibold">{{ category.name }}</h1>
            <p class="text-sm dark:text-gray-500 text-gray-400 mb-3">{{ category.description }}</p>

            <div class="flex flex-row justify-between items-center">
                <div class="flex items-center gap-1.5 text-sm dark:text-gray-500 text-gray-400">
                    <UIcon name="lucide:box" class="size-4" />
                    <span>{{ category.products_count }} products</span>
                </div>
                <UBadge
                    :color="category.is_active ? 'success' : 'error'"
                    :label="category.is_active ? 'Active' : 'Inactive'"
                    variant="subtle"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { CategoryProductCount } from '~/types/models/category.types'

const props = defineProps<{
    category: CategoryProductCount
}>()

const emit = defineEmits<{
    view: [category: CategoryProductCount]
    edit: [category: CategoryProductCount]
    delete: [category: CategoryProductCount]
}>()

const menuItems = [
    [
        { label: 'View Category', icon: 'lucide:eye', onSelect: () => emit('view', props.category) },
        { label: 'Edit Category', icon: 'lucide:edit', onSelect: () => emit('edit', props.category) },
    ],
    [
        { label: 'Delete Category', icon: 'lucide:trash-2', color: 'error' as const, onSelect: () => emit('delete', props.category) },
    ],
]
</script>