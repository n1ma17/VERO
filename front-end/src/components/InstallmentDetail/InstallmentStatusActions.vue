<script setup lang="ts">
import { RouterLink } from 'vue-router'
import BaseButton from '@/components/shared/BaseButton.vue'
import { useCurrentInstallment } from '@/composables/useCurrentInstallment'

const { installment, status, setPaid } = useCurrentInstallment()

async function markUnpaid() {
  if (installment.value) await setPaid(installment.value.id, false)
}
</script>

<template>
  <div v-if="installment" class="space-y-3 text-center">
    <RouterLink
      :to="{ name: 'bills', params: { id: installment.billId } }"
      class="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-primary/25 bg-surface px-4 py-2 text-sm font-medium text-text transition hover:bg-accent"
    >
      Edit bill
    </RouterLink>
    <BaseButton v-if="status === 'paid'" variant="danger" class="w-full" @click="markUnpaid">
      Mark as unpaid
    </BaseButton>
    <p v-else class="text-xs text-text-muted">Use the printer to pay this installment.</p>
  </div>
</template>
