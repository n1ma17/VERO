<script setup lang="ts">
import { computed } from 'vue'
import { currentJalaliDate, formatJalaliDate, JALALI_WEEKDAY_NAMES, jalaliWeekdayIndex } from '@/utils/jalali'

const today = currentJalaliDate()
const todayLabel = computed(
  () =>
    `${JALALI_WEEKDAY_NAMES[jalaliWeekdayIndex(today.year, today.month, today.day)]}, ${formatJalaliDate(today.year, today.month, today.day)}`,
)
</script>

<template>
  <header
    class="sticky top-0 z-40 border-b border-background/15 bg-primary"
  >
    <div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
      <RouterLink to="/" class="text-base font-bold text-background sm:text-lg">
        Money Management
      </RouterLink>
      <p class="text-xs text-background/70 sm:text-sm">{{ todayLabel }}</p>
    </div>
  </header>
</template>
