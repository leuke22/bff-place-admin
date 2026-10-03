<template>
    <div>
        <div class="mb-3">
            <PageHeader :title="shift ? `Shift #${shift.id}` : 'Shift'" description="Shift summary and payment history" :items :has-view="false"/>
        </div>

        <div class="my-2">
            <UButton icon="lucide:arrow-left" label="Back to Shift History" variant="ghost" color="neutral" to="/pos/shifts"/>
        </div>

        <div v-if="shift" class="max-w-3xl space-y-6">
            <div class="rounded-lg border border-default p-5 space-y-4">
                <div class="flex flex-row justify-between items-start">
                    <div>
                        <p class="text-xs uppercase text-muted tracking-wide">Cashier</p>
                        <p class="text-lg font-semibold">{{ shift.cashier ? `${shift.cashier.first_name} ${shift.cashier.last_name}` : '—' }}</p>
                    </div>
                    <UBadge v-if="!shift.closed_at" color="success" variant="subtle" label="Open"/>
                    <UBadge v-else color="neutral" variant="subtle" label="Closed"/>
                </div>

                <div class="grid grid-cols-2 gap-6 text-sm">
                    <div>
                        <p class="text-xs uppercase text-muted tracking-wide">Opened</p>
                        <p class="mt-1">{{ formatDate(shift.opened_at, 'datetime') }}</p>
                    </div>
                    <div>
                        <p class="text-xs uppercase text-muted tracking-wide">Closed</p>
                        <p class="mt-1">{{ shift.closed_at ? formatDate(shift.closed_at, 'datetime') : '—' }}</p>
                    </div>
                </div>

                <div class="grid grid-cols-3 gap-6 text-sm pt-2 border-t border-default">
                    <div>
                        <p class="text-xs uppercase text-muted tracking-wide">Orders</p>
                        <p class="mt-1 font-medium">{{ shift.summary.order_count }}</p>
                    </div>
                    <div>
                        <p class="text-xs uppercase text-muted tracking-wide">Total Sales</p>
                        <p class="mt-1 font-medium">{{ formatCurrency(shift.summary.total_sales) }}</p>
                    </div>
                    <div>
                        <p class="text-xs uppercase text-muted tracking-wide">Cash Collected</p>
                        <p class="mt-1 font-medium">{{ formatCurrency(shift.summary.cash_collected) }}</p>
                    </div>
                </div>

                <template v-if="shift.closed_at">
                    <div class="grid grid-cols-3 gap-6 text-sm pt-2 border-t border-default">
                        <div>
                            <p class="text-xs uppercase text-muted tracking-wide">Opening Cash</p>
                            <p class="mt-1">{{ formatCurrency(shift.opening_cash) }}</p>
                        </div>
                        <div>
                            <p class="text-xs uppercase text-muted tracking-wide">Expected Cash</p>
                            <p class="mt-1">{{ formatCurrency(shift.expected_cash ?? 0) }}</p>
                        </div>
                        <div>
                            <p class="text-xs uppercase text-muted tracking-wide">Counted Cash</p>
                            <p class="mt-1">{{ formatCurrency(shift.closing_cash ?? 0) }}</p>
                        </div>
                    </div>
                    <div class="rounded-lg p-3 flex justify-between items-center" :class="Math.abs(Number(shift.variance)) < 0.01 ? 'bg-success/10' : 'bg-error/10'">
                        <span class="font-medium">Variance</span>
                        <span class="font-semibold" :class="Math.abs(Number(shift.variance)) < 0.01 ? 'text-success' : 'text-error'">
                            {{ formatCurrency(shift.variance ?? 0) }}
                        </span>
                    </div>
                </template>
            </div>

            <div class="space-y-3">
                <h2 class="text-lg font-semibold">Payment History</h2>
                <div v-if="shift.payments.length" class="divide-y divide-default rounded-lg border border-default">
                    <NuxtLink
                        v-for="payment in shift.payments"
                        :key="payment.id"
                        :to="`/pos/orders/${payment.order_uuid}`"
                        class="flex flex-row items-center justify-between gap-3 px-4 py-3 hover:bg-elevated/50"
                    >
                        <div>
                            <p class="font-medium">{{ payment.order_number }}</p>
                            <p class="text-xs text-muted capitalize">{{ payment.method }} · {{ formatDate(payment.paid_at, 'datetime') }}</p>
                        </div>
                        <p class="font-medium">{{ formatCurrency(payment.order_total) }}</p>
                    </NuxtLink>
                </div>
                <div v-else class="rounded-lg border border-default p-8 text-center text-muted">
                    No payments recorded for this shift.
                </div>
            </div>
        </div>

        <div v-else class="max-w-3xl">
            <div class="rounded-lg border border-default p-10 text-center text-muted">
                Shift not found.
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui'
import type { ShiftDetail } from '~/types/models/shift.types'
import type { IResponse } from '~/types/response'

definePageMeta({
    middleware: 'require-auth',
    layout: 'pos'
})

const route = useRoute()
const { baseUrl, token } = useAPI()

const { data: shift } = await useAsyncData(
    `shift-${route.params.id}`,
    () => $fetch<IResponse & { response: ShiftDetail }>(`/shifts/${route.params.id}`, {
        baseURL: baseUrl,
        headers: { authorization: token ?? '' },
    }),
    {
        transform: (data: IResponse & { response: ShiftDetail }) => data.response
    }
)

const items = computed<BreadcrumbItem[]>(() => [
    { label: 'Shift History', to: '/pos/shifts' },
    { label: shift.value ? `Shift #${shift.value.id}` : 'Shift', to: route.fullPath }
])
</script>