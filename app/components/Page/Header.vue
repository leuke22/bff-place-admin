<template>
    <div class="flex flex-row justify-between items-center">
        <div class="flex flex-col">
            <h1 class="text-xl capitalize">{{ title }}</h1>
            <p class="text-sm dark:text-gray-500 text-gray-400">{{ description }}</p>
            <UBreadcrumb :items="defaultItems" />
        </div>
        <div v-if="hasView">
            <URadioGroup
                v-model="view"
                :items="options"
                variant="table"
                orientation="horizontal"
                indicator="hidden"
                :ui="{ item: 'px-3 py-2' }"
            >
                <template #label="{ item }">
                    <span class="flex items-center gap-2">
                        <UIcon :name="item.icon" />
                        <span>{{ item.label }}</span>
                    </span>
                </template>
            </URadioGroup>
        </div>
    </div>
</template> 

<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui'
import type { ValueType, ViewTypes } from '~/types/component';

const route = useRoute();

const props = withDefaults(defineProps<{
    title: string
    description: string
    items: BreadcrumbItem[]
    hasView?: boolean
}>(), {
    hasView: true
})

const view = defineModel<ValueType>('view');

const defaultItems = ref<BreadcrumbItem[]>([
    {
        label: 'Dashboard',
        to: '/docs'
    },
    ...props.items
])

const options: ViewTypes[] = [
    {
        label: 'Grid',
        value: 'grid',
        icon: 'i-lucide-grid-2x2',
    },
    {
        label: 'Table',
        value: 'table',
        icon: 'i-lucide-table',
    },
]
</script>