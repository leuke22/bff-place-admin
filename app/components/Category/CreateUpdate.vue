<template>
  <UModal v-model:open="open" :title="`${isEdit ? 'Update' : 'Create'} Category`">
    <UButton :icon="isEdit ? 'lucide:edit' : 'lucide:circle-plus'" :label="isEdit ? 'Edit Category' : 'Add Category'" />

    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Image" name="image">
            <UFileUpload
                v-model="file"
                label="Drop your image here"
                description="SVG, PNG, JPG or GIF (max. 2MB)"
                accept="image/svg+xml,image/png,image/jpeg,image/gif"
                :max-size="2 * 1024 * 1024"
            />
        </UFormField>

        <div class="grid grid-cols-2 gap-4">
            <UFormField label="Icon" name="icon" required>
                <USelect
                    v-model="state.icon"
                    :items="iconOptions"
                    placeholder="Select an icon"
                    class="w-full"
                >
                    <template #leading>
                        <UIcon :name="state.icon ?? 'lucide:shapes'" />
                    </template>
                </USelect>
            </UFormField>

            <UFormField label="Color" name="color" required>
                <div class="flex flex-wrap items-center gap-2 h-full pt-1.5">
                    <button
                        v-for="swatch in colorOptions"
                        :key="swatch"
                        type="button"
                        class="size-7 rounded-full ring-2 ring-offset-2 ring-offset-default transition"
                        :class="state.color === swatch ? 'ring-default' : 'ring-transparent'"
                        :style="{ backgroundColor: swatch }"
                        @click="state.color = swatch"
                    />
                </div>
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
            <UButton label="Cancel" color="neutral" variant="soft" @click="open = false" />
            <UButton
                :label="isEdit ? 'Update' : 'Create'"
                type="submit"
                :loading="uploading"
                :disabled="uploading"
            />
        </div>
      </UForm>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { Category } from '~/types/models/category.types'
import type { IResponse } from '~/types/response'

const props = defineProps<{
    isEdit?: boolean
    category?: Category
}>()

const emit = defineEmits<{
    saved: [category: Category]
}>()

const { uploadFile, uploading, error: uploadError } = useUpload()
const { baseUrl, token } = useAPI()
const toast = useToast()
const open = ref(false)
const file = ref<File | null>(null)

// Keep the picker small and food-service relevant; extend freely.
const iconOptions = [
    { value: 'lucide:beef', label: 'Burgers' },
    { value: 'lucide:pizza', label: 'Pizza' },
    { value: 'lucide:utensils', label: 'Sides' },
    { value: 'lucide:cup-soda', label: 'Drinks' },
    { value: 'lucide:coffee', label: 'Coffee' },
    { value: 'lucide:cake-slice', label: 'Desserts' },
    { value: 'lucide:soup', label: 'Sauces' },
    { value: 'lucide:egg-fried', label: 'Breakfast' },
    { value: 'lucide:shapes', label: 'Other' },
]

const colorOptions = [
    '#EF4444', // red
    '#F97316', // orange
    '#F59E0B', // amber
    '#3B82F6', // blue
    '#78350F', // brown
    '#EC4899', // pink
    '#A855F7', // purple
    '#10B981', // teal
]

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
    color: props.category?.color ?? colorOptions[0],
    is_active: props.category?.is_active ?? true,
})

// keep the modal in sync when opening in edit mode with a new category
watch(() => props.category, (c) => {
    if (!c) return
    state.name = c.name
    state.description = c.description ?? ''
    state.icon = c.icon ?? 'lucide:shapes'
    state.color = c.color ?? colorOptions[0]
    state.is_active = c.is_active
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
        const response = props.isEdit && props.category
            ? await $fetch<IResponse & { response: Category }>(`/categories/${props.category.id}`, {
                baseURL: baseUrl,
                method: 'PUT',
                headers: { authorization: token ?? '' },
                body,
            })
            : await $fetch<IResponse & { response: Category }>('/categories', {
                baseURL: baseUrl,
                method: 'POST',
                headers: { authorization: token ?? '' },
                body,
            })

        if (!response.success) {
            throw new Error(
                response.errorMessage ||
                response.errorDescription ||
                `Failed to ${props.isEdit ? 'update' : 'create'} category`
            )
        }

        toast.add({
            title: props.isEdit ? 'Category updated' : 'Category created',
            color: 'success',
        })

        emit('saved', response.response)
        open.value = false
    } catch (error: any) {
        toast.add({
            title: `Error ${props.isEdit ? 'updating' : 'creating'} category`,
            description: error?.data?.statusMessage || error?.data?.message || error?.message || 'Something went wrong',
            color: 'error'
        })
    }
}
</script>