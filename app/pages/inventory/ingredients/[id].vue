<template>
    <div>
        <div class="mb-3">
            <PageHeader :title="ingredient?.name ?? 'Ingredient'" :description="mode === 'edit' ? 'Update ingredient details' : 'Ingredient details'" :items :has-view="false"/>
        </div>

        <div class="my-2 flex flex-row justify-between">
            <UButton v-if="mode === 'view'" icon="lucide:edit" label="Edit" @click="mode = 'edit'"/>
            <div v-else/>
            <UButton icon="lucide:arrow-left" label="Back to Ingredients" variant="ghost" color="neutral" to="/inventory/ingredients"/>
        </div>

        <div v-if="ingredient" class="max-w-2xl space-y-8">
            <IngredientForm :mode="mode" :ingredient="ingredient" @success="onSuccess" @cancel="onCancel"/>

            <IngredientStockHistory
                :ingredient-id="ingredient.id"
                :mode="mode"
                @recorded="onStockRecorded"
            />
        </div>

        <div v-else class="max-w-2xl">
            <div class="rounded-lg border border-default p-10 text-center text-muted">
                Ingredient not found.
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui'
import type { Ingredient } from '~/types/models/ingredient.types'
import type { IResponse } from '~/types/response'

definePageMeta({
    layout: 'inventory'
})

const route = useRoute()
const { baseUrl, token } = useAPI()

const mode = ref<'view' | 'edit'>(route.query.isEdit === 'true' ? 'edit' : 'view')

const fetchIngredient = () => $fetch<IResponse & { response: Ingredient }>(`/ingredients/${route.params.id}`, {
    baseURL: baseUrl,
    headers: { authorization: token ?? '' }
})

const { data: ingredient } = await useAsyncData(
    `ingredient-${route.params.id}`,
    () => fetchIngredient(),
    {
        transform: (data: IResponse & { response: Ingredient }) => data.response
    }
)

const items = computed<BreadcrumbItem[]>(() => [
    { label: 'Ingredients', to: '/inventory/ingredients' },
    { label: ingredient.value?.name ?? 'Ingredient', to: route.fullPath }
])

function onSuccess(updated: Ingredient) {
    ingredient.value = updated
    mode.value = 'view'
}

function onCancel() {
    mode.value = 'view'
}

// Keep the displayed current_stock in sync after a movement is recorded,
// since that changes the ingredient outside the form's own save flow.
function onStockRecorded(updated: Ingredient) {
    ingredient.value = updated
}
</script>