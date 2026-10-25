<script setup lang="ts">
import { ref, watch } from 'vue'
import { formatTomanInputValue, parseTomanInput } from '@/utils/formatTomanInput'

defineProps<{ disabled?: boolean }>()

const amount = defineModel<number | null>({ default: null })

const display = ref(formatTomanInputValue(amount.value))

watch(amount, (value) => {
  const formatted = formatTomanInputValue(value)
  if (formatted !== display.value) display.value = formatted
})

function onInput(event: Event) {
  const raw = (event.target as HTMLInputElement).value
  const parsed = parseTomanInput(raw)
  amount.value = parsed
  display.value = parsed ? formatTomanInputValue(parsed) : ''
}

function onBlur() {
  display.value = formatTomanInputValue(amount.value)
}

const inputClasses =
  'w-full rounded-2xl border border-primary/20 bg-surface px-3 py-2.5 text-sm font-mono text-text outline-none placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-accent/60'
</script>

<template>
  <div>
    <label class="mb-1.5 block text-xs text-text-muted">Amount (Toman)</label>
    <input
      :value="display"
      type="text"
      inputmode="numeric"
      autocomplete="off"
      placeholder="e.g. 1,550,000"
      :disabled="disabled"
      :class="inputClasses"
      @input="onInput"
      @blur="onBlur"
    />
  </div>
</template>
