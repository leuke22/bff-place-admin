<template>
    <!-- VIEW MODE: plain read-only display, no form controls at all -->
    <div v-if="isViewMode" class="space-y-6">
        <div class="relative rounded-lg overflow-hidden border border-default">
            <NuxtImg :src="category?.image ?? '/images/inasal.webp'" class="w-full h-56 object-cover"/>
            <UBadge
                class="absolute top-3 right-3"
                :label="category?.is_active ? 'Active' : 'Inactive'"
                :color="category?.is_active ? 'success' : 'error'"
            />
        </div>

        <div class="flex items-center gap-3">
            <div
                class="size-10 rounded-full flex items-center justify-center shrink-0"
                :style="{ backgroundColor: category?.color }"
            >
                <UIcon :name="category?.icon ?? 'lucide:shapes'" class="size-5 text-white"/>
            </div>
            <div>
                <p class="text-xs uppercase text-muted tracking-wide">Name</p>
                <p class="text-lg font-medium">{{ category?.name }}</p>
            </div>
        </div>

        <div>
            <p class="text-xs uppercase text-muted tracking-wide">Description</p>
            <p class="mt-1">{{ category?.description || '—' }}</p>
        </div>

        <div class="grid grid-cols-2 gap-6">
            <div>
                <p class="text-xs uppercase text-muted tracking-wide">Icon</p>
                <div class="flex items-center gap-1.5 mt-1">
                    <UIcon :name="category?.icon ?? 'lucide:shapes'" class="size-4"/>
                    <span>{{ category?.icon }}</span>
                </div>
            </div>
            <div>
                <p class="text-xs uppercase text-muted tracking-wide">Color</p>
                <div class="flex items-center gap-1.5 mt-1">
                    <span :style="{ backgroundColor: category?.color }" class="size-3 rounded-full"/>
                    <span>{{ category?.color }}</span>
                </div>
            </div>
        </div>
    </div>

    <!-- CREATE / EDIT MODE: the actual form -->
    <UForm v-else :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
        <UFormField label="Image" name="image">
            <div class="flex items-center gap-4">
                <div v-if="imagePreviewUrl" class="size-20 rounded-lg overflow-hidden border border-default shrink-0">
                    <NuxtImg :src="imagePreviewUrl" class="w-full h-full object-cover"/>
                </div>
                <UFileUpload
                    v-model="file"
                    label="Drop your image here"
                    description="SVG, PNG, JPG or GIF (max. 2MB)"
                    accept="image/svg+xml,image/png,image/jpeg,image/gif"
                    :max-size="2 * 1024 * 1024"
                    class="flex-1"
                />
            </div>
        </UFormField>

        <div class="grid grid-cols-2 gap-4">
            <UFormField label="Icon" name="icon" required>
                <UPopover v-model:open="iconPickerOpen">
                    <UButton color="neutral" variant="outline" class="w-full justify-start">
                        <UIcon :name="state.icon ?? 'lucide:shapes'" class="size-4" />
                        <span class="truncate">{{ state.icon ?? 'Select an icon' }}</span>
                    </UButton>

                    <template #content>
                        <div class="w-[min(34rem,calc(100vw-2rem))] space-y-3 p-3">
                            <UInput
                                v-model="iconSearch"
                                icon="lucide:search"
                                placeholder="Search all Iconify icons"
                                class="w-full"
                            />

                            <div v-if="iconSearchPending" class="flex h-28 items-center justify-center text-sm text-muted">
                                Searching icons...
                            </div>
                            <p v-else-if="iconSearchError" class="py-6 text-center text-sm text-error">
                                Icon search is unavailable. Try again in a moment.
                            </p>
                            <p v-else-if="!iconResults.length" class="py-6 text-center text-sm text-muted">
                                No icons found.
                            </p>
                            <div v-else class="max-h-72 overflow-y-auto">
                                <div class="grid grid-cols-5 gap-1 sm:grid-cols-7">
                                    <UTooltip v-for="icon in iconResults" :key="icon" :text="icon">
                                        <UButton
                                            :icon="icon"
                                            :aria-label="icon"
                                            :color="state.icon === icon ? 'primary' : 'neutral'"
                                            :variant="state.icon === icon ? 'solid' : 'ghost'"
                                            class="aspect-square w-full justify-center p-0"
                                            @click="selectIcon(icon)"
                                        />
                                    </UTooltip>
                                </div>
                            </div>

                            <div v-if="iconResults.length === 64 && !iconSearchPending" class="flex justify-center border-t border-default pt-2">
                                <UButton
                                    label="Load more matches"
                                    color="neutral"
                                    variant="link"
                                    size="sm"
                                    :loading="iconSearchPendingMore"
                                    @click="loadMoreIcons"
                                />
                            </div>
                        </div>
                    </template>
                </UPopover>
            </UFormField>

            <UFormField label="Color" name="color" required>
                <UPopover>
                    <UButton color="neutral" variant="outline" class="w-full justify-start">
                        <template #leading>
                            <span :style="{ backgroundColor: state.color }" class="size-3 rounded-full" />
                        </template>
                        {{ state.color }}
                    </UButton>

                    <template #content>
                        <UColorPicker v-model="state.color" class="p-3" />
                    </template>
                </UPopover>
            </UFormField>
        </div>

        <UFormField label="Name" name="name" required>
            <UInput v-model="state.name" placeholder="Category name" class="w-full" />
        </UFormField>

        <UFormField label="Description" name="description">
            <UTextarea
                v-model="state.description"
                placeholder="Category description"
                class="w-full"
            />
        </UFormField>

        <UFormField label="Active" name="is_active">
            <USwitch v-model="state.is_active" />
        </UFormField>

        <div class="flex justify-end gap-2 pt-2">
            <UButton label="Cancel" color="neutral" variant="soft" :disabled="uploading" @click="onCancel" />
            <UButton
                :label="isEditMode ? 'Update' : 'Create'"
                type="submit"
                :loading="uploading"
                :disabled="uploading"
            />
        </div>
    </UForm>
</template>

<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { Category, CategoryProductCount } from '~/types/models/category.types'
import type { IResponse } from '~/types/response'

// mode: 'create' (no category needed) | 'edit' (category required, real form) |
// 'view' (category required, plain read-only display — no form controls, no buttons).
// Whoever hosts this component decides how to get into edit mode (e.g. an Edit button
// on the page) — this component only ever emits `success` / `cancel`.
const props = withDefaults(defineProps<{
    mode?: 'create' | 'edit' | 'view'
    category?: Category | CategoryProductCount
}>(), {
    mode: 'create'
})

const emit = defineEmits<{
    success: [category: Category]
    cancel: []
}>()

const isEditMode = computed(() => props.mode === 'edit')
const isViewMode = computed(() => props.mode === 'view')

const { uploadFile, uploading, error: uploadError } = useUpload()
const { baseUrl, token } = useAPI()
const toast = useToast()
const file = ref<File | null>(null)

// Shows the newly-picked file if there is one, otherwise falls back to the category's
// existing image — so editing a category no longer looks like an empty dropzone.
const imagePreviewUrl = ref<string | null>(props.category?.image ?? null)

watch(file, (newFile, oldFile) => {
    // Clean up the previous object URL so we don't leak memory across picks
    if (oldFile && imagePreviewUrl.value?.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreviewUrl.value)
    }
    imagePreviewUrl.value = newFile ? URL.createObjectURL(newFile) : (props.category?.image ?? null)
})

const iconPickerOpen = ref(false)
const iconSearch = ref('food')
const iconResults = ref<string[]>([])
const iconSearchPending = ref(false)
const iconSearchPendingMore = ref(false)
const iconSearchError = ref(false)
let iconSearchTimer: ReturnType<typeof setTimeout> | undefined
let iconSearchRequest = 0

watch(iconSearch, () => {
    if (iconSearchTimer) clearTimeout(iconSearchTimer)
    iconSearchTimer = setTimeout(() => searchIcons(), 250)
}, { immediate: true })

async function searchIcons(limit = 64) {
    const query = iconSearch.value.trim()
    const requestId = ++iconSearchRequest
    if (!query) {
        iconResults.value = []
        iconSearchError.value = false
        return
    }

    iconSearchPending.value = limit === 64
    iconSearchPendingMore.value = limit > 64
    iconSearchError.value = false

    try {
        const response = await $fetch<{ icons: string[] }>('/api/iconify/search', {
            query: { query, limit },
        })
        if (requestId === iconSearchRequest) iconResults.value = response.icons
    } catch {
        if (requestId === iconSearchRequest) iconSearchError.value = true
    } finally {
        if (requestId === iconSearchRequest) {
            iconSearchPending.value = false
            iconSearchPendingMore.value = false
        }
    }
}

function loadMoreIcons() {
    searchIcons(999)
}

function selectIcon(icon: string) {
    state.icon = icon
    iconPickerOpen.value = false
}

const schema = z.object({
    name: z.string().min(1, 'Name is required').max(150, 'Max 150 characters'),
    description: z.string().optional(),
    icon: z.string({ error: 'Icon is required' }),
    color: z.string({ error: 'Color is required' }),
    is_active: z.boolean(),
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
    name: props.category?.name ?? '',
    description: props.category?.description ?? '',
    icon: props.category?.icon ?? 'lucide:shapes',
    color: props.category?.color ?? '#EF4444',
    is_active: props.category?.is_active ?? true,
})

// keep the form in sync when the category prop changes (e.g. moving between view/edit)
watch(() => props.category, (c) => {
    if (!c) return
    state.name = c.name
    state.description = c.description ?? ''
    state.icon = c.icon
    state.color = c.color
    state.is_active = c.is_active
    file.value = null
    imagePreviewUrl.value = c.image ?? null
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
    // Default to the existing image when editing and no new file was picked
    let imageUrl: string | undefined = props.category?.image ?? undefined

    // Only hit the upload service if the user actually picked a new file
    if (file.value) {
        const result = await uploadFile(file.value, 'categories')

        if (!result) {
            toast.add({
                title: 'Image upload failed',
                description: uploadError.value ?? 'Please try again.',
                color: 'error',
            })
            return // stop here — don't create/update the category without a successful upload
        }

        imageUrl = result.fileUrl
    }

    const body = {
        ...event.data,
        image: imageUrl,
    }

    try {
        const response = isEditMode.value && props.category
            ? await $fetch<IResponse & { response: Category }>(`/categories/${props.category.uuid}`, {
                baseURL: baseUrl,
                method: 'PUT',
                headers: { authorization: token.value ?? '' },
                body,
            })
            : await $fetch<IResponse & { response: Category }>('/categories', {
                baseURL: baseUrl,
                method: 'POST',
                headers: { authorization: token.value ?? '' },
                body,
            })

        if (!response.success) {
            throw new Error(
                response.errorMessage ||
                response.errorDescription ||
                `Failed to ${isEditMode.value ? 'update' : 'create'} category`
            )
        }

        toast.add({
            title: isEditMode.value ? 'Category updated' : 'Category created',
            color: 'success',
        })

        emit('success', response.response)
    } catch (error: any) {
        toast.add({
            title: `Error ${isEditMode.value ? 'updating' : 'creating'} category`,
            description: error?.data?.statusMessage || error?.data?.message || error?.message || 'Something went wrong',
            color: 'error'
        })
    }
}

function onCancel() {
    emit('cancel')
}
</script>
