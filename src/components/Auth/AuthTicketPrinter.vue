<script setup lang="ts">
import { onMounted, ref, toRef, useTemplateRef } from 'vue'
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

const ticketRoot = useTemplateRef<InstanceType<typeof AuthTicket>>('ticket')

provideReceiptPrinter(toRef(stage))
provideAuthTicketPrinter(stage, {
  getTicketEl: () => ticketRoot.value?.$el as HTMLElement | undefined,
})

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
  <ReceiptPrinterRoot :stage="stage" pin-slot-open class="w-full">
    <ReceiptPrinterMachine>
      <ReceiptPrinterScreen>
        <ReceiptPrinterStatus :labels="statusLabels" />
      </ReceiptPrinterScreen>
    </ReceiptPrinterMachine>

    <ReceiptPrinterOutput>
      <AuthTicket ref="ticket" />
    </ReceiptPrinterOutput>
  </ReceiptPrinterRoot>
</template>
