<template>
    <div class="space-y-4">
        <div class="flex flex-row justify-between items-center">
            <div>
                <h2 class="text-lg font-semibold">Recipe</h2>
                <p class="text-sm dark:text-gray-500 text-gray-400">Ingredients used to make this product</p>
            </div>
        </div>

        <!-- Add ingredient row -->
        <div class="flex flex-row gap-2 items-start">
            <USelectMenu
                v-model="newItem.ingredient_id"
                :items="availableIngredientOptions"
                value-key="value"
                label-key="label"
                placeholder="Select an ingredient"
                class="flex-1"
            />
            <UInput
                v-model="newItem.quantity_used"
                type="number"
                step="0.001"
                placeholder="Qty"
                class="w-28"
            />
            <UButton
                icon="lucide:circle-plus"
                label="Add"
                :loading="adding"
                :disabled="!newItem.ingredient_id || !newItem.quantity_used"
                @click="onAdd"
            />
        </div>

        <!-- Recipe list -->
        <div v-if="recipe.length" class="divide-y divide-default rounded-lg border border-default">
            <div
                v-for="item in recipe"
                :key="item.id"
                class="flex flex-row items-center justify-between gap-3 px-4 py-3"
            >
                <div>
                    <p class="font-medium">{{ item.ingredient.name }}</p>
                    <p class="text-xs text-muted">{{ item.ingredient.unit }}</p>
                </div>

                <div class="flex flex-row items-center gap-2">
                    <template v-if="editingId === item.id">
                        <UInput
                            v-model="editQuantity"
                            type="number"
                            step="0.001"
                            class="w-24"
                            size="sm"
                            autofocus
                        />
                        <UButton icon="lucide:check" color="success" variant="ghost" size="sm" :loading="saving" @click="onSaveEdit(item)"/>
                        <UButton icon="lucide:x" color="neutral" variant="ghost" size="sm" @click="onCancelEdit"/>
                    </template>
                    <template v-else>
                        <span class="text-sm">{{ Number(item.quantity_used) }} {{ item.ingredient.unit }}</span>
                        <UButton icon="lucide:edit" variant="ghost" color="neutral" size="sm" @click="onStartEdit(item)"/>
                        <UButton icon="lucide:trash-2" variant="ghost" color="error" size="sm" :loading="removingId === item.id" @click="onRemove(item)"/>
                    </template>
                </div>
            </div>
        </div>

        <div v-else class="rounded-lg border border-default p-8 text-center text-muted">
            No ingredients added to this recipe yet.
        </div>
    </div>
</template>

<script setup lang="ts">
import type { RecipeItem } from '~/types/models/recipe.types'
import type { Ingredient } from '~/types/models/ingredient.types'
import type { IListResponse, IResponse } from '~/types/response'

const props = defineProps<{
    productId: number
}>()

const { baseUrl, token } = useAPI()
const toast = useToast()

// ---- recipe list ----
const fetchRecipe = () => $fetch<IListResponse<RecipeItem>>(`/products/${props.productId}/ingredients`, {
    baseURL: baseUrl,
    headers: { authorization: token ?? '' },
})

const { data: recipe, refresh, status } = useAsyncData(
    `product-recipe-${props.productId}`,
    () => fetchRecipe(),
    {
        transform: (data: IListResponse<RecipeItem>) => data.response.rows,
        default: () => [] as RecipeItem[]
    }
)

// ---- all ingredients (for the picker) ----
const { data: allIngredients } = await useLazyFetch('/ingredients', {
    key: 'ingredients-for-recipe',
    baseURL: baseUrl,
    headers: { authorization: token ?? '' },
    transform: (data: IListResponse<Ingredient>) => data.response.rows,
})

// Only offer ingredients not already in this recipe
const availableIngredientOptions = computed(() => {
    const usedIds = new Set(recipe.value.map((item) => item.ingredient_id))
    return (allIngredients.value ?? [])
        .filter((ingredient) => !usedIds.has(ingredient.id))
        .map((ingredient) => ({ value: ingredient.id, label: `${ingredient.name} (${ingredient.unit})` }))
})

// ---- add ----
const newItem = reactive({
    ingredient_id: undefined as number | undefined,
    quantity_used: undefined as number | undefined,
})
const adding = ref(false)

async function onAdd() {
    if (!newItem.ingredient_id || !newItem.quantity_used) return

    adding.value = true
    try {
        const response = await $fetch<IResponse & { response: RecipeItem }>(`/products/${props.productId}/ingredients`, {
            baseURL: baseUrl,
            method: 'POST',
            headers: { authorization: token ?? '' },
            body: {
                ingredient_id: newItem.ingredient_id,
                quantity_used: Number(newItem.quantity_used),
            },
        })

        if (!response.success) {
            throw new Error(response.errorMessage || response.errorDescription || 'Failed to add ingredient')
        }

        toast.add({ title: 'Ingredient added to recipe', color: 'success' })
        newItem.ingredient_id = undefined
        newItem.quantity_used = undefined
        await refresh()
    } catch (error: any) {
        toast.add({
            title: 'Error adding ingredient',
            description: error?.data?.statusMessage || error?.data?.message || error?.message || 'Something went wrong',
            color: 'error'
        })
    } finally {
        adding.value = false
    }
}

// ---- edit quantity ----
const editingId = ref<number | null>(null)
const editQuantity = ref<number | undefined>(undefined)
const saving = ref(false)

function onStartEdit(item: RecipeItem) {
    editingId.value = item.id
    editQuantity.value = Number(item.quantity_used)
}

function onCancelEdit() {
    editingId.value = null
    editQuantity.value = undefined
}

async function onSaveEdit(item: RecipeItem) {
    if (!editQuantity.value) return

    saving.value = true
    try {
        const response = await $fetch<IResponse & { response: RecipeItem }>(`/products/${props.productId}/ingredients/${item.ingredient_id}`, {
            baseURL: baseUrl,
            method: 'PATCH',
            headers: { authorization: token ?? '' },
            body: { quantity_used: Number(editQuantity.value) },
        })

        if (!response.success) {
            throw new Error(response.errorMessage || response.errorDescription || 'Failed to update quantity')
        }

        toast.add({ title: 'Quantity updated', color: 'success' })
        onCancelEdit()
        await refresh()
    } catch (error: any) {
        toast.add({
            title: 'Error updating quantity',
            description: error?.data?.statusMessage || error?.data?.message || error?.message || 'Something went wrong',
            color: 'error'
        })
    } finally {
        saving.value = false
    }
}

// ---- remove ----
const removingId = ref<number | null>(null)

async function onRemove(item: RecipeItem) {
    removingId.value = item.id
    try {
        await $fetch(`/products/${props.productId}/ingredients/${item.ingredient_id}`, {
            baseURL: baseUrl,
            method: 'DELETE',
            headers: { authorization: token ?? '' },
        })
        toast.add({ title: 'Ingredient removed from recipe', color: 'success' })
        await refresh()
    } catch (error: any) {
        toast.add({
            title: 'Error removing ingredient',
            description: error?.data?.statusMessage || error?.data?.message || error?.message || 'Something went wrong',
            color: 'error'
        })
    } finally {
        removingId.value = null
    }
}
</script>