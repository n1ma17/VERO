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
  <header class="border-b border-border-subtle bg-background-elevated">
    <div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
      <RouterLink to="/" class="text-base font-bold text-content sm:text-lg">
        Money Management
      </RouterLink>
      <p class="text-xs text-content-muted sm:text-sm">{{ todayLabel }}</p>
    </div>
  </header>
</template>
