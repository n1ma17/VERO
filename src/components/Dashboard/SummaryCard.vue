<script setup lang="ts">
import { computed } from 'vue'
import { formatAmount } from '@/utils/formatAmount'

const props = defineProps<{
  label: string
  amount: number
  tone: 'primary' | 'success' | 'danger'
}>()

const toneClasses = {
  primary: 'bg-primary-soft text-primary',
  success: 'bg-success-soft text-success',
  danger: 'bg-danger-soft text-danger',
}

const formatted = computed(() => formatAmount(props.amount))
</script>

<template>
  <div class="rounded-2xl p-5" :class="toneClasses[tone]">
    <p class="text-sm font-medium opacity-80">{{ label }}</p>
    <p class="mt-2 text-2xl font-bold">{{ formatted }}</p>
  </div>
</template>
