<template>
    <div class="flex flex-row justify-between items-center">
        <div>
            <UInput icon="i-lucide-search" variant="outline" :placeholder />
        </div>
        <div class="flex flex-row gap-2">
            <slot name="filter"/>
        </div>
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{
    placeholder: string
}>()

const search = defineModel<string>('search', { required: true })
</script>