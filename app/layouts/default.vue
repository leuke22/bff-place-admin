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
            <UDropdownMenu
                :items="teamsItems"
                :content="{ align: 'start', collisionPadding: 12 }"
                :ui="{ content: 'w-(--reka-dropdown-menu-trigger-width) min-w-48' }"
            >
            <UButton
                v-bind="selectedTeam"
                trailing-icon="i-lucide-chevrons-up-down"
                color="neutral"
                variant="ghost"
                square
                class="w-full data-[state=open]:bg-elevated overflow-hidden"
                :ui="{ trailingIcon: 'text-dimmed ms-auto' }"
            />
            </UDropdownMenu>
        </template>

        <template #default="{ state }">
            <UNavigationMenu
                :key="state"
                :items="getItems(state)"
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
const colorMode = useColorMode()
const { data, signOut } = useAuth()

const teams = ref([
  { label: 'Nuxt', avatar: { src: 'https://github.com/nuxt.png', alt: 'Nuxt' } },
  { label: 'Vue', avatar: { src: 'https://github.com/vuejs.png', alt: 'Vue' } },
  { label: 'UnJS', avatar: { src: 'https://github.com/unjs.png', alt: 'UnJS' } }
])
const selectedTeam = ref(teams.value[0])

const teamsItems = computed<DropdownMenuItem[][]>(() => [
    teams.value.map((team, index) => ({
        ...team,
        kbds: ['meta', String(index + 1)],
        onSelect() {
        selectedTeam.value = team
        }
    })),
    [{ label: 'Create team', icon: 'i-lucide-circle-plus' }]
])

function getItems(state: 'collapsed' | 'expanded') {
    return [
        { label: 'Dashboard', icon: 'lucide:layout-dashboard', to: '/' },
        { label: 'Products', icon: 'lucide:box', to: '/products' },
        { label: 'Activity', icon: 'i-lucide-square-activity' },
        {
            label: 'Settings',
            icon: 'i-lucide-settings',
            defaultOpen: true,
            children: state === 'expanded'
                ? [
                    { label: 'General', icon: 'i-lucide-house' },
                    { label: 'Team', icon: 'i-lucide-users' },
                    { label: 'Billing', icon: 'i-lucide-credit-card' }
                ]
                : []
        }
    ] satisfies NavigationMenuItem[]
}

const userItems = computed<DropdownMenuItem[][]>(() => [
    [
        { label: 'Profile', icon: 'i-lucide-user' },
        { label: 'Billing', icon: 'i-lucide-credit-card' },
        { label: 'Settings', icon: 'i-lucide-settings', to: '/settings' }
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
        { label: 'GitHub', icon: 'i-simple-icons-github', to: 'https://github.com/nuxt/ui', target: '_blank' },
        {
            label: 'Log out',
            icon: 'i-lucide-log-out',
            onSelect: () => signOut({ redirect: true, callbackUrl: '/login' })
        }
    ]
])

defineShortcuts(extractShortcuts(teamsItems.value))
</script>