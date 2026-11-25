<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useCurrency } from '@/composables/useCurrency'
import { useToast } from '@/composables/useToast'
import { CURRENCY_META, type Currency } from '@/types/currency'
import { formatMoneyNumber } from '@/utils/formatMoney'
import {
  formatMoneyInputDraft,
  formatMoneyInputValue,
  parseMoneyInput,
} from '@/utils/formatMoneyInput'

const {
  currencies,
  currency,
  rates,
  marketRates,
  irrPerUsd,
  source,
  fetchedAt,
  setCurrency,
  setIrrMarketRate,
} = useCurrency()
const { showSuccess } = useToast()

const busy = ref(false)
const errorText = ref('')
const irrDraft = ref('')

watch(
  irrPerUsd,
  () => {
    irrDraft.value = formatMoneyInputValue(irrPerUsd.value, 'IRR')
  },
  { immediate: true },
)

function rateLabel(code: Currency): string {
  if (code === currency.value) return 'Display currency'
  const value = rates.value[currency.value] / rates.value[code]
  return `1 ${code} = ${formatMoneyNumber(value, currency.value)} ${currency.value}`
}

const officialIrrLabel = computed(() => formatMoneyNumber(marketRates.value.IRR, 'IRR'))

const updatedLabel = computed(() => {
  if (!fetchedAt.value) return 'Rates not fetched yet'
  const minutes = Math.max(0, Math.round((Date.now() - Date.parse(fetchedAt.value)) / 60_000))
  if (minutes < 1) return 'Updated just now'
  if (minutes < 60) return `Updated ${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 48) return `Updated ${hours} h ago`
  return `Updated ${Math.round(hours / 24)} days ago`
})

const optionClasses = {
  active: 'border-accent/40 bg-accent/10',
  idle: 'border-text/15 hover:border-text/30',
} as const

const badgeClasses = {
  active: 'bg-accent text-on-accent',
  idle: 'border border-text/30 text-text',
} as const

async function run(task: () => Promise<void>, success: string) {
  busy.value = true
  errorText.value = ''
  try {
    await task()
    showSuccess(success)
  } catch (error) {
    errorText.value = error instanceof Error ? error.message : 'Could not save currency settings.'
  } finally {
    busy.value = false
  }
}

async function choose(code: Currency) {
  if (busy.value || code === currency.value) return
  await run(() => setCurrency(code), `Showing amounts in ${CURRENCY_META[code].name}.`)
}

function onIrrInput(event: Event) {
  irrDraft.value = formatMoneyInputDraft((event.target as HTMLInputElement).value, 'IRR')
}

const irrDraftValue = computed(() => parseMoneyInput(irrDraft.value, 'IRR'))
const irrDirty = computed(() => irrDraftValue.value !== irrPerUsd.value)

async function saveIrr() {
  if (busy.value || !irrDraftValue.value || !irrDirty.value) return
  await run(() => setIrrMarketRate(irrDraftValue.value), 'Market rate saved.')
}

async function clearIrr() {
  if (busy.value || irrPerUsd.value === null) return
  await run(() => setIrrMarketRate(null), 'Using the official IRR rate.')
}

const irrInputClasses =
  'w-full rounded-sm border border-text/25 bg-background py-2.5 pl-3 pr-12 font-mono text-base text-text outline-none placeholder:text-text-muted/70 focus:border-accent sm:text-sm'
</script>

<template>
  <section class="space-y-4">
    <p class="text-sm text-text-muted">
      Amounts stay in the currency they were entered in. Totals use today's live rates.
    </p>

    <ul class="space-y-2">
      <li v-for="code in currencies" :key="code">
        <button
          type="button"
          class="flex min-h-12 w-full items-center gap-3 rounded-sm border px-3 py-2 text-left transition disabled:opacity-60"
          :class="optionClasses[code === currency ? 'active' : 'idle']"
          :disabled="busy"
          :aria-pressed="code === currency"
          @click="choose(code)"
        >
          <span
            class="grid h-8 min-w-11 place-items-center rounded-sm px-2 font-mono text-[11px] font-bold"
            :class="badgeClasses[code === currency ? 'active' : 'idle']"
          >
            {{ code }}
          </span>
          <span class="min-w-0 flex-1">
            <span class="block text-sm font-medium">
              {{ CURRENCY_META[code].name }}
              <span class="text-text-muted">{{ CURRENCY_META[code].symbol }}</span>
            </span>
            <span class="block truncate font-mono text-[11px] text-text-muted">
              {{ rateLabel(code) }}
            </span>
          </span>
        </button>
      </li>
    </ul>

    <form class="border-t border-text/15 pt-4" @submit.prevent="saveIrr">
      <label class="block text-xs font-semibold uppercase tracking-[0.18em]" for="settings-irr-rate">
        IRR market rate
      </label>
      <p class="mt-1 text-xs text-text-muted">
        Rials per 1 USD on the free market. Leave empty to use the official rate
        ({{ officialIrrLabel }}).
      </p>
      <div class="mt-2 flex gap-2">
        <div class="relative min-w-0 flex-1">
          <input
            id="settings-irr-rate"
            :value="irrDraft"
            type="text"
            inputmode="numeric"
            autocomplete="off"
            :placeholder="officialIrrLabel"
            :disabled="busy"
            :class="irrInputClasses"
            @input="onIrrInput"
          />
          <span
            class="pointer-events-none absolute inset-y-0 right-3 flex items-center font-mono text-[10px] font-semibold text-text-muted"
          >
            IRR
          </span>
        </div>
        <button
          type="submit"
          class="shrink-0 rounded-sm bg-accent px-4 text-xs font-semibold text-on-accent transition disabled:opacity-40"
          :disabled="busy || !irrDraftValue || !irrDirty"
        >
          Save
        </button>
      </div>
      <button
        v-if="irrPerUsd !== null"
        type="button"
        class="mt-2 text-xs font-medium text-accent hover:underline disabled:opacity-50"
        :disabled="busy"
        @click="clearIrr"
      >
        Use official rate instead
      </button>
    </form>

    <p v-if="errorText" class="text-xs text-danger" role="alert">{{ errorText }}</p>

    <p class="border-t border-text/15 pt-3 text-[11px] text-text-muted">
      {{ updatedLabel }}<template v-if="source"> · {{ source }}</template>
    </p>
  </section>
</template>