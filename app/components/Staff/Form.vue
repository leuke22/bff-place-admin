<template>
    <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
        <div class="grid grid-cols-2 gap-4">
            <UFormField label="First Name" name="first_name" required>
                <UInput v-model="state.first_name" placeholder="First name" class="w-full" />
            </UFormField>
            <UFormField label="Last Name" name="last_name" required>
                <UInput v-model="state.last_name" placeholder="Last name" class="w-full" />
            </UFormField>
        </div>

        <UFormField label="Middle Name" name="middle_name">
            <UInput v-model="state.middle_name" placeholder="Middle name (optional)" class="w-full" />
        </UFormField>

        <template v-if="isCreateMode">
            <UFormField label="Email" name="email" required>
                <UInput v-model="state.email" type="email" placeholder="staff@example.com" class="w-full" />
            </UFormField>

            <UFormField label="Password" name="password" required description="Share this with the staff member securely — they can change it later from their own Profile page.">
                <UInput v-model="state.password" type="text" placeholder="At least 8 characters" class="w-full" />
            </UFormField>
        </template>

        <UFormField label="Role" name="role" required>
            <USelect v-model="state.role" :items="roleOptions" class="w-full" />
        </UFormField>

        <UFormField v-if="!isCreateMode" label="Active" name="is_active">
            <USwitch v-model="state.is_active" />
        </UFormField>

        <div class="flex justify-end gap-2 pt-2">
            <UButton label="Cancel" color="neutral" variant="soft" :disabled="loading" @click="emit('cancel')" />
            <UButton :label="isCreateMode ? 'Create Staff' : 'Save Changes'" type="submit" :loading="loading" :disabled="loading" />
        </div>
    </UForm>
</template>

<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { Staff, UserRole } from '~/types/models/staff.types'
import type { IResponse } from '~/types/response'

const props = withDefaults(defineProps<{
    mode?: 'create' | 'edit'
    staff?: Staff
    allowedRoles: UserRole[]
}>(), {
    mode: 'create'
})

const emit = defineEmits<{
    success: [staff: Staff]
    cancel: []
}>()

const isCreateMode = computed(() => props.mode === 'create')

const { baseUrl, token } = useAPI()
const toast = useToast()
const loading = ref(false)

const roleLabels: Record<UserRole, string> = { admin: 'Admin', manager: 'Manager', cashier: 'Cashier' }
const roleOptions = computed(() => props.allowedRoles.map((r) => ({ value: r, label: roleLabels[r] })))

const schema = computed(() => isCreateMode.value
    ? z.object({
        first_name: z.string().min(1, 'First name is required').max(100),
        middle_name: z.string().max(100).optional(),
        last_name: z.string().min(1, 'Last name is required').max(100),
        email: z.string().email('Invalid email address'),
        password: z.string().min(8, 'Password must be at least 8 characters'),
        role: z.enum(['admin', 'manager', 'cashier'], { error: 'Role is required' }),
    })
    : z.object({
        first_name: z.string().min(1, 'First name is required').max(100),
        middle_name: z.string().max(100).optional(),
        last_name: z.string().min(1, 'Last name is required').max(100),
        role: z.enum(['admin', 'manager', 'cashier'], { error: 'Role is required' }),
        is_active: z.boolean(),
    })
)

const state = reactive({
    first_name: props.staff?.first_name ?? '',
    middle_name: props.staff?.middle_name ?? '',
    last_name: props.staff?.last_name ?? '',
    email: '',
    password: '',
    role: props.staff?.role ?? props.allowedRoles[props.allowedRoles.length - 1],
    is_active: props.staff?.is_active ?? true,
})

async function onSubmit(event: FormSubmitEvent<any>) {
    loading.value = true
    try {
        const response = !isCreateMode.value && props.staff
            ? await $fetch<IResponse & { response: Staff }>(`/staff/${props.staff.uuid}`, {
                baseURL: baseUrl,
                method: 'PATCH',
                headers: { authorization: token.value ?? '' },
                body: {
                    first_name: event.data.first_name,
                    middle_name: event.data.middle_name || undefined,
                    last_name: event.data.last_name,
                    role: event.data.role,
                    is_active: event.data.is_active,
                },
            })
            : await $fetch<IResponse & { response: Staff }>('/staff', {
                baseURL: baseUrl,
                method: 'POST',
                headers: { authorization: token.value ?? '' },
                body: event.data,
            })

        if (!response.success) {
            throw new Error(response.errorMessage || response.errorDescription || `Failed to ${isCreateMode.value ? 'create' : 'update'} staff member`)
        }

        toast.add({ title: isCreateMode.value ? 'Staff member created' : 'Staff member updated', color: 'success' })
        emit('success', response.response)
    } catch (error: any) {
        toast.add({
            title: `Error ${isCreateMode.value ? 'creating' : 'updating'} staff member`,
            description: error?.data?.statusMessage || error?.data?.message || error?.message || 'Something went wrong',
            color: 'error'
        })
    } finally {
        loading.value = false
    }
}
</script>