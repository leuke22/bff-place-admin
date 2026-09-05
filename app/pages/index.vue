<template>
  <div class="h-[calc(100dvh-80px)] w-full overflow-hidden">
    <div class="flex flex-row gap-10 py-10 px-20">
      <div class="flex-1 flex flex-col gap-5 justify-center items-start">
        <UBadge icon="lucide:star" label="Built for Restaurants" variant="soft"/>
        <h1 class="font-bold text-6xl"> Manage your restaurant smarter with <p class="text-primary-500">BFF Place</p> </h1>
        <p>An-in-one POS and Inventory system designed to help
          you serve faster. keep track Of stock. and your
          business effortlessly.</p>
        <div class="flex flex-row gap-5">
          <UButton size="xl">
            <div class="flex flex-row items-center gap-2">
              <UIcon name="lucide:shopping-cart"/>
              <p>Go to Point of Sales</p>
              <UIcon name="lucide:arrow-right"/>
            </div>
          </UButton>
          <UButton size="xl" variant="outline">
            <div class="flex flex-row items-center gap-2">
              <UIcon name="lucide:package"/>
              <p>Go to Inventory</p>
              <UIcon name="lucide:arrow-right"/>
            </div>
          </UButton>
        </div>
        <div class="grid grid-cols-3 gap-5">
          <FeaturesLogo v-for="feature in featureItems" :key="feature.title" :title="feature.title" :description="feature.description" :icon="feature.icon"/>
        </div>
      </div>
      <div class="flex-1">
        <!-- Image here -->
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FeaturesLogoTypes } from '~/types/component';

definePageMeta({
  layout: 'landing'
})

const featureItems: FeaturesLogoTypes[] = [
  { title: 'Fast & Easy', description: 'Streamlined operations', icon: 'lucide:zap' },
  { title: 'Real-Time Data', description: 'Make informed decisions', icon: 'lucide:chart-no-axes-combined' },
  { title: 'Secure & Reliable', description: 'Your data is always safe', icon: 'lucide:shield' }
]
</script>