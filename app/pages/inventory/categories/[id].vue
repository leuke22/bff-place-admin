<template>
    <div>
        <div class="mb-3">
            <PageHeader :title="category?.name ?? 'Category'" :description="mode === 'edit' ? 'Update category details' : 'Category details'" :items :has-view="false"/>
        </div>

        <div class="my-2 flex flex-row justify-between">
            <UButton v-if="mode === 'view'" icon="lucide:edit" label="Edit" @click="mode = 'edit'"/>
            <div v-else/>
            <UButton icon="lucide:arrow-left" label="Back to Categories" variant="ghost" color="neutral" to="/inventory/categories"/>
        </div>

        <div v-if="category" class="max-w-2xl">
            <CategoryForm :mode="mode" :category="category" @success="onSuccess" @cancel="onCancel"/>
        </div>

        <div v-else class="max-w-2xl">
            <div class="rounded-lg border border-default p-10 text-center text-muted">
                Category not found.
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui'
import type { Category } from '~/types/models/category.types'
import type { IResponse } from '~/types/response'

definePageMeta({
    layout: 'inventory'
})

const route = useRoute()
const { baseUrl, token } = useAPI()

// Plain ref, not computed off the route — computed() has no setter. ?isEdit=true still
// seeds the initial mode for deep links (e.g. the list page's Edit action), but after
// that it's just local state driven by the Edit button above.
const mode = ref<'view' | 'edit'>(route.query.isEdit === 'true' ? 'edit' : 'view')

const fetchCategory = () => $fetch<IResponse & { response: Category }>(`/categories/${route.params.id}`, {
    baseURL: baseUrl,
    headers: { authorization: token ?? '' }
})

const { data: category } = await useAsyncData(
    `category-${route.params.id}`,
    () => fetchCategory(),
    {
        transform: (data: IResponse & { response: Category }) => data.response
    }
)

const items = computed<BreadcrumbItem[]>(() => [
    { label: 'Categories', to: '/categories' },
    { label: category.value?.name ?? 'Category', to: route.fullPath }
])

function onSuccess(updated: Category) {
    category.value = updated
    mode.value = 'view'
}

function onCancel() {
    mode.value = 'view'
}
</script>