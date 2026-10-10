<template>
    <UBadge :color="info.color" variant="subtle" :icon="info.icon" :label="info.label" size="lg"/>
</template>

<script setup lang="ts">
import type { Shift } from '~/types/models/shift.types'

const props = defineProps<{ shift: Pick<Shift, 'closed_at' | 'variance'> }>()

// variance = counted cash − expected cash, so a negative number means money is missing
const info = computed(() => {
    if (!props.shift.closed_at) return { label: 'Open', color: 'info' as const, icon: 'lucide:clock' }
    const variance = Number(props.shift.variance ?? 0)
    if (Math.abs(variance) < 0.01) return { label: 'Balanced', color: 'success' as const, icon: 'lucide:check-circle-2' }
    return variance < 0
        ? { label: `Short ${formatCurrency(Math.abs(variance))}`, color: 'error' as const, icon: 'lucide:trending-down' }
        : { label: `Over ${formatCurrency(variance)}`, color: 'warning' as const, icon: 'lucide:trending-up' }
})
</script>
