<template>
    <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
        <UFormField label="Name" name="name" required description="e.g. Kilogram, Liter, Piece">
            <UInput v-model="state.name" placeholder="Kilogram" class="w-full" />
        </UFormField>

        <UFormField label="Symbol" name="symbol" required description="What shows on ingredients, e.g. kg, L, pcs">
            <UInput v-model="state.symbol" placeholder="kg" class="w-full" />
        </UFormField>

        <UFormField label="Active" name="is_active">
            <USwitch v-model="state.is_active" />
        </UFormField>

        <div class="flex justify-end gap-2 pt-2">
            <UButton label="Cancel" color="neutral" variant="soft" :disabled="loading" @click="emit('cancel')" />
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
import type { Unit } from '~/types/models/unit.types'
import type { IResponse } from '~/types/response'

const props = withDefaults(defineProps<{
    mode?: 'create' | 'edit'
    unit?: Unit
}>(), {
    mode: 'create'
})

const emit = defineEmits<{
    success: [unit: Unit]
    cancel: []
}>()

const isEditMode = computed(() => props.mode === 'edit')

const { baseUrl, token } = useAPI()
const toast = useToast()
const loading = ref(false)

const schema = z.object({
    name: z.string().min(1, 'Name is required').max(50, 'Max 50 characters'),
    symbol: z.string().min(1, 'Symbol is required').max(10, 'Max 10 characters'),
    is_active: z.boolean(),
})

type Schema = z.output<typeof schema>

const state = reactive<Schema>({
    name: props.unit?.name ?? '',
    symbol: props.unit?.symbol ?? '',
    is_active: props.unit?.is_active ?? true,
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
    loading.value = true
    try {
        const response = isEditMode.value && props.unit
            ? await $fetch<IResponse & { response: Unit }>(`/units/${props.unit.uuid}`, {
                baseURL: baseUrl,
                method: 'PUT',
                headers: { authorization: token ?? '' },
                body: event.data,
            })
            : await $fetch<IResponse & { response: Unit }>('/units', {
                baseURL: baseUrl,
                method: 'POST',
                headers: { authorization: token ?? '' },
                body: event.data,
            })

        if (!response.success) {
            throw new Error(
                response.errorMessage ||
                response.errorDescription ||
                `Failed to ${isEditMode.value ? 'update' : 'create'} unit`
            )
        }

        toast.add({ title: isEditMode.value ? 'Unit updated' : 'Unit created', color: 'success' })
        emit('success', response.response)
    } catch (error: any) {
        toast.add({
            title: `Error ${isEditMode.value ? 'updating' : 'creating'} unit`,
            description: error?.data?.statusMessage || error?.data?.message || error?.message || 'Something went wrong',
            color: 'error'
        })
    } finally {
        loading.value = false
    }
}
</script>