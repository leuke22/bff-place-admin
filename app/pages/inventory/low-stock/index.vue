<template>
    <div>
        <div class="mb-3">
            <PageHeader title="Low Stock Ingredients" description="Ingredients at or below their reorder level" :items :has-view="false"/>
        </div>
        <div class="flex flex-row justify-between items-center mb-3">
            <UBadge color="error" variant="subtle" :label="`${ingredients.length} ingredient(s) low`"/>
            <div class="flex flex-row gap-3">
                <UButton icon="lucide:refresh-ccw" variant="outline" color="neutral" :loading="status === 'pending'" @click="refresh()"/>
                <UButton icon="lucide:list" label="All Ingredients" variant="outline" color="neutral" to="/inventory/ingredients"/>
            </div>
        </div>

        <div v-if="ingredients.length" class="grid xl:grid-cols-4 lg:grid-cols-3 sm:grid-cols-2 gap-4">
            <IngredientCard
                v-for="ingredient in ingredients"
                :key="ingredient.uuid"
                :ingredient
                @view="onView"
                @edit="onEdit"
                @delete="onDelete"
            />
        </div>
        <div v-else class="rounded-lg border border-default p-10 text-center text-muted">
            Nothing is low on stock right now.
        </div>
    </div>
</template>

<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui'
import type { Ingredient } from '~/types/models/ingredient.types'
import type { IListResponse } from '~/types/response'

definePageMeta({
    layout: 'inventory'
})

const { baseUrl, token } = useAPI()
const toast = useToast()

const items = ref<BreadcrumbItem[]>([
    { label: 'Ingredients', to: '/inventory/ingredients' },
    { label: 'Low Stock', to: '/inventory/low-stock' },
])

const { data: ingredients, refresh, status } = useAsyncData(
    'low-stock-ingredients',
    () => $fetch<IListResponse<Ingredient>>('/ingredients', {
        baseURL: baseUrl,
        headers: { authorization: token.value ?? '' },
        query: { low_stock: 'true' },
    }),
    {
        transform: (data: IListResponse<Ingredient>) => data.response.rows,
        default: () => [] as Ingredient[]
    }
)

function onView(ingredient: Ingredient) {
    navigateTo(`/inventory/ingredients/${ingredient.uuid}`)
}

function onEdit(ingredient: Ingredient) {
    navigateTo({ path: `/inventory/ingredients/${ingredient.uuid}`, query: { isEdit: 'true' } })
}

async function onDelete(ingredient: Ingredient) {
    try {
        await $fetch(`/ingredients/${ingredient.uuid}`, {
            baseURL: baseUrl,
            method: 'DELETE',
            headers: { authorization: token.value ?? '' },
        })
        toast.add({ title: 'Ingredient deleted', color: 'success' })
        refresh()
    } catch (error: any) {
        toast.add({
            title: 'Error deleting ingredient',
            description: error?.data?.statusMessage || error?.data?.message || error?.message || 'Something went wrong',
            color: 'error'
        })
    }
}
</script>