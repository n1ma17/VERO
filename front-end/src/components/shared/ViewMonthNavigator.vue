<script setup lang="ts">
import { computed } from 'vue'
import JalaliMonthNavigatorBar from '@/components/shared/JalaliMonthNavigatorBar.vue'
import { useBankDeposits } from '@/composables/useBankDeposits'
import { useBills } from '@/composables/useBills'
import { useExpenses } from '@/composables/useExpenses'
import { useInstallments } from '@/composables/useInstallments'
import { useLedger } from '@/composables/useLedger'
import { formatJalaliMonth, nextJalaliMonth, previousJalaliMonth } from '@/utils/jalali'

export type ViewMonthNavigatorContext = 'expenses' | 'installments' | 'deposits' | 'ledger' | 'bills'

const props = defineProps<{
  context: ViewMonthNavigatorContext
}>()

const expenses = useExpenses()
const bills = useBills()
const installments = useInstallments()
const deposits = useBankDeposits()
const ledger = useLedger()

const caption = computed(() => {
  switch (props.context) {
    case 'deposits':
      return 'Counted in'
    case 'ledger':
      return 'Statement for'
    default:
      return 'Viewing'
  }
})

const monthLabel = computed(() => {
  switch (props.context) {
    case 'ledger':
      return ledger.viewLabel.value
    case 'expenses':
      return formatJalaliMonth(expenses.viewMonth.value.year, expenses.viewMonth.value.month)
    case 'bills':
      return formatJalaliMonth(bills.viewMonth.value.year, bills.viewMonth.value.month)
    case 'installments':
      return formatJalaliMonth(
        installments.viewMonth.value.year,
        installments.viewMonth.value.month,
      )
    case 'deposits':
      return formatJalaliMonth(deposits.viewMonth.value.year, deposits.viewMonth.value.month)
  }
})

const isCurrentMonth = computed(() => {
  switch (props.context) {
    case 'expenses':
      return expenses.isCurrentMonth.value
    case 'bills':
      return bills.isCurrentMonth.value
    case 'ledger':
      return ledger.isCurrentMonth.value
    default:
      return true
  }
})

const disablePrevious = computed(() => {
  if (props.context === 'installments') return !installments.canViewPreviousMonth.value
  return false
})

const disableNext = computed(() => {
  if (props.context === 'deposits') return !deposits.canViewNextMonth.value
  return false
})

const showBackLink = computed(
  () => props.context === 'expenses' || props.context === 'ledger' || props.context === 'bills',
)

function onPrevious() {
  switch (props.context) {
    case 'expenses':
      expenses.shiftViewMonth(-1)
      break
    case 'bills':
      bills.shiftViewMonth(-1)
      break
    case 'ledger':
      ledger.shiftViewMonth(-1)
      break
    case 'installments':
      if (!installments.canViewPreviousMonth.value) return
      const prev = previousJalaliMonth(
        installments.viewMonth.value.year,
        installments.viewMonth.value.month,
      )
      installments.setViewMonth(prev.year, prev.month)
      break
    case 'deposits': {
      const prevMonth = previousJalaliMonth(
        deposits.viewMonth.value.year,
        deposits.viewMonth.value.month,
      )
      deposits.setViewMonth(prevMonth.year, prevMonth.month)
      break
    }
  }
}

function onNext() {
  switch (props.context) {
    case 'expenses':
      expenses.shiftViewMonth(1)
      break
    case 'bills':
      bills.shiftViewMonth(1)
      break
    case 'ledger':
      ledger.shiftViewMonth(1)
      break
    case 'installments': {
      const next = nextJalaliMonth(
        installments.viewMonth.value.year,
        installments.viewMonth.value.month,
      )
      installments.setViewMonth(next.year, next.month)
      break
    }
    case 'deposits':
      if (!deposits.canViewNextMonth.value) return
      const nextMonth = nextJalaliMonth(
        deposits.viewMonth.value.year,
        deposits.viewMonth.value.month,
      )
      deposits.setViewMonth(nextMonth.year, nextMonth.month)
      break
  }
}

function onBackToCurrent() {
  if (props.context === 'expenses') expenses.goToCurrentMonth()
  if (props.context === 'bills') bills.goToCurrentMonth()
  if (props.context === 'ledger') ledger.goToCurrentMonth()
}
</script>

<template>
  <JalaliMonthNavigatorBar
    :caption="caption"
    :month-label="monthLabel"
    :disable-previous="disablePrevious"
    :disable-next="disableNext"
    :is-current-month="showBackLink ? isCurrentMonth : true"
    @previous="onPrevious"
    @next="onNext"
    @back-to-current="onBackToCurrent"
  />
</template>
