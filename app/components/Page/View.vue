<template>
    <div>
        <div v-if="view === 'grid'" class="flex flex-col gap-2">
            <slot name="grid-filter"/>
            <div class="grid grid-cols-3 gap-4">
                <slot name="grid-item"/>
            </div>
        </div>
        <div v-else-if="view === 'table'">
            <slot name="table"/>
        </div>
    </div>
</template>

<script setup lang="ts" generic="T">
import type { ValueType } from '~/types/component';

defineProps<{
    view: ValueType
}>()
</script>