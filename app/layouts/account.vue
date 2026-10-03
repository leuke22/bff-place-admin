<template>
    <div class="min-h-screen flex flex-col">
        <AppHeader />
        <UMain class="flex-1 overflow-y-auto">
            <div class="max-w-3xl mx-auto p-4">
                <slot />
            </div>
        </UMain>
    </div>
</template>

<script setup lang="ts">
</script>