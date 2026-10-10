<template>
    <div>
        <div class="mb-3">
            <PageHeader title="Shift History" description="Review past cashier shifts" :items :has-view="false"/>
        </div>
        <div class="flex flex-row justify-end mb-3">
            <UButton icon="lucide:refresh-ccw" variant="outline" color="neutral" :loading="status === 'pending'" @click="refresh()"/>
        </div>

        <div v-if="shifts.length" class="divide-y divide-default rounded-lg border border-default">
            <NuxtLink
                v-for="shift in shifts"
                :key="shift.id"
                :to="`/pos/shifts/${shift.id}`"
                class="flex flex-row items-center justify-between gap-3 px-4 py-3 hover:bg-elevated/50"
            >
                <div>
                    <p class="font-medium">{{ shift.cashier ? `${shift.cashier.first_name} ${shift.cashier.last_name}` : 'Unknown' }}</p>
                    <p class="text-xs text-muted">
                        {{ formatDate(shift.opened_at, 'datetime') }}
                        <template v-if="shift.closed_at"> → {{ formatDate(shift.closed_at, 'datetime') }}</template>
                    </p>
                </div>
                <div class="text-right">
                    <UBadge v-if="!shift.closed_at" color="success" variant="subtle" label="Open"/>
                    <p v-else class="text-sm">
                        Variance:
                        <span :class="Math.abs(Number(shift.variance)) < 0.01 ? 'text-success' : 'text-error'">
                            {{ formatCurrency(shift.variance ?? 0) }}
                        </span>
                    </p>
                </div>
            </NuxtLink>
        </div>
        <div v-else class="rounded-lg border border-default p-10 text-center text-muted">
            No shifts recorded yet.
        </div>
    </div>
</template>

<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui'
import type { Shift } from '~/types/models/shift.types'
import type { IListResponse } from '~/types/response'

definePageMeta({
    middleware: 'require-auth',
    layout: 'pos'
})

const { baseUrl, token } = useAPI()
const { data: authData } = useAuth()

const items = ref<BreadcrumbItem[]>([{ label: 'Shift History', to: '/pos/shifts' }])

// listShifts is admin/manager only on the backend — bounce anyone else back to the order screen
if (authData.value?.role === 'cashier') {
    await navigateTo('/pos')
}

const { data: shifts, refresh, status } = useAsyncData(
    'shift-history',
    () => $fetch<IListResponse<Shift>>('/shifts', {
        baseURL: baseUrl,
        headers: { authorization: token.value ?? '' },
    }),
    {
        transform: (data: IListResponse<Shift>) => data.response.rows,
        default: () => [] as Shift[]
    }
)
</script>