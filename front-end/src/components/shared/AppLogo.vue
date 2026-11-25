<script setup lang="ts">
import appIcon from '@/assets/icon.png'

const sizeClasses = {
  xs: 'size-6',
  sm: 'size-8',
  md: 'size-10',
  lg: 'size-14',
} as const

withDefaults(
  defineProps<{
    size?: keyof typeof sizeClasses
    showLabel?: boolean
    label?: string
    labelClass?: string
  }>(),
  {
    size: 'sm',
    showLabel: false,
    label: 'money',
    labelClass: 'text-sm font-semibold tracking-wide',
  },
)
</script>

<template>
  <span class="inline-flex shrink-0 items-center gap-1.5">
    <img
      :src="appIcon"
      alt=""
      class="shrink-0 object-contain"
      :class="sizeClasses[size]"
      width="32"
      height="32"
    />
    <span v-if="showLabel" :class="labelClass">{{ label }}</span>
  </span>
</template>