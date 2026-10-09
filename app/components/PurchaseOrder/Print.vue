<template>
  <div class="po">
    <div class="header">
      <h1>{{ company.name }}</h1>
      <p>{{ company.tagline }}</p>
      <p>{{ company.address }}</p>
      <p>Tel: {{ company.phone }} · Mobile: {{ company.mobile }}</p>
      <p>{{ company.email }} · TIN: {{ company.tin }}</p>
    </div>

    <h2 class="title">PURCHASE ORDER</h2>

    <div class="meta">
      <div>
        <p><b>PO No.:</b> {{ po.order_number }}</p>
        <p><b>Date:</b> {{ formatDate(po.ordered_at ?? po.created_at, 'date-long') }}</p>
        <p><b>Status:</b> {{ po.status }}</p>
      </div>
      <div>
        <p><b>Supplier:</b> {{ po.supplier?.name }}</p>
        <p><b>Contact:</b> {{ po.supplier?.contact_person || '—' }}</p>
        <p><b>Phone:</b> {{ po.supplier?.contact_number || '—' }}</p>
        <p><b>Address:</b> {{ po.supplier?.address || '—' }}</p>
      </div>
    </div>

    <table>
      <thead>
        <tr><th>#</th><th>Item</th><th>Unit</th><th class="r">Qty</th><th class="r">Unit Cost</th><th class="r">Amount</th></tr>
      </thead>
      <tbody>
        <tr v-for="(item, i) in po.items" :key="item.id">
          <td>{{ Number(i) + 1 }}</td>
          <td>{{ item.ingredient.name }}</td>
          <td>{{ item.ingredient.unit }}</td>
          <td class="r">{{ Number(item.quantity) }}</td>
          <td class="r">{{ formatCurrency(item.unit_cost) }}</td>
          <td class="r">{{ formatCurrency(item.subtotal) }}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr><td colspan="5" class="r"><b>TOTAL</b></td><td class="r"><b>{{ formatCurrency(po.total_cost) }}</b></td></tr>
      </tfoot>
    </table>

    <p class="note">Please deliver the items above to {{ company.address }}. Kindly indicate this PO number on your delivery receipt and invoice.</p>

    <div class="sign">
      <div><span>{{ po.orderedByUser?.first_name }} {{ po.orderedByUser?.last_name }}</span><label>Prepared by</label></div>
      <div><span>&nbsp;</span><label>Approved by</label></div>
      <div><span>&nbsp;</span><label>Received by / Date</label></div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ po: any; }>()
</script>

<style scoped>
.po { width: 210mm; min-height: 297mm; padding: 15mm; margin: 0 auto; background: #fff; color: #000; font: 13px Arial, sans-serif; box-sizing: border-box; }
.header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; }
.header h1 { margin: 0; font-size: 26px; letter-spacing: 2px; }
.header p { margin: 2px 0; }
.title { text-align: center; margin: 14px 0; letter-spacing: 3px; }
.meta { display: flex; justify-content: space-between; gap: 20px; margin-bottom: 12px; }
.meta p { margin: 3px 0; }
table { width: 100%; border-collapse: collapse; }
th, td { border: 1px solid #000; padding: 5px 7px; }
th { background: #eee; text-align: left; }
.r { text-align: right; }
.note { margin-top: 14px; font-size: 12px; }
.sign { display: flex; justify-content: space-between; gap: 30px; margin-top: 60px; }
.sign div { flex: 1; text-align: center; }
.sign span { display: block; border-bottom: 1px solid #000; min-height: 20px; }
.sign label { font-size: 11px; }
</style>