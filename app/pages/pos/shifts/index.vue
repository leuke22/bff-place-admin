<template>
    <div>
        <div class="mb-3">
            <PageHeader v-model:view="view" title="Shift History" description="Review past cashier shifts" :items/>
        </div>
        <div class="flex flex-row justify-end mb-3">
            <UButton icon="lucide:refresh-ccw" variant="outline" color="neutral" :loading="status === 'pending'" @click="refresh()"/>
        </div>

        <!-- Summary of everything matching the filters -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div class="rounded-lg border border-default p-4">
                <p class="text-xs uppercase tracking-wide text-muted">Shifts</p>
                <p class="text-2xl font-semibold mt-1">{{ stats.total_shifts }}</p>
                <p class="text-xs text-muted">{{ stats.open_shifts }} still open</p>
            </div>
            <div class="rounded-lg border border-default p-4">
                <p class="text-xs uppercase tracking-wide text-muted">Expected Cash</p>
                <p class="text-2xl font-semibold mt-1">{{ formatCurrency(stats.total_expected) }}</p>
                <p class="text-xs text-muted">What the drawers should hold</p>
            </div>
            <div class="rounded-lg border border-default p-4">
                <p class="text-xs uppercase tracking-wide text-muted">Total Difference</p>
                <p class="text-2xl font-semibold mt-1" :class="varianceClass(stats.total_variance)">{{ formatCurrency(stats.total_variance) }}</p>
                <p class="text-xs text-muted">{{ variancePercent }}% of expected cash</p>
            </div>
            <div class="rounded-lg border border-default p-4">
                <p class="text-xs uppercase tracking-wide text-muted">Need Attention</p>
                <p class="text-2xl font-semibold mt-1" :class="stats.variance_shifts ? 'text-error' : 'text-success'">{{ stats.variance_shifts }}</p>
                <p class="text-xs text-muted">Shifts that did not balance</p>
            </div>
        </div>

        <!-- Filters -->
        <div class="flex flex-row flex-wrap items-end gap-3 mb-4">
            <UInput v-model="filter.search" icon="i-lucide-search" placeholder="Search cashier or shift #" class="w-full sm:w-64"/>
            <UFormField label="From" size="sm">
                <UInput v-model="filter.date_from" type="date" :max="filter.date_to || undefined"/>
            </UFormField>
            <UFormField label="To" size="sm">
                <UInput v-model="filter.date_to" type="date" :min="filter.date_from || undefined"/>
            </UFormField>
            <UFormField label="Cashier" size="sm">
                <USelectMenu v-model="filter.cashier_id" :items="cashierOptions" value-key="value" label-key="label" class="w-48"/>
            </UFormField>
            <UFormField label="Status" size="sm">
                <USelectMenu v-model="filter.status" :items="statusOptions" value-key="value" label-key="label" class="w-44"/>
            </UFormField>
            <div class="flex flex-row gap-2">
                <UButton label="Today" variant="outline" color="neutral" size="sm" @click="setRange(0)"/>
                <UButton label="Last 7 days" variant="outline" color="neutral" size="sm" @click="setRange(6)"/>
                <UButton v-if="hasFilters" icon="lucide:x" label="Clear" variant="ghost" color="neutral" size="sm" @click="clearFilters"/>
            </div>
        </div>

        <div v-if="!shifts.length" class="rounded-lg border border-default p-10 text-center text-muted">
            {{ hasFilters ? 'No shifts match these filters.' : 'No shifts recorded yet.' }}
        </div>

        <PageView v-else :view>
            <template #grid-item>
                <NuxtLink
                    v-for="shift in shifts"
                    :key="shift.id"
                    :to="`/pos/shifts/${shift.id}`"
                    class="rounded-lg border border-default bg-default p-4 flex flex-col gap-3 hover:bg-elevated/50"
                >
                    <div class="flex flex-row justify-between items-start gap-2">
                        <div>
                            <p class="font-semibold">{{ cashierName(shift) }}</p>
                            <p class="text-xs text-muted">Shift #{{ shift.id }}</p>
                        </div>
                        <ShiftStatusBadge :shift/>
                    </div>
                    <div class="text-sm">
                        <p>{{ formatDate(shift.opened_at, 'date-short') }}</p>
                        <p class="text-muted">
                            {{ formatDate(shift.opened_at, 'time') }} → {{ shift.closed_at ? formatDate(shift.closed_at, 'time') : 'now' }}
                        </p>
                    </div>
                    <div class="grid grid-cols-3 gap-2 text-sm pt-3 border-t border-default">
                        <div>
                            <p class="text-xs text-muted">Started with</p>
                            <p class="font-medium">{{ formatCurrency(shift.opening_cash) }}</p>
                        </div>
                        <div>
                            <p class="text-xs text-muted">Should have</p>
                            <p class="font-medium">{{ shift.closed_at ? formatCurrency(shift.expected_cash ?? 0) : '—' }}</p>
                        </div>
                        <div>
                            <p class="text-xs text-muted">Counted</p>
                            <p class="font-medium">{{ shift.closed_at ? formatCurrency(shift.closing_cash ?? 0) : '—' }}</p>
                        </div>
                    </div>
                </NuxtLink>
            </template>
            <template #grid-footer>
                <div class="flex flex-row justify-end">
                    <UPagination v-model:page="pagination.page" :items-per-page="pagination.limit" :sibling-count="2" :total="pagination.total"/>
                </div>
            </template>
            <template #table>
                <div class="w-full pb-4 rounded-lg border border-default">
                    <UTable :data="shifts" :columns="columns" @select="(_e: Event, row: any) => onView(row.original)">
                        <template #cashier-cell="{ row }">
                            <p class="font-medium">{{ cashierName(row.original) }}</p>
                            <p class="text-xs text-muted">Shift #{{ row.original.id }}</p>
                        </template>
                        <template #date-cell="{ row }">
                            <p>{{ formatDate(row.original.opened_at, 'date-short') }}</p>
                            <p class="text-xs text-muted">
                                {{ formatDate(row.original.opened_at, 'time') }} → {{ row.original.closed_at ? formatDate(row.original.closed_at, 'time') : 'now' }}
                            </p>
                        </template>
                        <template #opening_cash-cell="{ row }">{{ formatCurrency(row.original.opening_cash) }}</template>
                        <template #expected_cash-cell="{ row }">{{ row.original.closed_at ? formatCurrency(row.original.expected_cash ?? 0) : '—' }}</template>
                        <template #closing_cash-cell="{ row }">{{ row.original.closed_at ? formatCurrency(row.original.closing_cash ?? 0) : '—' }}</template>
                        <template #status-cell="{ row }"><ShiftStatusBadge :shift="row.original"/></template>
                        <template #action-cell="{ row }">
                            <UTooltip text="View shift">
                                <UButton icon="lucide:eye" variant="outline" color="neutral" :to="`/pos/shifts/${row.original.id}`" @click.stop/>
                            </UTooltip>
                        </template>
                    </UTable>
                    <div class="flex justify-end border-t border-default pt-4 px-4">
                        <UPagination v-model:page="pagination.page" :items-per-page="pagination.limit" :sibling-count="2" :total="pagination.total"/>
                    </div>
                </div>
            </template>
        </PageView>
    </div>
</template>

<script setup lang="ts">
import type { BreadcrumbItem, TableColumn } from '@nuxt/ui'
import type { Pagination, ValueType } from '~/types/component'
import type { Shift, ShiftListStats, ShiftStatusFilter } from '~/types/models/shift.types'
import type { IListResponse } from '~/types/response'

definePageMeta({
    middleware: 'require-auth',
    layout: 'pos'
})

type ShiftListResponse = IListResponse<Shift> & { response: { stats: ShiftListStats } }

const { baseUrl, token } = useAPI()
const { data: authData } = useAuth()

const items = ref<BreadcrumbItem[]>([{ label: 'Shift History', to: '/pos/shifts' }])

// listShifts is admin/manager only on the backend — bounce anyone else back to the order screen
if (authData.value?.role === 'cashier') {
    await navigateTo('/pos')
}

const view = ref<ValueType>('grid')

const pagination: Pagination = reactive({ page: 1, limit: 12, total: 0 })

const filter = reactive({
    search: '',
    date_from: '',
    date_to: '',
    cashier_id: 0,
    status: 'all' as ShiftStatusFilter
})

const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'open', label: 'Open' },
    { value: 'balanced', label: 'Balanced' },
    { value: 'variance', label: 'Short / Over' },
]

const columns: TableColumn<Shift>[] = [
    { accessorKey: 'cashier', header: 'Cashier' },
    { accessorKey: 'date', header: 'Date & Time' },
    { accessorKey: 'opening_cash', header: 'Started With' },
    { accessorKey: 'expected_cash', header: 'Should Have' },
    { accessorKey: 'closing_cash', header: 'Counted' },
    { accessorKey: 'status', header: 'Result' },
    { accessorKey: 'action', header: '' }
]

// Cashier dropdown — /staff is admin/manager only, same as this page
const { data: cashierOptions } = await useAsyncData('shift-cashier-options', async () => {
    try {
        const res = await $fetch<IListResponse<{ id: number; first_name: string; last_name: string; role: string }>>('/staff', {
            baseURL: baseUrl,
            headers: { authorization: token.value ?? '' },
        })
        return [
            { value: 0, label: 'All Cashiers' },
            ...res.response.rows
                .filter(u => u.role === 'cashier')
                .map(u => ({ value: u.id, label: `${u.first_name} ${u.last_name}` }))
        ]
    } catch {
        return [{ value: 0, label: 'All Cashiers' }]
    }
}, { default: () => [{ value: 0, label: 'All Cashiers' }] })

const emptyStats: ShiftListStats = { total_shifts: 0, open_shifts: 0, total_expected: '0.00', total_variance: '0.00', variance_shifts: 0 }
const stats = ref<ShiftListStats>({ ...emptyStats })

const query = computed(() => ({
    page: pagination.page,
    limit: pagination.limit,
    status: filter.status,
    ...(filter.search.trim() && { search: filter.search.trim() }),
    ...(filter.date_from && { date_from: filter.date_from }),
    ...(filter.date_to && { date_to: filter.date_to }),
    ...(filter.cashier_id && { cashier_id: filter.cashier_id }),
}))

const { data: shifts, refresh, status } = useAsyncData(
    'shift-history',
    () => $fetch<ShiftListResponse>('/shifts', {
        baseURL: baseUrl,
        headers: { authorization: token.value ?? '' },
        query: query.value,
    }),
    {
        transform: (data: ShiftListResponse) => {
            pagination.total = data.response.count
            stats.value = data.response.stats ?? { ...emptyStats }
            return data.response.rows
        },
        default: () => [] as Shift[]
    }
)

// Any filter change goes back to page 1; typing in search waits a moment before fetching
let timer: ReturnType<typeof setTimeout> | undefined
watch(() => [filter.search, filter.date_from, filter.date_to, filter.cashier_id, filter.status], () => {
    clearTimeout(timer)
    timer = setTimeout(() => {
        if (pagination.page !== 1) pagination.page = 1 // the page watcher below refetches
        else refresh()
    }, 300)
})
watch(() => pagination.page, () => refresh())
onBeforeUnmount(() => clearTimeout(timer))

const hasFilters = computed(() => !!(filter.search || filter.date_from || filter.date_to || filter.cashier_id || filter.status !== 'all'))

function clearFilters() {
    filter.search = ''
    filter.date_from = ''
    filter.date_to = ''
    filter.cashier_id = 0
    filter.status = 'all'
}

// Local calendar date as YYYY-MM-DD (the browser is already on the business timezone)
function toInputDate(d: Date) {
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function setRange(daysBack: number) {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - daysBack)
    filter.date_from = toInputDate(start)
    filter.date_to = toInputDate(end)
}

const variancePercent = computed(() => {
    const expected = Number(stats.value.total_expected)
    return expected ? ((Number(stats.value.total_variance) / expected) * 100).toFixed(2) : '0.00'
})

function varianceClass(v: string | number) {
    const n = Number(v)
    if (Math.abs(n) < 0.01) return 'text-success'
    return n < 0 ? 'text-error' : 'text-warning'
}

function cashierName(shift: Shift) {
    return shift.cashier ? `${shift.cashier.first_name} ${shift.cashier.last_name}` : 'Unknown'
}

function onView(shift: Shift) {
    navigateTo(`/pos/shifts/${shift.id}`)
}
</script>
