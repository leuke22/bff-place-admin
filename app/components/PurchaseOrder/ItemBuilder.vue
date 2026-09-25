<template>
    <div class="space-y-3">
        <div v-for="(item, index) in modelValue" :key="index" class="flex flex-row gap-2 items-start">
            <USelectMenu
                :model-value="item.ingredient_id"
                :items="ingredientOptions"
                value-key="value"
                label-key="label"
                placeholder="Select ingredient"
                class="flex-1"
                @update:model-value="(val) => updateItem(index, 'ingredient_id', val)"
            />
            <UInput
                :model-value="item.quantity"
                type="number"
                step="0.001"
                placeholder="Qty"
                class="w-28"
                @update:model-value="(val) => updateItem(index, 'quantity', Number(val))"
            />
            <UInput
                :model-value="item.unit_cost"
                type="number"
                step="0.01"
                placeholder="Unit Cost"
                class="w-32"
                @update:model-value="(val) => updateItem(index, 'unit_cost', Number(val))"
            >
                <template #leading><span class="text-muted">₱</span></template>
            </UInput>
            <p class="w-28 text-sm text-right pt-2.5">{{ formatCurrency((item.quantity || 0) * (item.unit_cost || 0)) }}</p>
            <UButton icon="lucide:x" color="error" variant="ghost" @click="removeItem(index)"/>
        </div>

        <UButton icon="lucide:circle-plus" label="Add Item" variant="outline" color="neutral" size="sm" @click="addItem"/>

        <div class="flex justify-end pt-2 border-t border-default">
            <p class="text-lg font-semibold">Total: {{ formatCurrency(total) }}</p>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { CreatePurchaseOrderItemInput } from '~/types/models/purchase_order.types'
import type { Ingredient } from '~/types/models/ingredient.types'
import type { IListResponse } from '~/types/response'

const modelValue = defineModel<CreatePurchaseOrderItemInput[]>({ required: true })

const { baseUrl, token } = useAPI()

const { data: ingredients } = await useLazyFetch('/ingredients', {
    key: 'ingredients-for-po',
    baseURL: baseUrl,
    headers: { authorization: token ?? '' },
    transform: (data: IListResponse<Ingredient>) => data.response.rows,
})

const ingredientOptions = computed(() =>
    (ingredients.value ?? []).map((i) => ({ value: i.id, label: `${i.name} (${i.unit})` }))
)

const total = computed(() =>
    modelValue.value.reduce((sum, item) => sum + (item.quantity || 0) * (item.unit_cost || 0), 0)
)

function addItem() {
    modelValue.value = [...modelValue.value, { ingredient_id: 0, quantity: 0, unit_cost: 0 }]
}

function removeItem(index: number) {
    modelValue.value = modelValue.value.filter((_, i) => i !== index)
}

function updateItem(index: number, key: keyof CreatePurchaseOrderItemInput, value: any) {
    modelValue.value = modelValue.value.map((item, i) => i === index ? { ...item, [key]: value } : item)
}
</script>