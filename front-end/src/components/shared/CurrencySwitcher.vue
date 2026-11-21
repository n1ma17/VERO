<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
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

const open = ref(false)
const busy = ref(false)
const errorText = ref('')
const root = ref<HTMLElement | null>(null)
const panel = ref<HTMLElement | null>(null)
const irrDraft = ref('')

watch(
  [open, irrPerUsd],
  () => {
    irrDraft.value = formatMoneyInputValue(irrPerUsd.value, 'IRR')
  },
  { immediate: true },
)

const activeMeta = computed(() => CURRENCY_META[currency.value])

/** How many display-currency units one unit of `code` is worth today. */
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
  active: 'bg-accent/15 text-text',
  idle: 'text-text hover:bg-text/10',
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
  const value = irrDraftValue.value
  await run(() => setIrrMarketRate(value), 'Market rate saved.')
}

async function clearIrr() {
  if (busy.value || irrPerUsd.value === null) return
  await run(() => setIrrMarketRate(null), 'Using the official IRR rate.')
}

/** Below Tailwind `sm` the panel is a bottom sheet teleported above the bottom nav. */
const mobileQuery = window.matchMedia('(max-width: 39.999rem)')
const isMobile = ref(mobileQuery.matches)

function onMediaChange(event: MediaQueryListEvent) {
  isMobile.value = event.matches
}

function onDocumentPointer(event: PointerEvent) {
  if (!open.value || isMobile.value) return
  const target = event.target as Node
  if (root.value?.contains(target) || panel.value?.contains(target)) return
  open.value = false
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') open.value = false
}

watch([open, isMobile], ([isOpen, mobile]) => {
  document.body.classList.toggle('overflow-hidden', isOpen && mobile)
})

const panelMode = computed(() => (isMobile.value ? 'sheet' : 'dropdown'))

const panelClasses = {
  sheet:
    'fixed inset-x-0 bottom-0 z-[150] max-h-[85dvh] overflow-y-auto overscroll-contain rounded-t-3xl border-t border-text/20 bg-background px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] text-text shadow-2xl',
  dropdown:
    'absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border border-text/20 bg-background p-3 text-text shadow-2xl',
} as const

const panelTransition = {
  sheet: {
    enterActive: 'transition-transform duration-300 ease-out motion-reduce:transition-none',
    leaveActive: 'transition-transform duration-200 ease-in motion-reduce:transition-none',
    hidden: 'translate-y-full',
  },
  dropdown: {
    enterActive: 'transition duration-150 ease-out motion-reduce:transition-none',
    leaveActive: 'transition duration-100 ease-in motion-reduce:transition-none',
    hidden: '-translate-y-1 opacity-0',
  },
} as const

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointer)
  document.addEventListener('keydown', onKeydown)
  mobileQuery.addEventListener('change', onMediaChange)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointer)
  document.removeEventListener('keydown', onKeydown)
  mobileQuery.removeEventListener('change', onMediaChange)
  document.body.classList.remove('overflow-hidden')
})

const irrInputClasses =
  'w-full rounded-xl border border-text/25 bg-background py-2.5 pl-3 pr-12 font-mono text-base text-text outline-none placeholder:text-text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/40 sm:py-2 sm:text-sm'
</script>

<template>
  <div ref="root" class="relative">
    <button
      type="button"
      class="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-text/30 py-1 pl-1.5 pr-3 text-xs font-medium text-text transition hover:border-text"
      :aria-expanded="open"
      aria-haspopup="dialog"
      :title="`Display currency: ${activeMeta.name}`"
      @click="open = !open"
    >
      <span
        class="grid h-8 min-w-8 place-items-center rounded-full bg-accent px-2 font-mono text-[11px] font-bold text-on-accent"
      >
        {{ currency }}
      </span>
      <span class="hidden sm:inline">Currency</span>
      <svg
        viewBox="0 0 16 16"
        class="size-3 transition-transform"
        :class="open ? 'rotate-180' : ''"
        fill="none"
        aria-hidden="true"
      >
        <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
      </svg>
    </button>

    <Teleport to="body" :disabled="!isMobile">
      <Transition
        enter-active-class="transition-opacity duration-300 motion-reduce:transition-none"
        leave-active-class="transition-opacity duration-200 motion-reduce:transition-none"
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
      >
        <div
          v-if="open && isMobile"
          class="fixed inset-0 z-[140] bg-background/80"
          aria-hidden="true"
          @click="open = false"
        />
      </Transition>

      <Transition
        :enter-active-class="panelTransition[panelMode].enterActive"
        :leave-active-class="panelTransition[panelMode].leaveActive"
        :enter-from-class="panelTransition[panelMode].hidden"
        :leave-to-class="panelTransition[panelMode].hidden"
      >
        <div
          v-if="open"
          ref="panel"
          role="dialog"
          aria-label="Currency settings"
          :aria-modal="isMobile"
          :class="panelClasses[panelMode]"
        >
          <span
            v-if="isMobile"
            class="mx-auto mb-3 block h-1 w-10 rounded-full bg-text/30"
            aria-hidden="true"
          />
          <div class="flex items-start justify-between gap-3 px-1 pb-2">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.18em]">Display currency</p>
              <p class="mt-1 text-xs text-text-muted">
                Every amount keeps the currency it was entered in and is converted at today's rate.
              </p>
            </div>
            <button
              v-if="isMobile"
              type="button"
              class="grid size-9 shrink-0 place-items-center rounded-full border border-text/30 text-text"
              aria-label="Close currency settings"
              @click="open = false"
            >
              <svg viewBox="0 0 16 16" class="size-3.5" fill="none" aria-hidden="true">
                <path
                  d="M4 4l8 8M12 4l-8 8"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                />
              </svg>
            </button>
          </div>

          <ul class="space-y-1">
            <li v-for="code in currencies" :key="code">
              <button
                type="button"
                class="flex min-h-12 w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition disabled:opacity-60"
                :class="optionClasses[code === currency ? 'active' : 'idle']"
                :disabled="busy"
                :aria-pressed="code === currency"
                @click="choose(code)"
              >
                <span
                  class="grid h-8 min-w-11 place-items-center rounded-full px-2 font-mono text-[11px] font-bold"
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
                <svg
                  v-if="code === currency"
                  viewBox="0 0 16 16"
                  class="size-4 shrink-0 text-accent"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M3.5 8.5l3 3 6-7"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </button>
            </li>
          </ul>

          <form class="mt-3 border-t border-text/15 px-1 pt-3" @submit.prevent="saveIrr">
            <label
              class="block text-xs font-semibold uppercase tracking-[0.18em]"
              for="irr-market-rate"
            >
              IRR market rate
            </label>
            <p class="mt-1 text-xs text-text-muted">
              Rials per 1 USD on the free market. Leave empty to use the official rate
              ({{ officialIrrLabel }}).
            </p>
            <div class="mt-2 flex gap-2">
              <div class="relative min-w-0 flex-1">
                <input
                  id="irr-market-rate"
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
                class="shrink-0 rounded-xl bg-accent px-4 text-xs font-semibold text-on-accent transition disabled:opacity-40"
                :disabled="busy || !irrDraftValue || !irrDirty"
              >
                Save
              </button>
            </div>
            <button
              v-if="irrPerUsd !== null"
              type="button"
              class="mt-2 text-xs font-medium text-accent underline-offset-2 hover:underline disabled:opacity-50"
              :disabled="busy"
              @click="clearIrr"
            >
              Use official rate instead
            </button>
          </form>

          <p v-if="errorText" class="mt-3 px-1 text-xs text-danger" role="alert">
            {{ errorText }}
          </p>

          <p class="mt-3 border-t border-text/15 px-1 pt-2 text-[11px] text-text-muted">
            {{ updatedLabel }}<template v-if="source"> · {{ source }}</template>
          </p>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
