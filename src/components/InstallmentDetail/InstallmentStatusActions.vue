<script setup lang="ts">
import { RouterLink } from 'vue-router'
import BaseButton from '@/components/shared/BaseButton.vue'
import { useCurrentInstallment } from '@/composables/useCurrentInstallment'

const { installment, status, setPaid } = useCurrentInstallment()

function markUnpaid() {
  if (installment.value) setPaid(installment.value.id, false)
}
</script>

<template>
  <div v-if="installment" class="space-y-3 text-center">
    <RouterLink
      :to="{ name: 'bills', params: { id: installment.billId } }"
      class="inline-flex w-full items-center justify-center rounded-full border border-border-subtle/60 bg-surface px-4 py-2 text-sm font-medium text-content-on-surface transition hover:bg-accent"
    >
      Edit bill
    </RouterLink>
    <BaseButton v-if="status === 'paid'" variant="danger" class="w-full" @click="markUnpaid">
      Mark as unpaid
    </BaseButton>
    <p v-else class="text-xs text-content-muted">Use the printer to pay this installment.</p>
  </div>
</template>
