<script setup lang="ts">
import { RouterLink } from 'vue-router'
import BaseButton from '@/components/shared/BaseButton.vue'
import { useCurrentInstallment } from '@/composables/useCurrentInstallment'

const { installment, status, readOnly, setPaid } = useCurrentInstallment()

async function markUnpaid() {
  if (installment.value) await setPaid(installment.value.id, false)
}
</script>

<template>
  <div v-if="installment" class="space-y-3 text-center">
    <p
      v-if="readOnly"
      class="rounded-sm border border-dashed border-text/30 px-4 py-3 text-xs text-text-muted"
    >
      Past month — view only. Payment and edits are disabled.
    </p>
    <template v-else>
      <RouterLink
        :to="{ name: 'bill-entry', params: { id: installment.billId } }"
        class="inline-flex min-h-11 w-full items-center justify-center rounded-[16px] border border-primary/25 bg-surface px-4 py-2 text-sm font-medium text-text transition hover:bg-primary/10"
      >
        Edit bill
      </RouterLink>
      <BaseButton v-if="status === 'paid'" variant="danger" class="w-full" @click="markUnpaid">
        Mark as unpaid
      </BaseButton>
      <p v-else class="text-xs text-text-muted">Use the printer to pay this installment.</p>
    </template>
  </div>
</template>
