<template>
    <UBadge :color="color" :label="label" variant="subtle"/>
</template>

<script setup lang="ts">
import type { PurchaseOrderStatus } from '~/types/models/purchase_order.types'

const props = defineProps<{
    status: PurchaseOrderStatus
}>()

const map: Record<PurchaseOrderStatus, { label: string; color: 'neutral' | 'warning' | 'success' | 'error' }> = {
    pending: { label: 'Pending', color: 'neutral' },
    ordered: { label: 'Ordered', color: 'warning' },
    received: { label: 'Received', color: 'success' },
    cancelled: { label: 'Cancelled', color: 'error' },
}

const label = computed(() => map[props.status].label)
const color = computed(() => map[props.status].color)
</script>