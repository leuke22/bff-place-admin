<template>
    <UModal v-model:open="open" title="Held Orders" description="Orders saved on this device to finish later">
        <template #body>
            <div v-if="held.length" class="divide-y divide-default rounded-lg border border-default">
                <div v-for="order in held" :key="order.id" class="flex flex-row items-center justify-between gap-3 px-4 py-3">
                    <div class="min-w-0">
                        <p class="font-medium">
                            {{ order.items.reduce((n, i) => n + i.quantity, 0) }} item(s) · {{ formatCurrency(order.subtotal) }}
                        </p>
                        <p class="text-xs text-muted truncate">
                            {{ order.items.map((i) => `${i.quantity}× ${i.name}`).join(', ') }}
                        </p>
                        <p class="text-xs text-muted">
                            {{ orderTypeLabel(order.order_type) }} · held {{ formatDate(order.held_at, 'time') }}
                        </p>
                    </div>
                    <div class="flex items-center gap-1 shrink-0">
                        <UButton label="Recall" size="sm" variant="outline" @click="onRecall(order)"/>
                        <UButton icon="lucide:trash-2" size="sm" variant="ghost" color="error" @click="onDiscard(order)"/>
                    </div>
                </div>
            </div>
            <div v-else class="rounded-lg border border-default p-8 text-center text-muted text-sm">
                No held orders.
            </div>
        </template>
    </UModal>
</template>

<script setup lang="ts">
import type { HeldOrder } from '~/composables/useHeldOrders'

const open = defineModel<boolean>('open', { default: false })

const { held, discard } = useHeldOrders()
const { items, orderType, appliedDiscount, amountTendered, count } = usePosCart()

function onRecall(order: HeldOrder) {
    if (count.value && !confirm('Replace the current order with this held order?')) return

    items.value = order.items.map((item) => ({ ...item }))
    orderType.value = order.order_type
    appliedDiscount.value = order.discount
    amountTendered.value = ''
    discard(order.id)
    open.value = false
}

function onDiscard(order: HeldOrder) {
    if (!confirm('Discard this held order?')) return
    discard(order.id)
}
</script>
