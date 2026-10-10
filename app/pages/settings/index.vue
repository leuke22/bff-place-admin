<template>
    <div class="space-y-6">
        <PageHeader title="Settings" description="Manage staff accounts and roles" :items :has-view="false"/>

        <div class="flex flex-row justify-between items-center">
            <h2 class="text-lg font-semibold">Staff Management</h2>
            <div class="flex flex-row gap-3">
                <UButton icon="lucide:refresh-ccw" variant="outline" color="neutral" :loading="status === 'pending'" @click="refresh()"/>
                <UButton icon="lucide:user-plus" label="Add Staff" @click="onCreate"/>
            </div>
        </div>

        <div v-if="staff.length" class="divide-y divide-default rounded-lg border border-default">
            <div v-for="member in staff" :key="member.uuid" class="flex flex-row items-center justify-between gap-3 px-4 py-3">
                <div class="flex items-center gap-3">
                    <UAvatar :src="member.avatar ?? undefined" :alt="member.first_name" size="sm"/>
                    <div>
                        <p class="font-medium">{{ member.first_name }} {{ member.last_name }}</p>
                        <p class="text-xs text-muted">{{ member.email }}</p>
                    </div>
                </div>

                <div class="flex items-center gap-3">
                    <UBadge :label="roleLabel(member.role)" :color="roleColor(member.role)" variant="subtle"/>
                    <UBadge :label="member.is_active ? 'Active' : 'Inactive'" :color="member.is_active ? 'success' : 'error'" variant="subtle"/>
                    <template v-if="canManage(member)">
                        <UButton icon="lucide:edit" variant="ghost" color="neutral" size="sm" @click="onEdit(member)"/>
                        <UButton icon="lucide:trash-2" variant="ghost" color="error" size="sm" @click="onDelete(member)"/>
                    </template>
                </div>
            </div>
        </div>
        <div v-else class="rounded-lg border border-default p-10 text-center text-muted">
            No staff members found.
        </div>

        <UModal
            v-model:open="modalOpen"
            :title="editingStaff ? 'Edit Staff' : 'Add Staff'"
            :description="editingStaff ? 'Update this staff member\'s details' : 'Create a new staff account'"
        >
            <template #body>
                <StaffForm
                    :key="editingStaff?.uuid ?? 'new'"
                    :mode="editingStaff ? 'edit' : 'create'"
                    :staff="editingStaff"
                    :allowed-roles="allowedRoles"
                    @success="onSaved"
                    @cancel="modalOpen = false"
                />
            </template>
        </UModal>
    </div>
</template>

<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui'
import type { Staff, UserRole } from '~/types/models/staff.types'
import type { IListResponse } from '~/types/response'

definePageMeta({
    middleware: 'require-auth',
    layout: 'account'
})

const { baseUrl, token } = useAPI()
const { data: authData } = useAuth()
const toast = useToast()

// Staff Management is admin/manager only — the backend already enforces this,
// this just keeps a cashier from landing on a page that 403s on load.
if (authData.value?.role === 'cashier') {
    await navigateTo('/pos')
}

const items = ref<BreadcrumbItem[]>([{ label: 'Settings', to: '/settings' }])

const allowedRoles = computed<UserRole[]>(() =>
    authData.value?.role === 'admin' ? ['admin', 'manager', 'cashier'] : ['manager', 'cashier']
)

const { data: staff, refresh, status } = useAsyncData(
    'staff-list',
    () => $fetch<IListResponse<Staff>>('/staff', {
        baseURL: baseUrl,
        headers: { authorization: token.value ?? '' },
    }),
    {
        transform: (data: IListResponse<Staff>) => data.response.rows,
        default: () => [] as Staff[]
    }
)

function roleLabel(role: UserRole) {
    return role === 'admin' ? 'Admin' : role === 'manager' ? 'Manager' : 'Cashier'
}

function roleColor(role: UserRole) {
    return role === 'admin' ? 'primary' as const : role === 'manager' ? 'warning' as const : 'neutral' as const
}

// Mirrors the backend's guards: can't manage yourself here, and a manager can't touch an admin.
function canManage(member: Staff) {
    if (member.id === authData.value?.id) return false
    if (member.role === 'admin' && authData.value?.role !== 'admin') return false
    return true
}

const modalOpen = ref(false)
const editingStaff = ref<Staff | undefined>(undefined)

function onCreate() {
    editingStaff.value = undefined
    modalOpen.value = true
}

function onEdit(member: Staff) {
    editingStaff.value = member
    modalOpen.value = true
}

function onSaved() {
    modalOpen.value = false
    refresh()
}

async function onDelete(member: Staff) {
    if (!confirm(`Remove ${member.first_name} ${member.last_name}?`)) return

    try {
        await $fetch(`/staff/${member.uuid}`, {
            baseURL: baseUrl,
            method: 'DELETE',
            headers: { authorization: token.value ?? '' },
        })
        toast.add({ title: 'Staff member removed', color: 'success' })
        refresh()
    } catch (error: any) {
        toast.add({
            title: 'Error removing staff member',
            description: error?.data?.statusMessage || error?.data?.message || error?.message || 'Something went wrong',
            color: 'error'
        })
    }
}
</script>