<template>
    <!-- VIEW MODE: plain read-only display, no form controls at all -->
    <div v-if="isViewMode" class="space-y-6">
        <div class="relative rounded-lg overflow-hidden border border-default">
            <NuxtImg :src="product?.image ?? '/images/inasal.webp'" class="w-full h-56 object-cover"/>
            <UBadge
                class="absolute top-3 right-3"
                :label="product?.is_active ? 'Active' : 'Inactive'"
                :color="product?.is_active ? 'success' : 'error'"
            />
        </div>

        <div>
            <p class="text-xs uppercase text-muted tracking-wide">Name</p>
            <p class="text-lg font-medium mt-1">{{ product?.name }}</p>
        </div>

        <div>
            <p class="text-xs uppercase text-muted tracking-wide">Description</p>
            <p class="mt-1">{{ product?.description || '—' }}</p>
        </div>

        <div class="grid grid-cols-2 gap-6">
            <div>
                <p class="text-xs uppercase text-muted tracking-wide">Price</p>
                <p class="mt-1">${{ Number(product?.price ?? 0).toFixed(2) }}</p>
            </div>
            <div>
                <p class="text-xs uppercase text-muted tracking-wide">Category</p>
                <UBadge class="mt-1" :label="categoryLabel" variant="subtle"/>
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

        <UFormField label="Category" name="category_id" required>
            <USelect
                v-model="state.category_id"
                :items="categoryItems"
                placeholder="Select a category"
                class="w-full"
            />
        </UFormField>

        <UFormField label="Name" name="name" required>
            <UInput v-model="state.name" placeholder="Product name" class="w-full" />
        </UFormField>

        <UFormField label="Description" name="description">
            <UTextarea
                v-model="state.description"
                placeholder="Product description"
                class="w-full"
            />
        </UFormField>

        <UFormField label="Price" name="price" required>
            <UInput v-model="state.price" type="number" step="0.01" placeholder="0.00" class="w-full">
                <template #leading>
                    <span class="text-muted">$</span>
                </template>
            </UInput>
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
import type { Product } from '~/types/models/product.types';
import type { IListResponse, IResponse } from '~/types/response';
import type { Category } from '~/types/models/category.types';

// mode: 'create' (no product needed) | 'edit' (product required, real form) |
// 'view' (product required, plain read-only display — no form controls, no buttons).
// Whoever hosts this component decides how to get into edit mode (e.g. an Edit button
// on the page) — this component only ever emits `success` / `cancel`.
const props = withDefaults(defineProps<{
    mode?: 'create' | 'edit' | 'view'
    product?: Product
}>(), {
    mode: 'create'
})

const emit = defineEmits<{
    success: [product: Product]
    cancel: []
}>()

const isEditMode = computed(() => props.mode === 'edit')
const isViewMode = computed(() => props.mode === 'view')

const { uploadFile, uploading, error: uploadError } = useUpload();
const { baseUrl, token } = useAPI();
const toast = useToast();
const file = ref<File | null>(null)

// Shows the newly-picked file if there is one, otherwise falls back to the product's
// existing image — so editing a product no longer looks like an empty dropzone.
const imagePreviewUrl = ref<string | null>(props.product?.image ?? null)
console.log('imagePreviewUrl', imagePreviewUrl.value);

watch(file, (newFile, oldFile) => {
    // Clean up the previous object URL so we don't leak memory across picks
    if (oldFile && imagePreviewUrl.value?.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreviewUrl.value)
    }
    imagePreviewUrl.value = newFile ? URL.createObjectURL(newFile) : (props.product?.image ?? null)
})

const { data: categoryItems } = await useLazyFetch('/categories', {
    key: 'categories-select', 
    baseURL: baseUrl,
    headers: { authorization: token ?? '' },
    transform: (data: IListResponse<Category>) => {
        return data.response.rows.map(category => ({
            value: category.id,
            label: category.name
        }))
    }
})

// Used only in view mode, to turn product.category_id back into a readable label
// using the same categories list the form's select already fetches.
const categoryLabel = computed(() => {
    return categoryItems.value?.find(c => c.value === props.product?.category_id)?.label ?? '—'
})

const schema = z.object({
    category_id: z.number({ error: 'Category is required' }),
    name: z.string().min(1, 'Name is required').max(150, 'Max 150 characters'),
    description: z.string().optional(),
    price: z.coerce.number({ error: 'Price is required' }).positive('Price must be greater than 0'),
    is_active: z.boolean(),
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
    category_id: props.product?.category_id,
    name: props.product?.name ?? '',
    description: props.product?.description ?? '',
    price: props.product?.price ? Number(props.product.price) : undefined,
    is_active: props.product?.is_active ?? true,
})

// keep the form in sync when the product prop changes (e.g. moving between view/edit)
watch(() => props.product, (p) => {
    if (!p) return
    state.category_id = p.category_id
    state.name = p.name
    state.description = p.description ?? ''
    state.price = Number(p.price)
    state.is_active = p.is_active
    file.value = null
    imagePreviewUrl.value = p.image ?? null
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
    // Default to the existing image when editing and no new file was picked
    let imageUrl: string | undefined = props.product?.image ?? undefined

    // Only hit the upload service if the user actually picked a new file
    if (file.value) {
        const result = await uploadFile(file.value, 'products')

        if (!result) {
            toast.add({
                title: 'Image upload failed',
                description: uploadError.value ?? 'Please try again.',
                color: 'error',
            })
            return // stop here — don't create/update the product without a successful upload
        }

        imageUrl = result.fileUrl
    }

    const body = {
        ...event.data,
        image: imageUrl,
    }

    try {
        const response = isEditMode.value && props.product
            ? await $fetch<IResponse & { response: Product }>(`/products/${props.product.id}`, {
                baseURL: baseUrl,
                method: 'PUT',
                headers: { authorization: token ?? '' },
                body,
            })
            : await $fetch<IResponse & { response: Product }>('/products', {
                baseURL: baseUrl,
                method: 'POST',
                headers: { authorization: token ?? '' },
                body,
            })

        if (!response.success) {
            throw new Error(
                response.errorMessage ||
                response.errorDescription ||
                `Failed to ${isEditMode.value ? 'update' : 'create'} product`
            )
        }

        toast.add({
            title: isEditMode.value ? 'Product updated' : 'Product created',
            color: 'success',
        })

        emit('success', response.response)
    } catch (error: any) {
        toast.add({
            title: `Error ${isEditMode.value ? 'updating' : 'creating'} product`,
            description: error?.data?.statusMessage || error?.data?.message || error?.message || 'Something went wrong',
            color: 'error'
        })
    }
}

function onCancel() {
    emit('cancel')
}
</script>