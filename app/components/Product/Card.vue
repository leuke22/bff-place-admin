<template>
    <div class="max-w-sm rounded overflow-hidden shadow-lg relative">
        <NuxtImg 
            class="w-full h-48 object-cover" 
            src="/images/inasal.webp"
        />
        <UBadge 
            class="absolute top-3 right-3"
            :label="product.is_active ? 'Active' : 'Inactive'" :color="product.is_active ? 'success' : 'error'"
        />
        <div class="p-5 flex flex-col gap-2">
            <h1>{{ product.name }}</h1>
            <p class="dark:text-gray-400 text-gray-700 text-sm">{{ product.description }}</p>
            <p>{{ formatCurrency(product.price) }}</p>
            <div class="flex flex-row justify-between">
                <UBadge :label="product.category.name" color="secondary" variant="subtle"/>
                <UDropdownMenu>
                    <UButton icon="lucide:more-horizontal"/>
                </UDropdownMenu>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Product } from '~/types/models/product.types';

const props = defineProps<{
    product: Product
}>()
</script>