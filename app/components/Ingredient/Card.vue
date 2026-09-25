<template>
    <div class="rounded-lg border border-default overflow-hidden bg-default">
        <div class="relative">
            <NuxtImg
                :src="ingredient.image ?? '/images/inasal.webp'"
                class="w-full h-32 object-cover"
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
        </div>

        <div class="p-4 flex flex-col gap-3">
            <div>
                <h1 class="text-lg font-semibold">{{ ingredient.name }}</h1>
                <p class="text-sm dark:text-gray-500 text-gray-400">{{ ingredient.unit }}</p>
            </div>

            <div class="flex flex-row justify-between items-center">
                <div>
                    <p class="text-xs uppercase text-muted tracking-wide">Current Stock</p>
                    <p class="text-lg font-medium">{{ Number(ingredient.current_stock) }} {{ ingredient.unit }}</p>
                </div>
                <UBadge
                    :color="isLowStock ? 'error' : 'success'"
                    :label="isLowStock ? 'Low Stock' : 'In Stock'"
                    variant="subtle"
                />
            </div>

            <p class="text-xs text-muted">
                Reorder at {{ Number(ingredient.reorder_level) }} {{ ingredient.unit }}
            </p>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import type { Ingredient } from '~/types/models/ingredient.types'

const props = defineProps<{
    ingredient: Ingredient
}>()

const emit = defineEmits<{
    view: [ingredient: Ingredient]
    edit: [ingredient: Ingredient]
    delete: [ingredient: Ingredient]
}>()

const isLowStock = computed(() => Number(props.ingredient.current_stock) <= Number(props.ingredient.reorder_level))

const menuItems: DropdownMenuItem[][] = [
    [
        { label: 'View Ingredient', icon: 'lucide:eye', onSelect: () => emit('view', props.ingredient) },
        { label: 'Edit Ingredient', icon: 'lucide:edit', onSelect: () => emit('edit', props.ingredient) },
    ],
    [
        { label: 'Delete Ingredient', icon: 'lucide:trash-2', color: 'error' as const, onSelect: () => emit('delete', props.ingredient) },
    ],
]
</script>