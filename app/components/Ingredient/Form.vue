<template>
    <div v-if="isViewMode" class="space-y-6">
        <div class="flex items-center gap-3">
            <div class="size-12 rounded-full bg-secondary-200 dark:bg-secondary-900/10 flex items-center justify-center shrink-0">
                <UIcon name="lucide:wheat" class="size-6 text-secondary-700 dark:text-secondary-400"/>
            </div>
            <div>
                <p class="text-xs uppercase text-muted tracking-wide">Name</p>
                <p class="text-lg font-medium">{{ ingredient?.name }}</p>
            </div>
        </div>

        <div class="grid grid-cols-2 gap-6">
            <div>
                <p class="text-xs uppercase text-muted tracking-wide">Unit</p>
                <p class="mt-1">{{ ingredient?.unit }}</p>
            </div>
            <div>
                <p class="text-xs uppercase text-muted tracking-wide">Status</p>
                <UBadge class="mt-1" :label="isLowStock ? 'Low Stock' : 'In Stock'" :color="isLowStock ? 'error' : 'success'" variant="subtle"/>
            </div>
        </div>

        <div class="grid grid-cols-2 gap-6">
            <div>
                <p class="text-xs uppercase text-muted tracking-wide">Current Stock</p>
                <p class="mt-1">{{ Number(ingredient?.current_stock ?? 0) }} {{ ingredient?.unit }}</p>
            </div>
            <div>
                <p class="text-xs uppercase text-muted tracking-wide">Reorder Level</p>
                <p class="mt-1">{{ Number(ingredient?.reorder_level ?? 0) }} {{ ingredient?.unit }}</p>
            </div>
        </div>
    </div>

    <UForm v-else :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
        <UFormField label="Name" name="name" required>
            <UInput v-model="state.name" placeholder="Ingredient name" class="w-full" />
        </UFormField>

        <UFormField label="Unit" name="unit" required>
            <USelect v-model="state.unit" :items="unitOptions" placeholder="Select a unit" class="w-full" />
        </UFormField>

        <div class="grid grid-cols-2 gap-4">
            <UFormField label="Current Stock" name="current_stock" required>
                <UInput v-model="state.current_stock" type="number" step="0.001" placeholder="0.000" class="w-full" />
            </UFormField>

            <UFormField label="Reorder Level" name="reorder_level" required>
                <UInput v-model="state.reorder_level" type="number" step="0.001" placeholder="0.000" class="w-full" />
            </UFormField>
        </div>

        <div class="flex justify-end gap-2 pt-2">
            <UButton label="Cancel" color="neutral" variant="soft" :disabled="loading" @click="onCancel" />
            <UButton
                :label="isEditMode ? 'Update' : 'Create'"
                type="submit"
                :loading="loading"
                :disabled="loading"
            />
        </div>
    </UForm>
</template>

<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { Ingredient } from '~/types/models/ingredient.types'
import type { IResponse } from '~/types/response'

// mode: 'create' (no ingredient needed) | 'edit' (ingredient required, real form) |
// 'view' (ingredient required, plain read-only display).
const props = withDefaults(defineProps<{
    mode?: 'create' | 'edit' | 'view'
    ingredient?: Ingredient
}>(), {
    mode: 'create'
})

const emit = defineEmits<{
    success: [ingredient: Ingredient]
    cancel: []
}>()

const isEditMode = computed(() => props.mode === 'edit')
const isViewMode = computed(() => props.mode === 'view')

const { baseUrl, token } = useAPI()
const toast = useToast()
const loading = ref(false)

const isLowStock = computed(() => {
    if (!props.ingredient) return false
    return Number(props.ingredient.current_stock) <= Number(props.ingredient.reorder_level)
})

const unitOptions = ['kg', 'g', 'L', 'ml', 'pcs']

const schema = z.object({
    name: z.string().min(1, 'Name is required').max(150, 'Max 150 characters'),
    unit: z.enum(['kg', 'g', 'L', 'ml', 'pcs'], { error: 'Unit is required' }),
    current_stock: z.coerce.number({ error: 'Current stock is required' }).nonnegative('Must be 0 or more'),
    reorder_level: z.coerce.number({ error: 'Reorder level is required' }).nonnegative('Must be 0 or more'),
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
    name: props.ingredient?.name ?? '',
    unit: (props.ingredient?.unit as Schema['unit']) ?? 'pcs',
    current_stock: props.ingredient ? Number(props.ingredient.current_stock) : 0,
    reorder_level: props.ingredient ? Number(props.ingredient.reorder_level) : 0,
})

// keep the form in sync when the ingredient prop changes (e.g. moving between view/edit)
watch(() => props.ingredient, (i) => {
    if (!i) return
    state.name = i.name
    state.unit = i.unit as Schema['unit']
    state.current_stock = Number(i.current_stock)
    state.reorder_level = Number(i.reorder_level)
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
    loading.value = true
    try {
        const response = isEditMode.value && props.ingredient
            ? await $fetch<IResponse & { response: Ingredient }>(`/ingredients/${props.ingredient.id}`, {
                baseURL: baseUrl,
                method: 'PATCH',
                headers: { authorization: token ?? '' },
                body: event.data,
            })
            : await $fetch<IResponse & { response: Ingredient }>('/ingredients', {
                baseURL: baseUrl,
                method: 'POST',
                headers: { authorization: token ?? '' },
                body: event.data,
            })

        if (!response.success) {
            throw new Error(
                response.errorMessage ||
                response.errorDescription ||
                `Failed to ${isEditMode.value ? 'update' : 'create'} ingredient`
            )
        }

        toast.add({
            title: isEditMode.value ? 'Ingredient updated' : 'Ingredient created',
            color: 'success',
        })

        emit('success', response.response)
    } catch (error: any) {
        toast.add({
            title: `Error ${isEditMode.value ? 'updating' : 'creating'} ingredient`,
            description: error?.data?.statusMessage || error?.data?.message || error?.message || 'Something went wrong',
            color: 'error'
        })
    } finally {
        loading.value = false
    }
}

function onCancel() {
    emit('cancel')
}
</script>