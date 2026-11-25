<script setup lang="ts">
import { computed } from 'vue'
import PageHeader from '@/components/shared/PageHeader.vue'
import { useBills } from '@/composables/useBills'

const { isPastViewMonth } = useBills()

const subtitle = computed(() =>
  isPastViewMonth.value
    ? 'Past months are view only — use the month arrows to browse receipts'
    : 'Recurring charges by month — tap a bill to edit or define a new one',
)
</script>

<template>
  <PageHeader title="Bills" :subtitle="subtitle">
    <template v-if="!isPastViewMonth" #actions>
      <RouterLink
        :to="{ name: 'bill-entry' }"
        class="inline-flex min-h-11 w-full items-center justify-center rounded-[16px] bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent transition hover:bg-accent/90 sm:w-auto"
      >
        Define bill
      </RouterLink>
    </template>
  </PageHeader>
</template>