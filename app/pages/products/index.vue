<template>
    <div>
        <div>
            <PageHeader title="Products" :items/>
        </div>
        <div>

        </div>
        <div>

        </div>
    </div>
</template>

<script setup lang="ts">

const items = ref<BreadcrumbItem[]>([
    {
        label: 'Products',
        to: '/products'
    },
])
</script>