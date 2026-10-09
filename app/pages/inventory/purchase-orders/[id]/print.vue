<template>
  <div v-if="po">
    <PurchaseOrderPrint :po />
    <div class="no-print actions">
      <UButton label="Print" icon="lucide:printer" @click="print()" />
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false, middleware: 'require-auth' })

const route = useRoute()
const { baseUrl, token } = useAPI()

const { data: po } = await useAsyncData(`po-print-${route.params.id}`,
  () => $fetch<any>(`/purchase-orders/${route.params.id}`, { baseURL: baseUrl, headers: { authorization: token ?? '' } }),
  { transform: (d: any) => d.response })

const print = () => window.print()
</script>

<style>
.actions { text-align: center; padding: 16px; }
@media print {
  .no-print { display: none !important; }
  @page { size: A4; margin: 0; }
}
</style>