<template>
    <div>
        <div class="no-print flex flex-row justify-between items-center gap-3 p-4">
            <UButton icon="lucide:arrow-left" label="Back to Order" variant="ghost" color="neutral" :to="`/pos/orders/${route.params.id}`"/>
            <UButton icon="lucide:printer" label="Print Receipts" @click="print"/>
        </div>

        <div v-if="order" class="print-area">
            <div class="copy-sheet">
                <OrderReceipt :order="order" copy-label="CUSTOMER COPY"/>
            </div>
            <div class="copy-sheet">
                <OrderReceipt :order="order" copy-label="MERCHANT COPY"/>
            </div>
        </div>

        <div v-else class="p-10 text-center text-muted">Order not found.</div>
    </div>
</template>

<script setup lang="ts">
import type { Order } from '~/types/models/order.types'
import type { IResponse } from '~/types/response'

definePageMeta({
    layout: 'pos',
    middleware: 'require-auth'
})

const route = useRoute()
const { baseUrl, token } = useAPI()

const { data: order } = await useAsyncData(
    `print-order-${route.params.id}`,
    () => $fetch<IResponse & { response: Order }>(`/orders/${route.params.id}`, {
        baseURL: baseUrl,
        headers: { authorization: token.value ?? '' }
    }),
    { transform: (data: IResponse & { response: Order }) => data.response }
)

function print() {
    window.print()
}

// Opened from the "Print" button with ?auto=1 → print immediately once rendered.
onMounted(() => {
    if (route.query.auto === '1' && order.value) {
        setTimeout(print, 300)
    }
})
</script>

<style>
@page {
    size: 80mm auto;
    margin: 0;
}

@media print {
    /* Hide the whole app chrome (sidebar, headers, shift bar) and show only receipts */
    body * { visibility: hidden; }
    .print-area, .print-area * { visibility: visible; }
    .print-area { position: absolute; left: 0; top: 0; }
    .no-print { display: none !important; }

    .copy-sheet { page-break-after: always; break-after: page; padding: 2mm 0; }
    .copy-sheet:last-child { page-break-after: auto; break-after: auto; }
}

@media screen {
    .print-area { display: flex; flex-direction: column; align-items: center; gap: 16px; padding-bottom: 32px; }
    .copy-sheet { background: #fff; padding: 12px; border: 1px solid #ddd; }
}
</style>