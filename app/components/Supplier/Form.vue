<template>
    <div v-if="isViewMode" class="space-y-6">
        <div class="flex items-center gap-3">
            <div class="size-12 rounded-full bg-secondary-200 dark:bg-secondary-900/10 flex items-center justify-center shrink-0">
                <UIcon name="lucide:truck" class="size-6 text-secondary-700 dark:text-secondary-400"/>
            </div>
            <div>
                <p class="text-xs uppercase text-muted tracking-wide">Name</p>
                <p class="text-lg font-medium">{{ supplier?.name }}</p>
            </div>
            <UBadge
                class="ml-auto"
                :label="supplier?.is_active ? 'Active' : 'Inactive'"
                :color="supplier?.is_active ? 'success' : 'error'"
            />
        </div>

        <div class="grid grid-cols-2 gap-6">
            <div>
                <p class="text-xs uppercase text-muted tracking-wide">Contact Person</p>
                <p class="mt-1">{{ supplier?.contact_person || '—' }}</p>
            </div>
            <div>
                <p class="text-xs uppercase text-muted tracking-wide">Contact Number</p>
                <p class="mt-1">{{ supplier?.contact_number || '—' }}</p>
            </div>
        </div>

        <div>
            <p class="text-xs uppercase text-muted tracking-wide">Email</p>
            <p class="mt-1">{{ supplier?.email || '—' }}</p>
        </div>

        <div>
            <p class="text-xs uppercase text-muted tracking-wide">Address</p>
            <p class="mt-1">{{ supplier?.address || '—' }}</p>
        </div>
    </div>

    <UForm v-else :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
        <UFormField label="Name" name="name" required>
            <UInput v-model="state.name" placeholder="Supplier name" class="w-full" />
        </UFormField>

        <div class="grid grid-cols-2 gap-4">
            <UFormField label="Contact Person" name="contact_person">
                <UInput v-model="state.contact_person" placeholder="Contact person" class="w-full" />
            </UFormField>

            <UFormField label="Contact Number" name="contact_number">
                <UInput v-model="state.contact_number" placeholder="Contact number" class="w-full" />
            </UFormField>
        </div>

        <UFormField label="Email" name="email">
            <UInput v-model="state.email" type="email" placeholder="supplier@example.com" class="w-full" />
        </UFormField>

        <UFormField label="Address" name="address">
            <UTextarea v-model="state.address" placeholder="Supplier address" class="w-full" />
        </UFormField>

        <UFormField label="Active" name="is_active">
            <USwitch v-model="state.is_active" />
        </UFormField>

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
import type { Supplier } from '~/types/models/supplier.types'
import type { IResponse } from '~/types/response'

// mode: 'create' (no supplier needed) | 'edit' (supplier required, real form) |
// 'view' (supplier required, plain read-only display).
const props = withDefaults(defineProps<{
    mode?: 'create' | 'edit' | 'view'
    supplier?: Supplier
}>(), {
    mode: 'create'
})

const emit = defineEmits<{
    success: [supplier: Supplier]
    cancel: []
}>()

const isEditMode = computed(() => props.mode === 'edit')
const isViewMode = computed(() => props.mode === 'view')

const { baseUrl, token } = useAPI()
const toast = useToast()
const loading = ref(false)

const schema = z.object({
    name: z.string().min(1, 'Name is required').max(150, 'Max 150 characters'),
    contact_person: z.string().max(150).optional(),
    contact_number: z.string().max(30).optional(),
    email: z.union([z.string().email('Invalid email address'), z.literal('')]).optional(),
    address: z.string().max(255).optional(),
    is_active: z.boolean(),
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
    name: props.supplier?.name ?? '',
    contact_person: props.supplier?.contact_person ?? '',
    contact_number: props.supplier?.contact_number ?? '',
    email: props.supplier?.email ?? '',
    address: props.supplier?.address ?? '',
    is_active: props.supplier?.is_active ?? true,
})

// keep the form in sync when the supplier prop changes (e.g. moving between view/edit)
watch(() => props.supplier, (s) => {
    if (!s) return
    state.name = s.name
    state.contact_person = s.contact_person ?? ''
    state.contact_number = s.contact_number ?? ''
    state.email = s.email ?? ''
    state.address = s.address ?? ''
    state.is_active = s.is_active
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
    loading.value = true
    try {
        const response = isEditMode.value && props.supplier
            ? await $fetch<IResponse & { response: Supplier }>(`/suppliers/${props.supplier.uuid}`, {
                baseURL: baseUrl,
                method: 'PUT',
                headers: { authorization: token ?? '' },
                body: event.data,
            })
            : await $fetch<IResponse & { response: Supplier }>('/suppliers', {
                baseURL: baseUrl,
                method: 'POST',
                headers: { authorization: token ?? '' },
                body: event.data,
            })

        if (!response.success) {
            throw new Error(
                response.errorMessage ||
                response.errorDescription ||
                `Failed to ${isEditMode.value ? 'update' : 'create'} supplier`
            )
        }

        toast.add({
            title: isEditMode.value ? 'Supplier updated' : 'Supplier created',
            color: 'success',
        })

        emit('success', response.response)
    } catch (error: any) {
        toast.add({
            title: `Error ${isEditMode.value ? 'updating' : 'creating'} supplier`,
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