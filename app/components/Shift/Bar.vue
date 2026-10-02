<template>
    <div class="flex flex-row items-center justify-between gap-3 px-4 py-2 border-b border-default bg-elevated/30">
        <div class="flex items-center gap-3 text-sm flex-wrap">
            <div class="flex items-center gap-2">
                <UIcon :name="shift ? 'lucide:circle-dot' : 'lucide:circle-off'" :class="shift ? 'text-success' : 'text-muted'" class="size-4"/>
                <span v-if="shift">Shift open since {{ formatDate(shift.opened_at, 'time') }}</span>
                <span v-else class="text-muted">No shift open</span>
            </div>
            <template v-if="shift">
                <span class="text-muted">·</span>
                <span class="text-muted">{{ shift.summary.order_count }} order(s)</span>
                <span class="text-muted">·</span>
                <span class="text-muted">Sales {{ formatCurrency(shift.summary.total_sales) }}</span>
            </template>
        </div>

        <UButton
            v-if="shift"
            label="Close Shift"
            icon="lucide:log-out"
            size="sm"
            color="error"
            variant="soft"
            @click="onOpenCloseModal"
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

        <UModal v-model:open="closeModalOpen" title="Close Shift" description="Count the drawer and confirm the total">
            <template #body>
                <div v-if="shift" class="space-y-4">
                    <div class="rounded-lg border border-default p-3 space-y-1 text-sm">
                        <div class="flex justify-between text-muted">
                            <span>Opening Float</span>
                            <span>{{ formatCurrency(shift.opening_cash) }}</span>
                        </div>
                        <div class="flex justify-between text-muted">
                            <span>Cash Sales This Shift</span>
                            <span>{{ formatCurrency(shift.summary.cash_collected) }}</span>
                        </div>
                        <div class="flex justify-between font-medium pt-1 border-t border-default">
                            <span>System Expected Cash</span>
                            <span>{{ formatCurrency(expectedCash) }}</span>
                        </div>
                    </div>

                    <UFormField
                        label="Counted Cash"
                        required
                        description="Count all cash physically in the drawer, then confirm or correct the amount below."
                    >
                        <UInput v-model.number="closingCash" type="number" step="0.01" min="0" placeholder="0.00" size="lg" class="w-full">
                            <template #leading><span class="text-muted">₱</span></template>
                        </UInput>
                    </UFormField>
                    <UButton label="Use System Amount" size="xs" variant="outline" color="neutral" @click="closingCash = expectedCash"/>

                    <div class="rounded-lg p-3 flex justify-between items-center" :class="varianceIsZero ? 'bg-success/10' : 'bg-warning/10'">
                        <span class="text-sm font-medium">Variance Preview</span>
                        <span class="font-semibold" :class="varianceIsZero ? 'text-success' : 'text-warning'">
                            {{ formatCurrency((closingCash || 0) - expectedCash) }}
                        </span>
                    </div>

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

const expectedCash = computed(() => {
    if (!shift.value) return 0
    return Number(shift.value.opening_cash) + Number(shift.value.summary.cash_collected)
})

const varianceIsZero = computed(() => Math.abs((closingCash.value || 0) - expectedCash.value) < 0.01)

function onOpenCloseModal() {
    // Pre-filled with what the system expects — the cashier still has to count the
    // drawer and can correct this number before confirming. That correction is the point.
    closingCash.value = expectedCash.value
    closeModalOpen.value = true
}

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