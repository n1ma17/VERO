<script setup lang="ts">
import { computed } from 'vue'
import ReceiptPrinterMachine from '@/components/shared/ReceiptPrinterMachine.vue'
import ReceiptPrinterOutput from '@/components/shared/ReceiptPrinterOutput.vue'
import ReceiptPrinterPaper from '@/components/shared/ReceiptPrinterPaper.vue'
import ReceiptPrinterRoot from '@/components/shared/ReceiptPrinterRoot.vue'
import ReceiptPrinterScreen from '@/components/shared/ReceiptPrinterScreen.vue'
import ReceiptPrinterStatus from '@/components/shared/ReceiptPrinterStatus.vue'
import { useBillDefinitionFlow } from '@/composables/useBillDefinitionFlow'
import type { ReceiptPrinterStage } from '@/types/receiptPrinter'

const { stage, snapshot } = useBillDefinitionFlow()

const statusLabels: Record<ReceiptPrinterStage, string> = {
  idle: 'Ready to issue',
  processing: 'Saving bill',
  printing: 'Printing your receipt',
  complete: 'Bill issued',
}

const screenTitle = computed(() => snapshot.value?.title ?? 'New bill')
const screenSubtitle = computed(() =>
  snapshot.value ? `Due ${snapshot.value.firstDueLabel}` : 'Fill the form and save',
)
const screenAmount = computed(() => snapshot.value?.amountLabel ?? '—')
</script>

<template>
  <ReceiptPrinterRoot :stage="stage" class="mx-auto lg:mx-0 lg:ml-auto">
    <ReceiptPrinterMachine>
      <div class="relative z-10 flex h-11 items-start justify-between">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" class="size-6 text-accent">
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M5 2h14v20l-2.5-1.5L14 22l-2-1.5L10 22l-2.5-1.5L5 22V2Zm3 5v2h8V7H8Zm0 4v2h8v-2H8Zm0 4v2h5v-2H8Z"
          />
        </svg>
        <span class="rounded-full bg-primary/80 px-3 py-1 text-xs font-medium text-text-muted">
          {{ stage === 'idle' ? 'Waiting' : 'Issuing…' }}
        </span>
      </div>

      <ReceiptPrinterScreen>
        <div class="space-y-4">
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <p class="truncate text-text-muted font-medium">{{ screenTitle }}</p>
              <p class="mt-0.5 text-xs text-text-muted">{{ screenSubtitle }}</p>
            </div>
            <strong class="font-mono text-accent text-lg">{{ screenAmount }}</strong>
          </div>
          <ReceiptPrinterStatus :labels="statusLabels" />
        </div>
      </ReceiptPrinterScreen>
    </ReceiptPrinterMachine>

    <ReceiptPrinterOutput>
      <ReceiptPrinterPaper v-if="snapshot">
        <header class="text-center">
          <p class="text-base font-bold uppercase tracking-widest">Money Management</p>
          <p class="mt-1 text-xs text-text-muted">
            {{ snapshot.isUpdate ? 'Bill update receipt' : 'Bill definition receipt' }}
          </p>
        </header>

        <div class="my-5 border-t-2 border-dashed border-text-muted/40" />

        <dl class="space-y-2">
          <div class="flex justify-between gap-4">
            <dt class="text-text-muted">Title</dt>
            <dd class="truncate text-right">{{ snapshot.title }}</dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-text-muted">Ref.</dt>
            <dd class="font-mono text-xs">{{ snapshot.id.slice(0, 8) }}</dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-text-muted">Period</dt>
            <dd class="text-right text-xs">{{ snapshot.periodLabel }}</dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-text-muted">First due</dt>
            <dd>{{ snapshot.firstDueLabel }}</dd>
          </div>
        </dl>

        <div class="my-5 border-t-2 border-dashed border-text-muted/40" />

        <div class="flex items-baseline justify-between">
          <span class="uppercase tracking-widest">Amount</span>
          <span class="text-xl font-bold">{{ snapshot.amountLabel }}</span>
        </div>

        <p class="mt-6 text-center text-xs text-text-muted">
          Installments will appear on the Installments page.
        </p>
      </ReceiptPrinterPaper>
    </ReceiptPrinterOutput>
  </ReceiptPrinterRoot>
</template>
