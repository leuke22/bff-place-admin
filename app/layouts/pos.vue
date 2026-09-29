<template>
    <div class="flex h-screen">
        <USidebar
            v-model:open="open"
            collapsible="icon"
            rail
            :ui="{
                container: 'h-full',
                inner: 'bg-elevated/25 divide-transparent',
                body: 'py-0'
            }"
        >
            <template #header>
                <div class="flex items-center gap-2 px-1.5 py-1 overflow-hidden">
                    <UIcon name="lucide:shopping-cart" class="size-5 text-primary shrink-0"/>
                    <span class="font-semibold truncate">Point of Sale</span>
                </div>
            </template>

            <template #default="{ state }">
                <UNavigationMenu
                    :key="state"
                    :items="items"
                    orientation="vertical"
                    :ui="{ link: 'p-1.5 overflow-hidden' }"
                />
            </template>

            <template #footer>
                <UDropdownMenu
                    :items="userItems"
                    :content="{ align: 'center', collisionPadding: 12 }"
                    :ui="{ content: 'w-(--reka-dropdown-menu-trigger-width) min-w-48' }"
                >
                    <UButton
                        trailing-icon="i-lucide-chevrons-up-down"
                        color="neutral"
                        variant="ghost"
                        square
                        class="w-full data-[state=open]:bg-elevated overflow-hidden"
                        :ui="{ trailingIcon: 'text-dimmed ms-auto' }"
                    >
                        <UAvatar :alt="data?.first_name" size="xs" />
                        <span class="truncate">{{ data?.first_name }}</span>
                    </UButton>
                </UDropdownMenu>
            </template>
        </USidebar>

        <div class="flex-1 flex flex-col min-w-0">
            <AppHeader />
            <UMain class="flex-1 overflow-y-auto">
                <div class="p-4">
                    <slot />
                </div>
            </UMain>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { DropdownMenuItem, NavigationMenuItem } from '@nuxt/ui'

const open = useSidebar()
const { data, signOut } = useAuth()

const items: NavigationMenuItem[] = [
    { label: 'New Order', icon: 'lucide:shopping-cart', to: '/pos', exact: true },
    { label: 'Orders', icon: 'lucide:receipt', to: '/pos/orders' },
    { label: 'Inventory', icon: 'lucide:package', to: '/inventory' }
]

const userItems = computed<DropdownMenuItem[][]>(() => [
    [
        { label: 'Profile', icon: 'i-lucide-user' },
        { label: 'Settings', icon: 'i-lucide-settings', to: '/settings' }
    ],
    [
        {
            label: 'Log out',
            icon: 'i-lucide-log-out',
            onSelect: () => signOut({ redirect: true, callbackUrl: '/login' })
        }
    ]
])
</script>