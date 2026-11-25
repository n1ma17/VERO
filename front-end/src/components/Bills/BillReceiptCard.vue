<script setup lang="ts">
import { computed } from 'vue'
import BillIssuedReceiptBody from '@/components/Bills/BillIssuedReceiptBody.vue'
import type { Bill } from '@/types/bill'
import { formatCalendarDate, formatCalendarMonthRange } from '@/utils/calendar'
import { formatMoney } from '@/utils/formatMoney'

const props = withDefaults(
  defineProps<{
    bill: Bill
    readOnly?: boolean
  }>(),
  { readOnly: false },
)

const meta = computed(() =>
  `First due ${formatCalendarDate(props.bill.startYear, props.bill.startMonth, props.bill.dueDay)}`,
)
const periodLabel = computed(() =>
  formatCalendarMonthRange(props.bill.startYear, props.bill.startMonth, props.bill.durationMonths),
)
const amountLabel = computed(() => formatMoney(props.bill.amount))
const refCode = computed(() => props.bill.id.slice(0, 8).toUpperCase())
</script>

<template>
  <RouterLink
    v-if="!readOnly"
    :to="{ name: 'bill-entry', params: { id: bill.id } }"
    class="receipt-paper receipt-paper--card block outline-none transition-opacity duration-200 hover:opacity-95 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
  >
    <BillIssuedReceiptBody
      kind="Bill definition"
      :meta="meta"
      :title="bill.title"
      :logo-key="bill.logoKey"
      :company-name="bill.companyName"
      show-bill-identity
      :period-label="periodLabel"
      :amount-label="amountLabel"
      :ref-code="refCode"
    />
  </RouterLink>
  <article
    v-else
    class="receipt-paper receipt-paper--card block opacity-90"
    aria-label="Past bill (view only)"
  >
    <BillIssuedReceiptBody
      kind="Bill definition"
      :meta="meta"
      :title="bill.title"
      :logo-key="bill.logoKey"
      :company-name="bill.companyName"
      show-bill-identity
      :period-label="periodLabel"
      :amount-label="amountLabel"
      :ref-code="refCode"
    />
    <p class="border-t border-dashed border-text/20 px-4 py-2 text-center text-[10px] font-medium uppercase tracking-[0.14em] text-text-muted">
      View only — past month
    </p>
  </article>
</template>