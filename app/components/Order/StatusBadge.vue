<template>
    <UBadge :color="color" :label="label" variant="subtle"/>
</template>

<script setup lang="ts">
import type { OrderStatus } from '~/types/models/order.types'

const props = defineProps<{
    status: OrderStatus
}>()
    
const map: Record<OrderStatus, { label: string; color: 'neutral' | 'warning' | 'info' | 'success' | 'error' }> = {
    pending: { label: 'Pending', color: 'neutral' },
    preparing: { label: 'Preparing', color: 'warning' },
    ready: { label: 'Ready', color: 'info' },
    completed: { label: 'Completed', color: 'success' },
    cancelled: { label: 'Cancelled', color: 'error' },
}

const label = computed(() => map[props.status].label)
const color = computed(() => map[props.status].color)
</script>