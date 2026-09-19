<template>
    <div class="flex flex-row gap-3 items-center">
        <div class="size-14 flex flex-row items-center justify-center overflow-hidden rounded-lg dark:bg-secondary-900/10 bg-secondary-200">
            <UIcon :name="icon" class="size-10 dark:text-secondary-400 text-secondary-700" />
        </div>
        <div class="flex flex-col">
            <h1>{{ title }}</h1>
            <p class="text-xs">{{ description }}</p>
        </div>
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{
    title: string
    description: string
    icon: string
}>()
</script>