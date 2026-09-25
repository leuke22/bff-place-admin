<template>
    <div class="space-y-4">
        <div class="flex flex-row justify-between items-center">
            <div>
                <h2 class="text-lg font-semibold">Stock History</h2>
                <p class="text-sm dark:text-gray-500 text-gray-400">Movements recorded for this ingredient</p>
            </div>
            <UButton icon="lucide:refresh-ccw" variant="outline" color="neutral" size="sm" :loading="status === 'pending'" @click="refresh()"/>
        </div>

        <!-- Record movement — only in edit mode -->
        <UForm v-if="isEditMode" :schema="schema" :state="state" class="flex flex-row gap-2 items-start" @submit="onSubmit">
            <USelect v-model="state.type" :items="typeOptions" value-key="value" label-key="label" class="w-36"/>
            <UInput v-model="state.quantity" type="number" step="0.001" :placeholder="quantityPlaceholder" class="w-32"/>
            <UInput v-model="state.reason" placeholder="Reason (optional)" class="flex-1"/>
            <UButton type="submit" icon="lucide:circle-plus" label="Record" :loading="recording" :disabled="!state.quantity"/>
        </UForm>

        <!-- History list -->
        <div v-if="movements.length" class="divide-y divide-default rounded-lg border border-default">
            <div
                v-for="movement in movements"
                :key="movement.id"
                class="flex flex-row items-center justify-between gap-3 px-4 py-3"
            >
                <div class="flex items-center gap-3">
                    <UBadge :color="typeColor(movement.type)" :label="typeLabel(movement.type)" variant="subtle"/>
                    <div>
                        <p class="font-medium">
                            {{ movement.type === 'adjustment' ? 'Set to' : movement.type === 'in' ? '+' : '−' }}
                            {{ Number(movement.quantity) }} {{ movement.ingredient.unit }}
                        </p>
                        <p v-if="movement.reason" class="text-xs text-muted">{{ movement.reason }}</p>
                    </div>
                </div>
                <p class="text-xs text-muted whitespace-nowrap">{{ formatDate(movement.created_at, 'datetime') }}</p>
            </div>
        </div>

        <div v-else class="rounded-lg border border-default p-8 text-center text-muted">
            No stock movements recorded yet.
        </div>
    </div>
</template>

<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { StockMovement, StockMovementResult, StockMovementType } from '~/types/models/stock_movement.types'
import type { IListResponse, IResponse } from '~/types/response'

// mode mirrors IngredientForm: 'view' is read-only history, 'edit' is the only
// mode where a new movement can be recorded.
const props = withDefaults(defineProps<{
    ingredientId: number
    mode?: 'view' | 'edit'
    unit?: string
}>(), {
    mode: 'view'
})

const emit = defineEmits<{
    recorded: [ingredient: StockMovementResult['ingredient']]
}>()

const isEditMode = computed(() => props.mode === 'edit')

const { baseUrl, token } = useAPI()
const toast = useToast()

const fetchMovements = () => $fetch<IListResponse<StockMovement>>('/stock-movements', {
    baseURL: baseUrl,
    headers: { authorization: token ?? '' },
    query: { ingredient_id: props.ingredientId },
})

const { data: movements, refresh, status } = useAsyncData(
    `ingredient-stock-history-${props.ingredientId}`,
    () => fetchMovements(),
    {
        transform: (data: IListResponse<StockMovement>) => data.response.rows,
        default: () => [] as StockMovement[]
    }
)

const typeOptions = [
    { value: 'in', label: 'Stock In' },
    { value: 'out', label: 'Stock Out' },
    { value: 'adjustment', label: 'Adjustment' },
]

const quantityPlaceholder = computed(() =>
    state.type === 'adjustment' ? 'New total' : 'Quantity'
)

function typeLabel(type: StockMovementType) {
    return type === 'in' ? 'In' : type === 'out' ? 'Out' : 'Adjustment'
}

function typeColor(type: StockMovementType) {
    return type === 'in' ? 'success' as const : type === 'out' ? 'error' as const : 'neutral' as const
}

const schema = z.object({
    type: z.enum(['in', 'out', 'adjustment']),
    quantity: z.coerce.number({ error: 'Quantity is required' }).positive('Must be greater than 0'),
    reason: z.string().max(255).optional(),
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
    type: 'in',
    quantity: undefined,
    reason: '',
})

const recording = ref(false)

async function onSubmit(event: FormSubmitEvent<Schema>) {
    recording.value = true
    try {
        const response = await $fetch<IResponse & { response: StockMovementResult }>('/stock-movements', {
            baseURL: baseUrl,
            method: 'POST',
            headers: { authorization: token ?? '' },
            body: {
                ingredient_id: props.ingredientId,
                type: event.data.type,
                quantity: event.data.quantity,
                reason: event.data.reason || undefined,
            },
        })

        if (!response.success) {
            throw new Error(response.errorMessage || response.errorDescription || 'Failed to record movement')
        }

        toast.add({ title: 'Stock movement recorded', color: 'success' })
        state.quantity = undefined
        state.reason = ''
        emit('recorded', response.response.ingredient)
        await refresh()
    } catch (error: any) {
        toast.add({
            title: 'Error recording movement',
            description: error?.data?.statusMessage || error?.data?.message || error?.message || 'Something went wrong',
            color: 'error'
        })
    } finally {
        recording.value = false
    }
}
</script>