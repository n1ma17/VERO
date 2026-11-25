<script setup lang="ts">
import { computed } from 'vue'
import PageHeader from '@/components/shared/PageHeader.vue'
import InstallmentsDefineBillAction from '@/components/Installments/InstallmentsDefineBillAction.vue'
import { useInstallments } from '@/composables/useInstallments'

const { isPastViewMonth } = useInstallments()

const subtitle = computed(() =>
  isPastViewMonth.value
    ? 'Past months are view only — tap a receipt for details without payment changes'
    : 'Browse this month and upcoming months — tap a receipt for details and payment',
)
</script>

<template>
  <PageHeader title="Installments" :subtitle="subtitle">
    <template v-if="!isPastViewMonth" #actions>
      <InstallmentsDefineBillAction />
    </template>
  </PageHeader>
</template>