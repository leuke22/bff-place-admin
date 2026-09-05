<template>
    <UHeader>
      <template #title>
          <div class="flex flex-row gap-2 items-center">
              <div class="size-12 overflow-hidden rounded-full">
              <NuxtImg src="/images/bff-logo.jpg" class="w-full h-full"/>
              </div>
              <div>
              <h1 class="font-semibold">BFF <span class="text-primary-400">PLACE</span></h1>
              <p class="font-medium text-sm">POS & Inventory System</p>
              </div>
          </div>
      </template>

      <UNavigationMenu :items="items" />

      <template #right>
        <UColorModeButton />

        <UButton label="Contact us" color="neutral" variant="outline"/>
        <div v-if="status === 'authenticated'" class="flex items-center gap-3">
          <UDropdownMenu :items="menuItems">
            <UButton
              color="neutral"
              variant="ghost"
              trailing-icon="i-lucide-chevron-down"
            >
              <UAvatar :alt="data?.first_name" size="xs" />
              <span class="hidden sm:inline">{{ data?.first_name }}</span>
            </UButton>
          </UDropdownMenu>
        </div>
        <div v-else>
          <UButton label="Login" @click="navigateTo('/login')"/>
        </div>
        
      </template>
    </UHeader>
    <slot/>
</template>

<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute();
const { status, data, signOut } = useAuth();

const items = computed<NavigationMenuItem[]>(() => [
  {
    label: 'Home',
    to: '/',
  },
  {
    label: 'Landing Page',
    to: '/',
    target: '_blank'
  },
  {
    label: 'Point of Sale', 
    to: '/pos',
    target: '_blank'
  },
  {
    label: 'Inventory',
    to: '/inventory',
    target: '_blank'
  }
])

const menuItems = computed(() => [
  [
    {
      label: data.value?.email,
      type: 'label' as const
    }
  ],
  [
    { label: 'Profile', icon: 'i-lucide-user', to: '/profile' },
    { label: 'Settings', icon: 'i-lucide-settings', to: '/settings' }
  ],
  [
    {
      label: 'Sign out',
      icon: 'i-lucide-log-out',
      color: 'error' as const,
      onSelect: () => handleLogout()
    }
  ]
])

async function handleLogout() {
  await signOut({ redirect: true, callbackUrl: '/login' })
}
</script>