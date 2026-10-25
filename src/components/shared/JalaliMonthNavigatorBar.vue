<script setup lang="ts">
defineProps<{
  caption: string
  monthLabel: string
  disablePrevious?: boolean
  disableNext?: boolean
  isCurrentMonth?: boolean
}>()

defineEmits<{
  previous: []
  next: []
  backToCurrent: []
}>()
</script>

<template>
  <div
    class="flex items-center justify-between gap-3 rounded-[16px] border border-primary/20 bg-primary px-4 py-3 text-background"
  >
    <button
      type="button"
      class="rounded-[8px] border border-accent px-3 py-1.5 text-sm text-background transition hover:bg-accent hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
      :disabled="disablePrevious"
      @click="$emit('previous')"
    >
      Previous
    </button>

    <div class="flex flex-col items-center text-center">
      <p class="text-xs text-background/70">{{ caption }}</p>
      <p class="font-semibold">{{ monthLabel }}</p>
      <button
        v-if="!isCurrentMonth"
        type="button"
        class="mt-0.5 text-xs font-medium text-accent underline-offset-2 hover:underline"
        @click="$emit('backToCurrent')"
      >
        Back to this month
      </button>
    </div>

    <button
      type="button"
      class="rounded-[8px] border border-accent px-3 py-1.5 text-sm text-background transition hover:bg-accent hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
      :disabled="disableNext"
      @click="$emit('next')"
    >
      Next
    </button>
  </div>
</template>
