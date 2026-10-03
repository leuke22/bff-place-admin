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
                <div v-if="sidebarOpen" class="flex flex-row gap-2 items-center">
                    <div class="size-10 overflow-hidden rounded-full">
                        <NuxtImg src="/images/bff-logo.jpg" class="w-full h-full"/>
                    </div>
                    <div class="flex flex-col">
                        <h1 class="font-semibold text-sm">BFF <span class="text-primary-400">PLACE</span></h1>
                        <p class="font-medium text-xs">Inventory System</p>
                    </div>
                </div>
                <div v-else>
                    <div class="size-10 overflow-hidden rounded-full">
                        <NuxtImg src="/images/bff-logo.jpg" class="w-full h-full"/>
                    </div>
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
                        <div class="flex flex-col items-start truncate">
                            <span class="truncate">{{ data?.first_name }}</span>
                            <span class="text-xs text-muted capitalize">{{ data?.role }}</span>
                        </div>
                    </UButton>
                </UDropdownMenu>
            </template>
        </USidebar>

        <div class="flex-1 flex flex-col min-w-0">
            <AppHeader />
            <ShiftBar />
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

const open = useSidebar();
const colorMode = useColorMode();
const { data, signOut } = useAuth();
const sidebarOpen = useSidebar();

const items = computed<NavigationMenuItem[]>(() => {
    const base: NavigationMenuItem[] = [
        { label: 'New Order', icon: 'lucide:shopping-cart', to: '/pos', exact: true },
        { label: 'Orders', icon: 'lucide:receipt', to: '/pos/orders' },
    ]
    if (data.value?.role === 'admin' || data.value?.role === 'manager') {
        base.push({ label: 'Shift History', icon: 'lucide:history', to: '/pos/shifts' })
    }
    return base
})

const userItems = computed<DropdownMenuItem[][]>(() => {
    const accountItems: DropdownMenuItem[] = [
        { label: 'Profile', icon: 'i-lucide-user', to: '/profile' },
    ]
    if (data.value?.role === 'admin' || data.value?.role === 'manager') {
        accountItems.push({ label: 'Settings', icon: 'i-lucide-settings', to: '/settings' })
    }

    return [
        accountItems,
        [
            { 
                label: 'Navigate to',
                icon: 'lucide:navigation',
                children: [
                    {
                        label: 'Home',
                        icon: 'lucide:house',
                        tot: '/'
                    },
                    { 
                        label: 'Inventory', 
                        icon: 'lucide:package',
                        to: '/inventory' 
                    }
                ]
            }
        ],
        [
            {
            label: 'Appearance',
            icon: 'i-lucide-sun-moon',
            children: [
                {
                    label: 'Light',
                    icon: 'i-lucide-sun',
                    type: 'checkbox',
                    checked: colorMode.value === 'light',
                    onUpdateChecked(checked: boolean) {
                        if (checked) colorMode.preference = 'light'
                    },
                    onSelect(e: Event) {
                        e.preventDefault()
                    }
                },
                {
                    label: 'Dark',
                    icon: 'i-lucide-moon',
                    type: 'checkbox',
                    checked: colorMode.value === 'dark',
                    onUpdateChecked(checked: boolean) {
                        if (checked) colorMode.preference = 'dark'
                    },
                    onSelect(e: Event) {
                        e.preventDefault()
                    }
                }
            ]
            }
        ],
        [
            {
                label: 'Log out',
                icon: 'i-lucide-log-out',
                onSelect: () => signOut({ redirect: true, callbackUrl: '/login' })
            }
        ]
    ]
})
</script>