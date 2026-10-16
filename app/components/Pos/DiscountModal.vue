<template>
    <UModal v-model:open="open" title="Apply Discount" description="Choose a discount for the current order">
        <template #body>
            <div class="space-y-4">
                <div v-if="status === 'pending'" class="text-center text-muted py-6">Loading discounts...</div>

                <div v-else-if="discounts.length" class="space-y-2">
                    <button
                        v-for="discount in discounts"
                        :key="discount.uuid"
                        type="button"
                        class="w-full flex flex-row items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left transition"
                        :class="selected?.uuid === discount.uuid ? 'border-primary bg-primary/5' : 'border-default hover:border-primary'"
                        @click="selected = discount"
                    >
                        <span class="font-medium">{{ discount.name }}</span>
                        <span class="text-sm text-muted">{{ discountLabel(discount) }} off</span>
                    </button>
                </div>
                <div v-else class="rounded-lg border border-default p-6 text-center text-muted text-sm">
                    No active discounts. Add one in Settings → Discounts.
                </div>

                <div v-if="selected" class="rounded-lg bg-muted p-3 text-sm space-y-1">
                    <div class="flex justify-between">
                        <span class="text-muted">Subtotal</span>
                        <span>{{ formatCurrency(subtotal) }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-muted">Discount</span>
                        <span>−{{ formatCurrency(previewAmount) }}</span>
                    </div>
                    <div class="flex justify-between font-semibold">
                        <span>Total</span>
                        <span>{{ formatCurrency(subtotal - previewAmount) }}</span>
                    </div>
                </div>

                <div class="flex flex-row justify-between gap-2 pt-2">
                    <UButton
                        v-if="appliedDiscount"
                        label="Remove discount"
                        color="error"
                        variant="soft"
                        @click="onRemove"
                    />
                    <span v-else/>
                    <div class="flex gap-2">
                        <UButton label="Cancel" color="neutral" variant="soft" @click="open = false"/>
                        <UButton label="Apply" :disabled="!selected" @click="onApply"/>
                    </div>
                </div>
            </div>
        </template>
    </UModal>
</template>

<script setup lang="ts">
import type { Discount } from '~/types/models/discount.types'
import type { IListResponse } from '~/types/response'

const open = defineModel<boolean>('open', { default: false })

const { baseUrl, token } = useAPI()
const toast = useToast()
const { appliedDiscount, subtotal } = usePosCart()

const discounts = ref<Discount[]>([])
const status = ref<'idle' | 'pending' | 'error'>('idle')
const selected = ref<Discount | null>(null)

const previewAmount = computed(() => {
    if (!selected.value) return 0
    const value = Number(selected.value.value)
    const raw = selected.value.type === 'percent' ? subtotal.value * value / 100 : value
    return Math.min(Math.round(raw * 100) / 100, subtotal.value)
})

async function load() {
    status.value = 'pending'
    try {
        const response = await $fetch<IListResponse<Discount>>('/discounts', {
            baseURL: baseUrl,
            headers: { authorization: token.value ?? '' },
            query: { active: 'true' },
        })
        discounts.value = response.response.rows
        status.value = 'idle'
    } catch (error: any) {
        status.value = 'error'
        toast.add({
            title: 'Error loading discounts',
            description: error?.data?.message || error?.message || 'Something went wrong',
            color: 'error'
        })
    }
}

// Refetch every time it opens so newly created or deactivated discounts show up right away.
watch(open, (isOpen) => {
    if (!isOpen) return
    selected.value = appliedDiscount.value
    load()
})

function onApply() {
    if (!selected.value) return
    appliedDiscount.value = selected.value
    toast.add({ title: `${selected.value.name} applied`, color: 'success' })
    open.value = false
}

function onRemove() {
    appliedDiscount.value = null
    open.value = false
}
</script>
