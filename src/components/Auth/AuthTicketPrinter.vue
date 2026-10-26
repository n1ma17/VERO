<script setup lang="ts">
import { onMounted, ref, toRef } from 'vue'
import AuthTicket from '@/components/Auth/AuthTicket.vue'
import { AUTH_TICKET_PRINT_MS, provideAuthTicketPrinter } from '@/composables/useAuthTicketPrinter'
import { provideReceiptPrinter } from '@/composables/useReceiptPrinter'
import ReceiptPrinterMachine from '@/components/shared/ReceiptPrinterMachine.vue'
import ReceiptPrinterOutput from '@/components/shared/ReceiptPrinterOutput.vue'
import ReceiptPrinterRoot from '@/components/shared/ReceiptPrinterRoot.vue'
import ReceiptPrinterScreen from '@/components/shared/ReceiptPrinterScreen.vue'
import ReceiptPrinterStatus from '@/components/shared/ReceiptPrinterStatus.vue'
import type { ReceiptPrinterStage } from '@/types/receiptPrinter'

const stage = ref<ReceiptPrinterStage>('printing')

provideReceiptPrinter(toRef(stage))
provideAuthTicketPrinter(stage)

const statusLabels: Record<ReceiptPrinterStage, string> = {
  idle: 'Insert ticket',
  processing: 'Preparing ticket',
  retracting: 'Retracting ticket',
  printing: 'Printing ticket',
  complete: 'Ticket issued',
}

onMounted(async () => {
  await new Promise((resolve) => window.setTimeout(resolve, AUTH_TICKET_PRINT_MS))
  stage.value = 'complete'
})
</script>

<template>
  <ReceiptPrinterRoot :stage="stage" class="w-full">
    <ReceiptPrinterMachine>
      <div class="relative z-10 flex h-11 items-start justify-between text-background">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          class="size-6 text-accent"
        >
          <path
            d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm4 3h8M8 11h8M8 15h5"
            stroke-linecap="round"
          />
        </svg>
        <span class="rounded-full bg-primary/80 px-3 py-1 text-xs font-medium text-background/70">
          Admission gate
        </span>
      </div>

      <ReceiptPrinterScreen>
        <div class="space-y-4">
          <div>
            <p class="font-medium text-background">Sign in or register</p>
            <p class="mt-0.5 text-xs text-background/70">
              Switch tabs to retract the ticket and print a new one.
            </p>
          </div>
          <ReceiptPrinterStatus :labels="statusLabels" />
        </div>
      </ReceiptPrinterScreen>
    </ReceiptPrinterMachine>

    <ReceiptPrinterOutput>
      <AuthTicket />
    </ReceiptPrinterOutput>
  </ReceiptPrinterRoot>
</template>
