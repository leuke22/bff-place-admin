<template>
    <div class="space-y-6">
        <PageHeader title="Profile" description="Manage your own account" :items :has-view="false"/>

        <!-- Profile information -->
        <UForm :schema="infoSchema" :state="infoState" class="rounded-lg border border-default p-5 space-y-4" @submit="onSaveInfo">
            <h2 class="text-lg font-semibold">Profile Information</h2>

            <UFormField label="Avatar" name="avatar">
                <div class="flex items-center gap-4">
                    <UAvatar :src="avatarPreviewUrl ?? undefined" :alt="infoState.first_name" size="xl"/>
                    <UFileUpload
                        v-model="avatarFile"
                        label="Drop a photo here"
                        description="PNG or JPG (max. 2MB)"
                        accept="image/png,image/jpeg"
                        :max-size="2 * 1024 * 1024"
                        class="flex-1"
                    />
                </div>
            </UFormField>

            <div class="grid grid-cols-2 gap-4">
                <UFormField label="First Name" name="first_name" required>
                    <UInput v-model="infoState.first_name" class="w-full"/>
                </UFormField>
                <UFormField label="Last Name" name="last_name" required>
                    <UInput v-model="infoState.last_name" class="w-full"/>
                </UFormField>
            </div>

            <UFormField label="Middle Name" name="middle_name">
                <UInput v-model="infoState.middle_name" class="w-full"/>
            </UFormField>

            <UFormField label="Email" name="email" required>
                <UInput v-model="infoState.email" type="email" class="w-full"/>
            </UFormField>

            <div class="flex justify-end">
                <UButton label="Save Changes" type="submit" :loading="savingInfo || uploading"/>
            </div>
        </UForm>

        <!-- Change password -->
        <UForm :schema="passwordSchema" :state="passwordState" class="rounded-lg border border-default p-5 space-y-4" @submit="onChangePassword">
            <h2 class="text-lg font-semibold">Change Password</h2>

            <UFormField label="Current Password" name="current_password" required>
                <UInput v-model="passwordState.current_password" type="password" class="w-full"/>
            </UFormField>

            <UFormField label="New Password" name="new_password" required>
                <UInput v-model="passwordState.new_password" type="password" class="w-full"/>
            </UFormField>

            <UFormField label="Confirm New Password" name="confirm_password" required>
                <UInput v-model="passwordState.confirm_password" type="password" class="w-full"/>
            </UFormField>

            <div class="flex justify-end">
                <UButton label="Update Password" type="submit" :loading="savingPassword"/>
            </div>
        </UForm>
    </div>
</template>

<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { BreadcrumbItem } from '@nuxt/ui'
import type { ProfileUser } from '~/types/models/profile.types'

definePageMeta({
    middleware: 'require-auth',
    layout: 'account'
})

const { baseUrl, token } = useAPI()
const { data: authData, getSession } = useAuth()
const { uploadFile, uploading } = useUpload()
const toast = useToast()

const items = ref<BreadcrumbItem[]>([{ label: 'Profile', to: '/profile' }])

// ---- profile info ----
const infoSchema = z.object({
    first_name: z.string().min(1, 'First name is required').max(100),
    middle_name: z.string().max(100).optional(),
    last_name: z.string().min(1, 'Last name is required').max(100),
    email: z.string().email('Invalid email address'),
})

const infoState = reactive({
    first_name: authData.value?.first_name ?? '',
    middle_name: '',
    last_name: authData.value?.last_name ?? '',
    email: authData.value?.email ?? '',
})

const avatarFile = ref<File | null>(null)
const avatarPreviewUrl = ref<string | null>(authData.value?.avatar ?? null)

watch(avatarFile, (newFile, oldFile) => {
    if (oldFile && avatarPreviewUrl.value?.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreviewUrl.value)
    }
    avatarPreviewUrl.value = newFile ? URL.createObjectURL(newFile) : (authData.value?.avatar ?? null)
})

const savingInfo = ref(false)

async function onSaveInfo(event: FormSubmitEvent<z.output<typeof infoSchema>>) {
    let avatarUrl: string | undefined

    if (avatarFile.value) {
        const result = await uploadFile(avatarFile.value, 'avatars')
        if (!result) {
            toast.add({ title: 'Avatar upload failed', description: 'Please try again.', color: 'error' })
            return
        }
        avatarUrl = result.fileUrl
    }

    savingInfo.value = true
    try {
        const response = await $fetch<{ user: ProfileUser }>('/auth/me', {
            baseURL: baseUrl,
            method: 'PATCH',
            headers: { authorization: token ?? '' },
            body: {
                first_name: event.data.first_name,
                middle_name: event.data.middle_name || undefined,
                last_name: event.data.last_name,
                email: event.data.email,
                avatar: avatarUrl,
            },
        })

        toast.add({ title: 'Profile updated', color: 'success' })
        avatarFile.value = null
        await getSession() // refresh the name/avatar shown in the sidebars
        void response
    } catch (error: any) {
        toast.add({
            title: 'Error updating profile',
            description: error?.data?.statusMessage || error?.data?.message || error?.message || 'Something went wrong',
            color: 'error'
        })
    } finally {
        savingInfo.value = false
    }
}

// ---- change password ----
const passwordSchema = z.object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: z.string().min(8, 'New password must be at least 8 characters'),
    confirm_password: z.string().min(1, 'Please confirm your new password'),
}).refine((data) => data.new_password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
})

const passwordState = reactive({
    current_password: '',
    new_password: '',
    confirm_password: '',
})

const savingPassword = ref(false)

async function onChangePassword(event: FormSubmitEvent<z.output<typeof passwordSchema>>) {
    savingPassword.value = true
    try {
        await $fetch('/auth/me/password', {
            baseURL: baseUrl,
            method: 'PATCH',
            headers: { authorization: token ?? '' },
            body: {
                current_password: event.data.current_password,
                new_password: event.data.new_password,
            },
        })

        toast.add({ title: 'Password updated', color: 'success' })
        passwordState.current_password = ''
        passwordState.new_password = ''
        passwordState.confirm_password = ''
    } catch (error: any) {
        toast.add({
            title: 'Error updating password',
            description: error?.data?.statusMessage || error?.data?.message || error?.message || 'Something went wrong',
            color: 'error'
        })
    } finally {
        savingPassword.value = false
    }
}
</script>