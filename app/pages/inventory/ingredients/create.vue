<template>
    <div>
        <div class="mb-3">
            <PageHeader title="Create Ingredient" description="Add a new ingredient to your inventory" :items/>
        </div>
        <div class="max-w-2xl">
            <IngredientForm mode="create" @success="onSuccess" @cancel="onCancel"/>
        </div>
    </div>
</template> 

<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui'
import type { Ingredient } from '~/types/models/ingredient.types'

definePageMeta({
    layout: 'inventory'
})

const router = useRouter()

const items = ref<BreadcrumbItem[]>([
    { label: 'Ingredients', to: '/inventory/ingredients' },
    { label: 'Create', to: '/inventory/ingredients/create' }
])

function onSuccess(ingredient: Ingredient) {
    router.push(`/inventory/ingredients/${ingredient.id}`)
}

function onCancel() {
    router.push('/inventory/ingredients')
}
</script>