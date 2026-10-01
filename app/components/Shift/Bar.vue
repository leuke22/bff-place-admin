<template>
    <div class="flex flex-row items-center justify-between gap-3 px-4 py-2 border-b border-default bg-elevated/30">
        <div class="flex items-center gap-2 text-sm">
            <UIcon :name="shift ? 'lucide:circle-dot' : 'lucide:circle-off'" :class="shift ? 'text-success' : 'text-muted'" class="size-4"/>
            <span v-if="shift">
                Shift open since {{ formatDate(shift.opened_at, 'time') }} · Opening float {{ formatCurrency(shift.opening_cash) }}
            </span>
            <span v-else class="text-muted">No shift open</span>
        </div>

        <UButton
            v-if="shift"
            label="Close Shift"
            icon="lucide:log-out"
            size="sm"
            color="error"
            variant="soft"
            @click="closeModalOpen = true"
        />
        <UButton
            v-else
            label="Open Shift"
            icon="lucide:log-in"
            size="sm"
            @click="openModalOpen = true"
        />

        <UModal v-model:open="openModalOpen" title="Open Shift" description="Enter your starting cash float">
            <template #body>
                <div class="space-y-4">
                    <UFormField label="Opening Cash" required>
                        <UInput v-model.number="openingCash" type="number" step="0.01" min="0" placeholder="0.00" size="lg" class="w-full">
                            <template #leading><span class="text-muted">₱</span></template>
                        </UInput>
                    </UFormField>
                    <div class="flex justify-end gap-2">
                        <UButton label="Cancel" color="neutral" variant="soft" @click="openModalOpen = false"/>
                        <UButton label="Open Shift" :loading="loading" @click="onOpen"/>
                    </div>
                </div>
            </template>
        </UModal>

        <UModal v-model:open="closeModalOpen" title="Close Shift" description="Count the drawer and enter the total">
            <template #body>
                <div class="space-y-4">
                    <div class="rounded-lg border border-default p-3 text-sm text-muted">
                        Opening float was {{ formatCurrency(shift?.opening_cash ?? 0) }}. Count all cash in the drawer now, including that float.
                    </div>
                    <UFormField label="Closing Cash Count" required>
                        <UInput v-model.number="closingCash" type="number" step="0.01" min="0" placeholder="0.00" size="lg" class="w-full">
                            <template #leading><span class="text-muted">₱</span></template>
                        </UInput>
                    </UFormField>
                    <div class="flex justify-end gap-2">
                        <UButton label="Cancel" color="neutral" variant="soft" @click="closeModalOpen = false"/>
                        <UButton label="Close Shift" color="error" :loading="loading" @click="onClose"/>
                    </div>
                </div>
            </template>
        </UModal>
    </div>
</template>

<script setup lang="ts">
const { shift, loading, checked, fetchCurrent, open, close } = useShift()

const openingCash = ref<number>(0)
const closingCash = ref<number>(0)
const openModalOpen = ref(false)
const closeModalOpen = ref(false)

onMounted(() => {
    if (!checked.value) fetchCurrent()
})

async function onOpen() {
    if (await open(openingCash.value)) {
        openModalOpen.value = false
        openingCash.value = 0
    }
}

async function onClose() {
    if (await close(closingCash.value)) {
        closeModalOpen.value = false
        closingCash.value = 0
    }
}
</script>