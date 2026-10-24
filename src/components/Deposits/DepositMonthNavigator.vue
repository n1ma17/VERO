<script setup lang="ts">
import { computed } from 'vue'
import { useBankDeposits } from '@/composables/useBankDeposits'
import { formatJalaliMonth, nextJalaliMonth, previousJalaliMonth } from '@/utils/jalali'

const { viewMonth, canViewNextMonth, setViewMonth } = useBankDeposits()

const label = computed(() => formatJalaliMonth(viewMonth.value.year, viewMonth.value.month))

function goPrev() {
  const prev = previousJalaliMonth(viewMonth.value.year, viewMonth.value.month)
  setViewMonth(prev.year, prev.month)
}

function goNext() {
  if (!canViewNextMonth.value) return
  const next = nextJalaliMonth(viewMonth.value.year, viewMonth.value.month)
  setViewMonth(next.year, next.month)
}
</script>

<template>
  <div
    class="flex items-center justify-between gap-3 rounded-3xl border border-border-subtle/30 bg-primary px-4 py-3 text-content-on-surface"
  >
    <button
      type="button"
      class="rounded-full border border-accent px-3 py-1.5 text-sm transition hover:bg-accent"
      @click="goPrev"
    >
      Previous
    </button>
    <div class="text-center">
      <p class="text-xs text-content-on-white">Counted in</p>
      <p class="font-semibold">{{ label }}</p>
    </div>
    <button
      type="button"
      class="rounded-full border border-accent px-3 py-1.5 text-sm transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
      :disabled="!canViewNextMonth"
      @click="goNext"
    >
      Next
    </button>
  </div>
</template>
