<template>
    <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
        <UFormField label="Name" name="name" required description="e.g. Senior Citizen, PWD, Staff meal">
            <UInput v-model="state.name" placeholder="Senior Citizen" class="w-full" />
        </UFormField>

        <UFormField label="Type" name="type" required>
            <URadioGroup
                v-model="state.type"
                :items="typeOptions"
                orientation="horizontal"
                variant="table"
            />
        </UFormField>

        <UFormField :label="state.type === 'percent' ? 'Percentage' : 'Amount'" name="value" required>
            <UInput v-model.number="state.value" type="number" min="0" step="0.01" class="w-full">
                <template #trailing>
                    <span class="text-muted text-sm">{{ state.type === 'percent' ? '%' : '₱' }}</span>
                </template>
            </UInput>
        </UFormField>

        <UFormField label="Active" name="is_active" description="Only active discounts can be applied on the POS">
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
import type { Discount, DiscountType } from '~/types/models/discount.types'
import type { IResponse } from '~/types/response'

const props = withDefaults(defineProps<{
    mode?: 'create' | 'edit'
    discount?: Discount
}>(), {
    mode: 'create'
})

const emit = defineEmits<{
    success: [discount: Discount]
    cancel: []
}>()

const isEditMode = computed(() => props.mode === 'edit')

const { baseUrl, token } = useAPI()
const toast = useToast()
const loading = ref(false)

const typeOptions: { value: DiscountType; label: string }[] = [
    { value: 'percent', label: 'Percentage (%)' },
    { value: 'fixed', label: 'Fixed amount (₱)' },
]

const schema = z.object({
    name: z.string().trim().min(1, 'Name is required').max(100, 'Max 100 characters'),
    type: z.enum(['percent', 'fixed']),
    value: z.number({ error: 'Enter a value' }).positive('Must be greater than 0'),
    is_active: z.boolean(),
}).refine((d) => d.type !== 'percent' || d.value <= 100, {
    message: 'A percentage can\'t be more than 100',
    path: ['value'],
})

type Schema = z.output<typeof schema>

const state = reactive({
    name: props.discount?.name ?? '',
    type: (props.discount?.type ?? 'percent') as DiscountType,
    value: props.discount ? Number(props.discount.value) : (undefined as number | undefined),
    is_active: props.discount?.is_active ?? true,
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
    loading.value = true
    try {
        const response = await $fetch<IResponse & { response: Discount }>(
            isEditMode.value && props.discount ? `/discounts/${props.discount.uuid}` : '/discounts',
            {
                baseURL: baseUrl,
                method: isEditMode.value ? 'PUT' : 'POST',
                headers: { authorization: token.value ?? '' },
                body: event.data,
            }
        )

        if (!response.success) {
            throw new Error(
                response.errorMessage ||
                response.errorDescription ||
                `Failed to ${isEditMode.value ? 'update' : 'create'} discount`
            )
        }

        toast.add({ title: isEditMode.value ? 'Discount updated' : 'Discount created', color: 'success' })
        emit('success', response.response)
    } catch (error: any) {
        toast.add({
            title: `Error ${isEditMode.value ? 'updating' : 'creating'} discount`,
            description: error?.data?.statusMessage || error?.data?.message || error?.message || 'Something went wrong',
            color: 'error'
        })
    } finally {
        loading.value = false
    }
}
</script>
