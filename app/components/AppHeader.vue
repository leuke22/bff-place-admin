<!-- app/components/AppHeader.vue -->
<template>
  <UHeader :toggle="false">
    <template #left>
      <UButton
        icon="i-lucide-panel-left"
        color="neutral"
        variant="ghost"
        aria-label="Toggle sidebar"
        @click="open = !open"
      />
      <NuxtLink to="/" class="flex items-center gap-2 font-bold text-lg">
        <UIcon name="i-lucide-shield-check" class="size-6 text-primary" />
        <span>Admin</span>
      </NuxtLink>
    </template>

    <template #right>
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

      <UButton
        v-else
        to="/login"
        label="Sign in"
        icon="i-lucide-log-in"
        color="primary"
      />
    </template>
  </UHeader>
</template>

<script setup lang="ts">
const { data, status, signOut } = useAuth()
const open = useSidebar()

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