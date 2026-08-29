<template>
    <div>
        <div v-if="view === 'grid'" class="flex flex-col gap-5">
            <slot name="grid-filter"/>
            <div class="grid xl:grid-cols-4 lg:grid-cols-3 sm:grid-cols-2 gap-4">
                <slot name="grid-item"/>
            </div>
            <slot name="grid-footer"/>
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