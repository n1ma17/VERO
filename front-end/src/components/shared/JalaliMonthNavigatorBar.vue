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
    class="flex min-w-0 items-center justify-between gap-2 rounded-[16px] border border-primary/20 bg-primary px-2 py-2 text-background sm:gap-3 sm:px-4 sm:py-3"
  >
    <button
      type="button"
      class="inline-flex min-h-11 shrink-0 items-center rounded-[8px] border border-accent px-2.5 text-xs text-background transition hover:bg-accent hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 sm:px-3 sm:text-sm"
      :disabled="disablePrevious"
      @click="$emit('previous')"
    >
      Prev
    </button>

    <div class="flex min-w-0 flex-1 flex-col items-center px-1 text-center">
      <p class="text-xs text-background/70">{{ caption }}</p>
      <p class="w-full truncate font-semibold">{{ monthLabel }}</p>
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
      class="inline-flex min-h-11 shrink-0 items-center rounded-[8px] border border-accent px-2.5 text-xs text-background transition hover:bg-accent hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 sm:px-3 sm:text-sm"
      :disabled="disableNext"
      @click="$emit('next')"
    >
      Next
    </button>
  </div>
</template>
