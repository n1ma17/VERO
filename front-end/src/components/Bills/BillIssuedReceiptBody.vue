<script setup lang="ts">
import ReceiptBillIdentity from '@/components/shared/ReceiptBillIdentity.vue'
import ReceiptPaperFooter from '@/components/shared/ReceiptPaperFooter.vue'
import ReceiptPaperHeader from '@/components/shared/ReceiptPaperHeader.vue'

withDefaults(
  defineProps<{
    kind: string
    meta: string
    title: string
    periodLabel: string
    amountLabel: string
    refCode: string
    logoKey?: string | null
    companyName?: string | null
    showBillIdentity?: boolean
  }>(),
  { logoKey: null, companyName: null, showBillIdentity: false },
)
</script>

<template>
  <ReceiptPaperHeader :kind="kind" :meta="meta" />

  <ReceiptBillIdentity
    v-if="showBillIdentity"
    :title="title"
    :company-name="companyName ?? null"
    :logo-key="logoKey ?? null"
  />

  <div class="mt-5 border-t border-dashed border-text-muted/60" />

  <dl class="mt-4 space-y-1.5">
    <div v-if="!showBillIdentity" class="flex justify-between gap-4">
      <dt>Title</dt>
      <dd class="truncate text-right">{{ title }}</dd>
    </div>
    <div class="flex justify-between gap-4">
      <dt>Period</dt>
      <dd class="text-right text-xs">{{ periodLabel }}</dd>
    </div>
  </dl>

  <div class="mt-4 border-t border-dashed border-text-muted/60" />

  <div class="mt-4 flex items-baseline justify-between gap-4">
    <span class="text-lg font-bold uppercase tracking-[0.12em]">Monthly</span>
    <span class="text-xl font-bold tabular-nums">{{ amountLabel }}</span>
  </div>

  <ReceiptPaperFooter status="Issued" :code="refCode" note="See it under Installments" />
</template>