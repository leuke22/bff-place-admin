<template>
    <div class="space-y-5">
        <div>
            <p class="text-sm text-muted mb-2">Payment Method</p>
            <div class="grid grid-cols-2 gap-2">
                <UTooltip
                    v-for="option in methodOptions"
                    :key="option.value"
                    :text="option.available ? undefined : 'Coming soon — payment gateway integration in progress'"
                    :disabled="option.available"
                >
                    <UButton
                        :label="option.label"
                        :icon="option.icon"
                        color="neutral"
                        block
                        :variant="method === option.value ? 'solid' : 'outline'"
                        :disabled="!option.available"
                        @click="method = option.value"
                    />
                </UTooltip>
            </div>
            <p class="text-xs text-muted mt-2">
                GCash, Card and Bank Transfer will be available once online payment gateway integration is live. Only cash is supported right now.
            </p>
        </div>

        <div class="rounded-lg border border-default p-4">
            <div class="flex justify-between text-sm text-muted">
                <span>Order Total</span>
                <span class="text-base font-semibold text-default">{{ formatCurrency(order.total) }}</span>
            </div>
        </div>

        <UFormField label="Amount Tendered" required>
            <UInput v-model.number="amountTendered" type="number" step="0.01" :min="total" placeholder="0.00" size="xl" class="w-full">
                <template #leading><span class="text-muted">₱</span></template>
            </UInput>
        </UFormField>

        <div class="flex flex-row gap-2 flex-wrap">
            <UButton
                v-for="preset in quickAmounts"
                :key="preset"
                :label="formatCurrency(preset)"
                size="sm"
                variant="outline"
                color="neutral"
                @click="amountTendered = preset"
            />
        </div>

        <div class="rounded-lg p-4 flex justify-between items-center" :class="changeIsValid ? 'bg-success/10' : 'bg-error/10'">
            <span class="font-medium">Change</span>
            <span class="text-xl font-semibold" :class="changeIsValid ? 'text-success' : 'text-error'">
                {{ changeIsValid ? formatCurrency(change) : '—' }}
            </span>
        </div>

        <div class="flex justify-end gap-2 pt-2">
            <UButton label="Cancel" color="neutral" variant="soft" :disabled="loading" @click="emit('cancel')"/>
            <UButton label="Complete Payment" size="lg" :loading="loading" :disabled="!changeIsValid" @click="onSubmit"/>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Order } from '~/types/models/order.types'
import type { PaymentMethod, PaymentResult } from '~/types/models/payment.types'
import type { IResponse } from '~/types/response'

const props = defineProps<{
    order: Order
}>()

const emit = defineEmits<{
    success: [order: Order]
    cancel: []
}>()

const { baseUrl, token } = useAPI()
const toast = useToast()
const loading = ref(false)

const total = computed(() => Number(props.order.total))

const methodOptions: { value: PaymentMethod; label: string; icon: string; available: boolean }[] = [
    { value: 'cash', label: 'Cash', icon: 'lucide:banknote', available: true },
    { value: 'gcash', label: 'GCash', icon: 'lucide:smartphone', available: false },
    { value: 'card', label: 'Card', icon: 'lucide:credit-card', available: false },
    { value: 'bank_transfer', label: 'Bank Transfer', icon: 'lucide:landmark', available: false },
]

const method = ref<PaymentMethod>('cash')
const amountTendered = ref<number>(total.value)

// Rounds up to the nearest ₱50 above the total, then offers a couple of common bill combos above that
const quickAmounts = computed(() => {
    const rounded = Math.ceil(total.value / 50) * 50
    const candidates = [total.value, rounded, rounded + 50, rounded + 100]
    return [...new Set(candidates)].filter((v) => v >= total.value).sort((a, b) => a - b).slice(0, 4)
})

const change = computed(() => (amountTendered.value || 0) - total.value)
const changeIsValid = computed(() => (amountTendered.value || 0) >= total.value)

async function onSubmit() {
    if (!changeIsValid.value) return

    loading.value = true
    try {
        const response = await $fetch<IResponse & { response: PaymentResult }>(`/orders/${props.order.uuid}/payment`, {
            baseURL: baseUrl,
            method: 'POST',
            headers: { authorization: token ?? '' },
            body: {
                method: method.value,
                amount_tendered: amountTendered.value,
            },
        })

        if (!response.success) {
            throw new Error(response.errorMessage || response.errorDescription || 'Failed to process payment')
        }

        toast.add({
            title: 'Payment completed',
            description: `Change: ${formatCurrency(response.response.payment.change)}`,
            color: 'success'
        })
        emit('success', response.response.order)
    } catch (error: any) {
        toast.add({
            title: 'Error processing payment',
            description: error?.data?.statusMessage || error?.data?.message || error?.message || 'Something went wrong',
            color: 'error'
        })
    } finally {
        loading.value = false
    }
}
</script>