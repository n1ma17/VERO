<script setup lang="ts">
import { computed } from 'vue'
import ReceiptPrinterMachine from '@/components/shared/ReceiptPrinterMachine.vue'
import ReceiptPrinterOutput from '@/components/shared/ReceiptPrinterOutput.vue'
import ReceiptPrinterPaper from '@/components/shared/ReceiptPrinterPaper.vue'
import ReceiptPrinterRoot from '@/components/shared/ReceiptPrinterRoot.vue'
import ReceiptPrinterScreen from '@/components/shared/ReceiptPrinterScreen.vue'
import ReceiptPrinterStatus from '@/components/shared/ReceiptPrinterStatus.vue'
import { useExpenseEntryFlow } from '@/composables/useExpenseEntryFlow'
import type { ReceiptPrinterStage } from '@/types/receiptPrinter'
import { expenseCategories } from '@/utils/expenseCategories'

const { stage, snapshot } = useExpenseEntryFlow()

const statusLabels: Record<ReceiptPrinterStage, string> = {
  idle: 'Ready to record',
  processing: 'Saving purchase',
  printing: 'Printing your receipt',
  complete: 'Purchase recorded',
}

const screenTitle = computed(() => snapshot.value?.title ?? 'New expense')
const screenSubtitle = computed(() =>
  snapshot.value
    ? `${expenseCategories[snapshot.value.category].label} · ${snapshot.value.dateLabel}`
    : 'Fill the form and save',
)
const screenAmount = computed(() => snapshot.value?.amountLabel ?? '—')
</script>

<template>
  <ReceiptPrinterRoot :stage="stage" class="mx-auto lg:mx-0 lg:ml-auto">
    <ReceiptPrinterMachine>
      <div class="relative z-10 flex h-11 items-start justify-between">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-6 text-accent">
          <path
            d="M6 6h15l-1.5 9h-12L6 6Zm0 0L5 3H2m6 18a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm10 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <span class="rounded-full bg-surface-inactive/80 px-3 py-1 text-xs font-medium text-content-muted">
          {{ stage === 'idle' ? 'Waiting' : 'Recording…' }}
        </span>
      </div>

      <ReceiptPrinterScreen>
        <div class="space-y-4">
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <p class="truncate font-medium">{{ screenTitle }}</p>
              <p class="mt-0.5 truncate text-xs text-content-muted">{{ screenSubtitle }}</p>
            </div>
            <strong class="font-mono text-lg">{{ screenAmount }}</strong>
          </div>
          <ReceiptPrinterStatus :labels="statusLabels" />
        </div>
      </ReceiptPrinterScreen>
    </ReceiptPrinterMachine>

    <ReceiptPrinterOutput>
      <ReceiptPrinterPaper v-if="snapshot">
        <header class="text-center">
          <p class="text-base font-bold uppercase tracking-widest">Money Management</p>
          <p class="mt-1 text-xs text-content-on-surface-muted">
            {{ snapshot.isUpdate ? 'Expense update receipt' : 'Purchase receipt' }}
          </p>
        </header>

        <div class="my-5 border-t-2 border-dashed border-content-on-surface-muted/40" />

        <dl class="space-y-2">
          <div class="flex justify-between gap-4">
            <dt class="text-content-on-surface-muted">Item</dt>
            <dd class="truncate text-right">{{ snapshot.title }}</dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-content-on-surface-muted">Category</dt>
            <dd class="text-right">{{ expenseCategories[snapshot.category].label }}</dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-content-on-surface-muted">Date</dt>
            <dd>{{ snapshot.dateLabel }}</dd>
          </div>
          <div v-if="snapshot.note" class="flex justify-between gap-4">
            <dt class="text-content-on-surface-muted">Note</dt>
            <dd class="truncate text-right">{{ snapshot.note }}</dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-content-on-surface-muted">Ref.</dt>
            <dd class="font-mono text-xs">{{ snapshot.id.slice(0, 8) }}</dd>
          </div>
        </dl>

        <div class="my-5 border-t-2 border-dashed border-content-on-surface-muted/40" />

        <div class="flex items-baseline justify-between">
          <span class="uppercase tracking-widest">Total</span>
          <span class="text-xl font-bold">{{ snapshot.amountLabel }}</span>
        </div>

        <p class="mt-6 text-center text-xs text-content-on-surface-muted">
          Deducted from your balance for this month.
        </p>
      </ReceiptPrinterPaper>
    </ReceiptPrinterOutput>
  </ReceiptPrinterRoot>
</template>
