<template>
    <div class="receipt">
        <div class="center">
            <p class="shop">BFF PLACE</p>
            <p class="small">POS &amp; Inventory System</p>
            <p class="copy">*** {{ copyLabel }} ***</p>
        </div>

        <div class="rule"/>

        <div class="row"><span>Order #</span><span>{{ order.order_number }}</span></div>
        <div class="row"><span>Type</span><span>{{ order.order_type === 'dine_in' ? 'Dine-in' : 'Takeout' }}</span></div>
        <div class="row"><span>Date</span><span>{{ formatDate(order.created_at, 'datetime') }}</span></div>
        <div v-if="order.cashier" class="row">
            <span>Cashier</span><span>{{ order.cashier.first_name }}</span>
        </div>

        <div class="rule"/>

        <div v-for="item in order.items" :key="item.id" class="item">
            <div class="row">
                <span class="name">{{ item.quantity }} x {{ item.product?.name ?? 'Item' }}<template v-if="item.variant"> ({{ item.variant.name }})</template></span>
                <span>{{ formatCurrency(item.subtotal) }}</span>
            </div>
            <p class="small indent">@ {{ formatCurrency(item.unit_price) }}</p>
            <p v-if="item.notes" class="small indent">Note: {{ item.notes }}</p>
        </div>

        <div class="rule"/>

        <div class="row"><span>Subtotal</span><span>{{ formatCurrency(order.subtotal) }}</span></div>
        <div v-if="Number(order.discount) > 0" class="row">
            <span>Discount</span><span>-{{ formatCurrency(order.discount) }}</span>
        </div>
        <div class="row total"><span>TOTAL</span><span>{{ formatCurrency(order.total) }}</span></div>

        <template v-if="payment">
            <div class="rule"/>
            <div class="row"><span>Paid ({{ payment.method }})</span><span>{{ formatCurrency(payment.amount_tendered) }}</span></div>
            <div class="row"><span>Change</span><span>{{ formatCurrency(payment.change) }}</span></div>
        </template>
        <p v-else class="center small unpaid">UNPAID</p>

        <div class="rule"/>
        <p class="center small">Thank you!</p>
    </div>
</template>

<script setup lang="ts">
import type { Order } from '~/types/models/order.types'

const props = defineProps<{
    order: Order
    copyLabel: string
}>()

const payment = computed(() => props.order.payments?.[0] ?? null)
</script>

<style scoped>
.receipt {
    width: 72mm; /* printable width of an 80mm roll; use 48mm for a 58mm roll */
    font-family: 'Courier New', monospace;
    font-size: 12px;
    line-height: 1.35;
    color: #000;
}
.center { text-align: center; }
.shop { font-size: 16px; font-weight: bold; }
.copy { margin-top: 4px; font-weight: bold; }
.small { font-size: 10px; }
.indent { padding-left: 8px; }
.row { display: flex; justify-content: space-between; gap: 8px; }
.name { flex: 1; word-break: break-word; }
.total { font-size: 14px; font-weight: bold; }
.unpaid { font-weight: bold; margin-top: 4px; }
.rule { border-top: 1px dashed #000; margin: 6px 0; }
.item { margin-bottom: 3px; }
</style>