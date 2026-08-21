<template>
    <div class="flex flex-row justify-between">
        <div class="flex flex-col">
            <h1 class="text-xl capitalize">{{ title }}</h1>
            <UBreadcrumb :items="defaultItems" />
        </div>
        <div>
            <URadioGroup color="primary" variant="table" default-value="pro" :items="items" />
        </div>
    </div>
</template> 

<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui'
import type { RadioGroupItem } from '@nuxt/ui'

const route = useRoute();

const props = defineProps<{
    title: string
    items: BreadcrumbItem[]
}>()

const defaultItems = ref<BreadcrumbItem[]>([
    {
        label: 'Dashboard',
        to: '/docs'
    },
    ...props.items
])

const items = ref<RadioGroupItem[]>([
    {
        label: 'Pro',
        value: 'pro',
        description: 'Tailored for indie hackers, freelancers and solo founders.'
    },
    {
        label: 'Startup',
        value: 'startup',
        description: 'Best suited for small teams, startups and agencies.'
    },
    {
        label: 'Enterprise',
        value: 'enterprise',
        description: 'Ideal for larger teams and organizations.'
    }
])
</script>