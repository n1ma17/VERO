<script setup lang="ts">
import { computed } from 'vue'
import BillIssuedReceiptBody from '@/components/Bills/BillIssuedReceiptBody.vue'
import type { Bill } from '@/types/bill'
import { formatJalaliDate, formatJalaliMonthRange } from '@/utils/jalali'
import { formatToman } from '@/utils/formatToman'

const props = defineProps<{
  bill: Bill
}>()

const meta = computed(() =>
  `First due ${formatJalaliDate(props.bill.startYear, props.bill.startMonth, props.bill.dueDay)}`,
)
const periodLabel = computed(() =>
  formatJalaliMonthRange(props.bill.startYear, props.bill.startMonth, props.bill.durationMonths),
)
const amountLabel = computed(() => formatToman(props.bill.amount))
const refCode = computed(() => props.bill.id.slice(0, 8).toUpperCase())
</script>

<template>
  <RouterLink
    :to="{ name: 'bill-entry', params: { id: bill.id } }"
    class="receipt-paper receipt-paper--card block outline-none transition-opacity duration-200 hover:opacity-95 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
  >
    <BillIssuedReceiptBody
      kind="Bill definition"
      :meta="meta"
      :title="bill.title"
      :logo-key="bill.logoKey"
      show-bill-identity
      :period-label="periodLabel"
      :amount-label="amountLabel"
      :ref-code="refCode"
    />
  </RouterLink>
</template>