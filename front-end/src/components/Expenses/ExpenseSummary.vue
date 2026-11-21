<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useExpenses } from '@/composables/useExpenses'
import { categoryMeta } from '@/utils/expenseCategories'
import { formatToman, formatTomanNumber } from '@/utils/formatToman'

const COLLAPSED_COUNT = 5
const REVEAL_MS = 420
const COLLAPSE_MS = 360
const STAGGER_MS = 65

const { monthTotal, expensesInViewMonth, categoryTotals } = useExpenses()

const expanded = ref(false)
const revealActive = ref(false)
const collapseActive = ref(false)
const animating = ref(false)

const hasMore = computed(() => categoryTotals.value.length > COLLAPSED_COUNT)

const visibleTotals = computed(() =>
  expanded.value
    ? categoryTotals.value
    : categoryTotals.value.slice(0, COLLAPSED_COUNT),
)

watch(
  () => categoryTotals.value.map((row) => `${row.category}:${row.amount}`).join('|'),
  () => {
    expanded.value = false
    revealActive.value = false
    collapseActive.value = false
    animating.value = false
  },
)

const largest = computed(() => categoryTotals.value[0]?.amount ?? 0)

const rowRevealDelayClasses = [
  'expense-summary-row-reveal-delay-0',
  'expense-summary-row-reveal-delay-1',
  'expense-summary-row-reveal-delay-2',
  'expense-summary-row-reveal-delay-3',
  'expense-summary-row-reveal-delay-4',
  'expense-summary-row-reveal-delay-5',
  'expense-summary-row-reveal-delay-6',
  'expense-summary-row-reveal-delay-7',
  'expense-summary-row-reveal-delay-8',
  'expense-summary-row-reveal-delay-9',
  'expense-summary-row-reveal-delay-10',
  'expense-summary-row-reveal-delay-11',
  'expense-summary-row-reveal-delay-12',
] as const

function barWidth(amount: number) {
  return largest.value > 0 ? (amount / largest.value) * 100 : 0
}

function share(amount: number) {
  return monthTotal.value > 0 ? Math.round((amount / monthTotal.value) * 100) : 0
}

function rowRevealClass(listIndex: number) {
  if (!revealActive.value || listIndex < COLLAPSED_COUNT) return ''
  const stagger = listIndex - COLLAPSED_COUNT
  const delay =
    rowRevealDelayClasses[stagger] ??
    rowRevealDelayClasses[rowRevealDelayClasses.length - 1]
  return `expense-summary-row-reveal ${delay}`
}

function rowCollapseClass(listIndex: number) {
  if (!collapseActive.value || listIndex < COLLAPSED_COUNT) return ''
  const reverseStagger = categoryTotals.value.length - 1 - listIndex
  const delayIndex = Math.min(
    reverseStagger,
    rowRevealDelayClasses.length - 1,
  )
  return `expense-summary-row-collapse ${rowRevealDelayClasses[delayIndex]}`
}

function rowMotionClass(listIndex: number) {
  if (collapseActive.value) return rowCollapseClass(listIndex)
  return rowRevealClass(listIndex)
}

function showMore() {
  if (expanded.value || animating.value || !hasMore.value) return

  expanded.value = true
  animating.value = true

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    animating.value = false
    return
  }

  revealActive.value = true
  const extraCount = categoryTotals.value.length - COLLAPSED_COUNT
  const lastDelay = Math.min(extraCount - 1, rowRevealDelayClasses.length - 1) * STAGGER_MS
  window.setTimeout(() => {
    animating.value = false
  }, REVEAL_MS + lastDelay)
}

function showLess() {
  if (!expanded.value || animating.value) return

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    revealActive.value = false
    expanded.value = false
    return
  }

  animating.value = true
  revealActive.value = false
  collapseActive.value = true

  const extraCount = categoryTotals.value.length - COLLAPSED_COUNT
  const lastDelay = Math.min(extraCount - 1, rowRevealDelayClasses.length - 1) * STAGGER_MS
  window.setTimeout(() => {
    collapseActive.value = false
    expanded.value = false
    animating.value = false
  }, COLLAPSE_MS + lastDelay)
}
</script>

<template>
  <section class="min-w-0 grid gap-6 overflow-hidden rounded-3xl bg-surface p-4 text-text sm:p-6 md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
    <div class="md:border-r md:border-primary/20 md:pr-6">
      <p class="text-xs font-medium uppercase tracking-widest text-text-muted">
        Spent this month
      </p>
      <p class="mt-2 font-mono text-2xl font-bold leading-tight text-warning sm:text-3xl">
        {{ formatTomanNumber(monthTotal) }}<span class="ml-1 font-sans text-xs font-medium">Toman</span>
      </p>
      <p class="mt-1 text-sm text-text-muted">
        {{ expensesInViewMonth.length }} purchase(s)
      </p>
    </div>

    <div v-if="categoryTotals.length" class="min-w-0">
      <ul class="space-y-3">
        <li
          v-for="(item, index) in visibleTotals"
          :key="item.category"
          class="grid gap-2 text-sm sm:grid-cols-[minmax(0,7rem)_minmax(0,1fr)_auto] sm:items-center sm:gap-3"
          :class="rowMotionClass(index)"
        >
          <span class="flex min-w-0 items-center gap-2">
            <span class="size-2.5 shrink-0 rounded-full" :class="categoryMeta(item.category).dot" />
            <span class="truncate">{{ item.label ?? categoryMeta(item.category).label }}</span>
          </span>
          <svg viewBox="0 0 100 6" preserveAspectRatio="none" class="h-2 w-full min-w-0" aria-hidden="true">
            <rect width="100" height="6" rx="3" class="fill-primary/15/10" />
            <rect
              :width="barWidth(item.amount)"
              height="6"
              rx="3"
              :class="categoryMeta(item.category).fill"
            />
          </svg>
          <span class="font-mono text-xs sm:text-right">
            {{ formatToman(item.amount) }}
            <span class="text-text-muted">· {{ share(item.amount) }}%</span>
          </span>
        </li>
      </ul>

      <button
        v-if="hasMore && !expanded"
        type="button"
        class="mt-3 w-full text-center text-xs font-semibold text-accent transition hover:underline disabled:opacity-50"
        :disabled="animating"
        @click="showMore"
      >
        Show more ({{ categoryTotals.length - COLLAPSED_COUNT }} more)
      </button>
      <button
        v-else-if="hasMore && expanded && !collapseActive"
        type="button"
        class="mt-3 w-full text-center text-xs font-semibold text-accent transition hover:underline disabled:opacity-50"
        :disabled="animating"
        @click="showLess"
      >
        Show less
      </button>
    </div>
    <p v-else class="self-center text-sm text-text-muted">
      No purchases recorded for this month.
    </p>
  </section>
</template>