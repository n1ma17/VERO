<script setup lang="ts">
import { computed } from 'vue'
import { useReceiptPrinter } from '@/composables/useReceiptPrinter'
import type { ReceiptPrinterStage } from '@/types/receiptPrinter'

const props = defineProps<{
  labels?: Partial<Record<ReceiptPrinterStage, string>>
}>()

const defaultLabels: Record<ReceiptPrinterStage, string> = {
  idle: 'Ready',
  processing: 'Processing',
  retracting: 'Retracting receipt',
  printing: 'Printing your receipt',
  complete: 'Complete',
}

const { stage } = useReceiptPrinter('ReceiptPrinterStatus')

const label = computed(() => props.labels?.[stage.value] ?? defaultLabels[stage.value])
const indicator = computed(() => {
  if (stage.value === 'complete') return 'complete'
  if (stage.value === 'idle') return 'idle'
  return 'working'
})
</script>

<template>
  <div class="flex min-w-0 items-center gap-2">
    <span aria-hidden="true" class="grid size-5 shrink-0 place-items-center">
      <Transition
        mode="out-in"
        enter-active-class="transition duration-150 ease-out motion-reduce:transition-none"
        enter-from-class="scale-90 opacity-0"
        leave-active-class="transition duration-100 ease-in motion-reduce:transition-none"
        leave-to-class="scale-95 opacity-0"
      >
        <svg
          v-if="indicator === 'complete'"
          key="complete"
          viewBox="0 0 24 24"
          fill="currentColor"
          class="size-4.5 text-success"
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.7 7.7a1 1 0 0 0-1.4-1.4L10.5 13l-1.8-1.8a1 1 0 1 0-1.4 1.4l2.5 2.5a1 1 0 0 0 1.4 0l5.5-5.4Z"
          />
        </svg>
        <svg
          v-else-if="indicator === 'working'"
          key="working"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          class="size-4.5 animate-spin text-text-muted motion-reduce:animate-none"
        >
          <path d="M12 3a9 9 0 1 0 9 9" />
        </svg>
        <span v-else key="idle" class="size-2 animate-pulse rounded-full bg-accent" />
      </Transition>
    </span>

    <div role="status" aria-live="polite" class="min-w-0 flex-1">
      <Transition
        mode="out-in"
        enter-active-class="transition duration-200 ease-out motion-reduce:transition-none"
        enter-from-class="translate-y-1 opacity-0"
        leave-active-class="transition duration-150 ease-in motion-reduce:transition-none"
        leave-to-class="-translate-y-1 opacity-0"
      >
        <p :key="stage" class="truncate text-xs font-medium leading-none text-text-muted">
          {{ label }}
        </p>
      </Transition>
    </div>
  </div>
</template>
