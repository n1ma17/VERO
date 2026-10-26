<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import TomanAmountInput from '@/components/shared/TomanAmountInput.vue'
import BaseButton from '@/components/shared/BaseButton.vue'
import JalaliDatePicker from '@/components/shared/JalaliDatePicker.vue'
import JalaliMonthPicker from '@/components/shared/JalaliMonthPicker.vue'
import { useBankDeposits } from '@/composables/useBankDeposits'
import { useToast } from '@/composables/useToast'
import { clampDueDay, currentJalaliDate, currentJalaliMonth } from '@/utils/jalali'

const { addDeposit, updateDeposit, editingDeposit, cancelEditingDeposit } = useBankDeposits()
const { showSuccess } = useToast()

const today = currentJalaliDate()
const defaultBooked = currentJalaliMonth()

const amount = ref<number | null>(null)
const note = ref('')
const depositYear = ref(today.year)
const depositMonth = ref(today.month)
const depositDay = ref(today.day)
const bookedYear = ref(defaultBooked.year)
const bookedMonth = ref(defaultBooked.month)

const isEditing = computed(() => editingDeposit.value !== null)

watch(
  () => [depositYear.value, depositMonth.value],
  ([year, month]) => {
    depositDay.value = clampDueDay(depositDay.value, year, month)
  },
)

watch(
  editingDeposit,
  (deposit) => {
    if (deposit) {
      amount.value = deposit.amount
      note.value = deposit.note ?? ''
      depositYear.value = deposit.jalaliYear
      depositMonth.value = deposit.jalaliMonth
      depositDay.value = deposit.jalaliDay
      bookedYear.value = deposit.bookedYear
      bookedMonth.value = deposit.bookedMonth
      return
    }
    resetDateToToday()
    resetBookedToCurrentMonth()
    amount.value = null
    note.value = ''
  },
  { immediate: true },
)

function resetDateToToday() {
  const date = currentJalaliDate()
  depositYear.value = date.year
  depositMonth.value = date.month
  depositDay.value = date.day
}

function resetBookedToCurrentMonth() {
  const month = currentJalaliMonth()
  bookedYear.value = month.year
  bookedMonth.value = month.month
}

const isValid = computed(() => (amount.value ?? 0) > 0)

const inputClasses =
  'w-full rounded-2xl border border-primary/20 bg-surface px-3 py-3 text-base text-text outline-none placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-accent/60'

function buildPayload() {
  return {
    amount: amount.value!,
    note: note.value.trim() || null,
    jalaliYear: depositYear.value,
    jalaliMonth: depositMonth.value,
    jalaliDay: depositDay.value,
    bookedYear: bookedYear.value,
    bookedMonth: bookedMonth.value,
  }
}

function submit() {
  if (!isValid.value) return

  const payload = buildPayload()

  if (isEditing.value && editingDeposit.value) {
    if (!updateDeposit(editingDeposit.value.id, payload)) return
    showSuccess('Deposit updated.')
    return
  }

  addDeposit(payload)
  amount.value = null
  note.value = ''
  resetDateToToday()
  resetBookedToCurrentMonth()
  showSuccess('Deposit added to your balance.')
}

function cancel() {
  cancelEditingDeposit()
}
</script>

<template>
  <section class="min-w-0 overflow-hidden rounded-3xl bg-surface p-4 text-text shadow-lg sm:p-6">
    <h2 class="text-lg font-semibold">{{ isEditing ? 'Edit deposit' : 'Add deposit' }}</h2>
    <p class="mt-1 text-sm text-text-muted">
      Bank date is when the transfer arrived. Count toward month is which month it belongs to (e.g.
      salary for this month).
    </p>

    <form class="mt-5 space-y-4" @submit.prevent="submit">
      <JalaliDatePicker
        v-model:year="depositYear"
        v-model:month="depositMonth"
        v-model:day="depositDay"
        label="Bank deposit date"
      />

      <JalaliMonthPicker
        v-model:year="bookedYear"
        v-model:month="bookedMonth"
        label="Count toward month"
      />

      <TomanAmountInput v-model="amount" />

      <div>
        <label class="mb-1.5 block text-xs text-text-muted">
          Note <span class="text-text-muted/80">(optional)</span>
        </label>
        <input
          v-model="note"
          type="text"
          placeholder="e.g. Salary, transfer from bank"
          :class="inputClasses"
        />
      </div>

      <div class="flex flex-col gap-2 sm:flex-row">
        <BaseButton type="submit" class="w-full sm:flex-1" :disabled="!isValid">
          {{ isEditing ? 'Save changes' : 'Add deposit' }}
        </BaseButton>
        <BaseButton
          v-if="isEditing"
          type="button"
          variant="ghost"
          class="w-full sm:flex-1"
          @click="cancel"
        >
          Cancel
        </BaseButton>
      </div>
    </form>
  </section>
</template>
