<template>
    <div>
        Dashboard
    </div>
</template>

<script setup lang="ts">
definePageMeta({
    middleware: 'require-auth',
    layout: 'inventory'
})
</script>