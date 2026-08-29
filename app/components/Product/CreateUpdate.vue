<template>
  <UModal v-model:open="open" :title="`${isEdit ? 'Update' : 'Create'} Product`">
    <UButton icon="lucide:circle-plus" label="Add Products" />

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
import { map, z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { Product } from '~/types/models/product.types';
import type { IListResponse, IResponse } from '~/types/response';
import type { Category } from '~/types/models/category.types';

const props = defineProps<{
    isEdit?: boolean
    product?: Product
}>()

const { uploadFile, uploading, error: uploadError } = useUpload();
const { baseUrl, token } = useAPI(); 
const toast = useToast();
const open = ref(false)
const file = ref<File | null>(null)

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

// keep the modal in sync when opening in edit mode with a new product
watch(() => props.product, (p) => {
    if (!p) return
    state.category_id = p.category_id
    state.name = p.name
    state.description = p.description ?? ''
    state.price = Number(p.price)
    state.is_active = p.is_active
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
        const response = props.isEdit && props.product
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
                `Failed to ${props.isEdit ? 'update' : 'create'} product`
            )
        }

        toast.add({
            title: props.isEdit ? 'Product updated' : 'Product created',
            color: 'success',
        })

        open.value = false
    } catch (error: any) {
        toast.add({
            title: `Error ${props.isEdit ? 'updating' : 'creating'} product`,
            description: error?.data?.statusMessage || error?.data?.message || error?.message || 'Something went wrong',
            color: 'error'
        })
    }
}
</script>