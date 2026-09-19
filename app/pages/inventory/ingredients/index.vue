<template>
    <div>
        <div class="mb-3">
            <PageHeader v-model:view="view" title="Ingredients" description="Manage your stock ingredients" :items/>
        </div>
        <div class="flex flex-row justify-end gap-3 mb-3">
            <UButton icon="lucide:refresh-ccw" variant="outline" color="neutral" :loading="status === 'pending'" @click="refresh()"/>
            <UButton icon="lucide:circle-plus" label="Add Ingredient" to="/inventory/ingredients/create"/>
        </div>
        <div>
            <PageView :view>
                <template #grid-filter>
                    <PageViewFilter v-model:search="filter.search" placeholder="Search ingredients">
                        <template #filter>
                            <USelectMenu v-model="filter.status" :items="statusOptions" value-key="value" label-key="label" placeholder="All Stock"/>
                        </template>
                    </PageViewFilter>
                </template>
                <template #grid-item>
                    <IngredientCard
                        v-for="ingredient in filteredIngredients"
                        :key="ingredient.uuid"
                        :ingredient
                        @view="onView"
                        @edit="onEdit"
                        @delete="onDelete"
                    />
                </template>
                <template #grid-footer>
                    <div class="flex flex-row justify-end">
                        <UPagination v-model:page="pagination.page" :sibling-count="2" :total="pagination.total"/>
                    </div>
                </template>
                <template #table>
                    <div class="w-full pb-4">
                        <div class="px-4 py-3.5 border-b border-accented">
                            <PageViewFilter v-model:search="filter.search" placeholder="Search ingredients">
                                <template #filter>
                                    <USelectMenu v-model="filter.status" :items="statusOptions" value-key="value" label-key="label" placeholder="All Stock"/>
                                </template>
                            </PageViewFilter>
                        </div>

                        <UTable ref="table" :data="filteredIngredients" :columns="ingredientColumn">
                            <template #ingredient-cell="{ row }">
                                <div>
                                    <h1 class="text-lg font-semibold">{{ row.original.name }}</h1>
                                    <p class="dark:text-gray-500 text-gray-400">{{ row.original.unit }}</p>
                                </div>
                            </template>
                            <template #current_stock-cell="{ row }">
                                <p>{{ Number(row.original.current_stock) }} {{ row.original.unit }}</p>
                            </template>
                            <template #reorder_level-cell="{ row }">
                                <p>{{ Number(row.original.reorder_level) }} {{ row.original.unit }}</p>
                            </template>
                            <template #status-cell="{ row }">
                                <UBadge
                                    :color="isLowStock(row.original) ? 'error' : 'success'"
                                    :label="isLowStock(row.original) ? 'Low Stock' : 'In Stock'"
                                    variant="subtle"
                                />
                            </template>
                            <template #action-cell="{ row }">
                                <div class="flex flex-row gap-2">
                                    <UTooltip text="View Ingredient">
                                        <UButton icon="lucide:eye" variant="outline" color="neutral" @click="onView(row.original)"/>
                                    </UTooltip>
                                    <UTooltip text="Edit Ingredient">
                                        <UButton icon="lucide:edit" variant="outline" color="tertiary" @click="onEdit(row.original)"/>
                                    </UTooltip>
                                    <UTooltip text="Delete Ingredient">
                                        <UButton icon="lucide:trash-2" variant="outline" color="error" @click="onDelete(row.original)"/>
                                    </UTooltip>
                                </div>
                            </template>
                        </UTable>

                        <div class="flex justify-end border-t border-default pt-4 px-4">
                            <UPagination v-model:page="pagination.page" :sibling-count="2" :total="pagination.total"/>
                        </div>
                    </div>
                </template>
            </PageView>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { BreadcrumbItem, TableColumn } from '@nuxt/ui';
import type { Pagination, ValueType } from '~/types/component';
import type { Ingredient } from '~/types/models/ingredient.types';
import type { IListResponse } from '~/types/response';

definePageMeta({
    layout: 'inventory'
})

const { baseUrl, token } = useAPI();
const toast = useToast();

const items = ref<BreadcrumbItem[]>([
    {
        label: 'Ingredients',
        to: '/ingredients'
    },
])

const view = ref<ValueType>('grid');

const pagination: Pagination = reactive({
    page: 1,
    limit: 8,
    total: 0
})

// Local filter shape — add an IngredientFilter type alongside ProductFilter in
// ~/types/component if you'd rather keep this typed there instead.
const filter = reactive({
    search: '',
    status: 'all' as 'all' | 'low' | 'ok'
})

const statusOptions = [
    { value: 'all', label: 'All Stock' },
    { value: 'low', label: 'Low Stock' },
    { value: 'ok', label: 'In Stock' },
]

const ingredientColumn: TableColumn<Ingredient>[] = [
    { accessorKey: 'ingredient', header: 'Ingredient' },
    { accessorKey: 'current_stock', header: 'Current Stock' },
    { accessorKey: 'reorder_level', header: 'Reorder Level' },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'action', header: 'Actions' }
]

function isLowStock(ingredient: Ingredient) {
    return Number(ingredient.current_stock) <= Number(ingredient.reorder_level)
}

const fetchIngredients = () => $fetch<IListResponse<Ingredient>>('/ingredients', {
    baseURL: baseUrl,
    headers: { authorization: token ?? '' },
    query: {
        low_stock: filter.status === 'low' ? 'true' : undefined,
    }
});

const { data: ingredients, refresh, status } = useAsyncData(
    'ingredients-list',
    () => fetchIngredients(),
    {
        watch: [() => filter.status],
        transform: (data: IListResponse<Ingredient>) => {
            pagination.total = data.response.count
            return data.response.rows
        },
        default: () => [] as Ingredient[]
    }
)

const filteredIngredients = computed(() => {
    let list = ingredients.value

    if (filter.status === 'ok') {
        list = list.filter((i) => !isLowStock(i))
    }

    if (filter.search) {
        const search = filter.search.toLowerCase()
        list = list.filter((i) => i.name.toLowerCase().includes(search))
    }

    return list
})

function onView(ingredient: Ingredient) {
    navigateTo(`/inventory/ingredients/${ingredient.id}`)
}

function onEdit(ingredient: Ingredient) {
    navigateTo({ path: `/inventory/ingredients/${ingredient.id}`, query: { isEdit: 'true' } })
}

async function onDelete(ingredient: Ingredient) {
    try {
        await $fetch(`/ingredients/${ingredient.id}`, {
            baseURL: baseUrl,
            method: 'DELETE',
            headers: { authorization: token ?? '' },
        })
        toast.add({ title: 'Ingredient deleted', color: 'success' })
        refresh()
    } catch (error: any) {
        toast.add({
            title: 'Error deleting ingredient',
            description: error?.data?.statusMessage || error?.data?.message || error?.message || 'Something went wrong',
            color: 'error'
        })
    }
}
</script>