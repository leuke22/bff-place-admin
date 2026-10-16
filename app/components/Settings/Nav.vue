<template>
    <UNavigationMenu :items="links" highlight class="-mx-1"/>
</template>

<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()

const links = computed<NavigationMenuItem[]>(() => [
    { label: 'Staff', icon: 'lucide:users', to: '/settings', active: route.path === '/settings' },
    { label: 'Discounts', icon: 'lucide:percent', to: '/settings/discounts', active: route.path.startsWith('/settings/discounts') },
])
</script>
