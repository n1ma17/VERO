<script setup lang="ts">
import { useLedger } from '@/composables/useLedger'

const { viewLabel, isCurrentMonth, shiftViewMonth, goToCurrentMonth } = useLedger()
</script>

<template>
  <div
    class="flex items-center justify-between gap-3 rounded-3xl border border-border-subtle/30 bg-primary px-4 py-3 text-content-on-surface"
  >
    <button
      type="button"
      class="rounded-full border border-accent cursor-pointer px-3 py-1.5 text-sm transition hover:bg-accent"
      @click="shiftViewMonth(-1)"
    >
      Previous
    </button>
    <div class="flex flex-col items-center">
      <p class="text-xs text-content-on-white">Statement for</p>
      <p class="font-semibold">{{ viewLabel }}</p>
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
