<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { CURRENCY_META, type Currency } from '@/types/currency'
import {
  formatMoneyInputDraft,
  formatMoneyInputValue,
  parseMoneyInput,
} from '@/utils/formatMoneyInput'

const props = defineProps<{ currency: Currency; disabled?: boolean; hint?: string }>()

const amount = defineModel<number | null>({ default: null })

const display = ref(formatMoneyInputValue(amount.value, props.currency))

const meta = computed(() => CURRENCY_META[props.currency])
const placeholder = computed(() => (meta.value.decimals ? 'e.g. 1,250.00' : 'e.g. 15,500,000'))

watch(
  () => [amount.value, props.currency] as const,
  ([value, currency]) => {
    if (parseMoneyInput(display.value, currency) === value) return
    display.value = formatMoneyInputValue(value, currency)
  },
)

function onInput(event: Event) {
  const raw = (event.target as HTMLInputElement).value
  display.value = formatMoneyInputDraft(raw, props.currency)
  amount.value = parseMoneyInput(display.value, props.currency)
}

function onBlur() {
  display.value = formatMoneyInputValue(amount.value, props.currency)
}

const inputClasses =
  'w-full rounded-2xl border border-primary/20 bg-surface py-3 pl-3 pr-16 text-base font-mono text-text outline-none placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-accent/60'
</script>

<template>
  <div>
    <label class="mb-1.5 block text-xs text-text-muted">Amount ({{ meta.name }})</label>
    <div class="relative">
      <input
        :value="display"
        type="text"
        :inputmode="meta.decimals ? 'decimal' : 'numeric'"
        autocomplete="off"
        :placeholder="placeholder"
        :disabled="disabled"
        :class="inputClasses"
        @input="onInput"
        @blur="onBlur"
      />
      <span
        class="pointer-events-none absolute inset-y-0 right-3 flex items-center font-mono text-xs font-semibold text-text-muted"
      >
        {{ currency }}
      </span>
    </div>
    <p v-if="hint" class="mt-1 text-xs text-text-muted">{{ hint }}</p>
  </div>
</template>
