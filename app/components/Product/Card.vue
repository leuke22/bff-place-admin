<template>
    <div class="max-w-sm rounded overflow-hidden shadow-lg relative">
        <NuxtImg 
            class="w-full h-48 object-cover" 
            :src="product.image ?? '/images/inasal.webp'"
        />
        <UBadge 
            class="absolute top-3 right-3"
            :label="product.is_active ? 'Active' : 'Inactive'" :color="product.is_active ? 'success' : 'error'"
        />
        <div class="p-5 flex flex-col gap-2">
            <h1>{{ product.name }}</h1>
            <p class="dark:text-gray-400 text-gray-700 text-sm">{{ product.description }}</p>
            <p>{{ formatCurrency(product.price) }}</p>
            <div class="flex flex-row justify-between gap-2">
                <div class="flex flex-wrap gap-1">
                    <UBadge
                        v-for="category in product.categories"
                        :key="category.id"
                        :label="category.name"
                        variant="subtle"
                        :style="{ backgroundColor: category.color, color: 'white' }"
                    />
                </div>
                <UDropdownMenu :items="cardItems">
                    <UButton icon="lucide:more-horizontal" variant="ghost"/>
                </UDropdownMenu>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui';
import type { Product } from '~/types/models/product.types';

const props = defineProps<{
    product: Product
}>()

const cardItems = ref<DropdownMenuItem[]>([
    { 
        label: 'View Product',
        icon: 'lucide:eye',
        to: { path: `/inventory/products/${props.product.uuid}` }
    },
    { 
        label: 'Edit Product',
        icon: 'lucide:edit',
        to: { path: `/inventory/products/${props.product.uuid}`, query: { isEdit: 'true' } }
    },
    {
        label: 'Delete Product',
        icon: 'lucide:trash'
    }
])
</script>
