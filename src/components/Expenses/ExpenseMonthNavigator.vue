<script setup lang="ts">
import { computed } from 'vue'
import { useExpenses } from '@/composables/useExpenses'
import { formatJalaliMonth } from '@/utils/jalali'

const { viewMonth, isCurrentMonth, shiftViewMonth, goToCurrentMonth } = useExpenses()

const label = computed(() => formatJalaliMonth(viewMonth.value.year, viewMonth.value.month))
</script>

<template>
  <div
    class="flex items-center justify-between gap-3 rounded-3xl border border-border-subtle/30 bg-primary px-4 py-3 text-content-white"
  >
    <button
      type="button"
      class="rounded-full border  border-accent px-3 py-1.5 text-sm transition hover:bg-accent"
      @click="shiftViewMonth(-1)"
    >
      Previous
    </button>
    <div class="flex flex-col items-center">
      <p class="text-xs text-content-on-white">Viewing</p>
      <p class="font-semibold">{{ label }}</p>
      <button
        v-if="!isCurrentMonth"
        type="button"
        class="mt-0.5 text-xs font-medium text-primary underline-offset-2 hover:underline"
        @click="goToCurrentMonth"
      >
        Back to this month
      </button>
    </div>
    <button
      type="button"
      class="rounded-full border border-accent px-3 py-1.5 text-sm transition hover:bg-accent"
      @click="shiftViewMonth(1)"
    >
      Next
    </button>
  </div>
</template>
