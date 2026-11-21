<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseButton from '@/components/shared/BaseButton.vue'
import JalaliDatePicker from '@/components/shared/JalaliDatePicker.vue'
import ReceiptDivider from '@/components/shared/ReceiptDivider.vue'
import ReceiptEdge from '@/components/shared/ReceiptEdge.vue'
import TomanAmountInput from '@/components/shared/TomanAmountInput.vue'
import { useExpenseEntryFlow } from '@/composables/useExpenseEntryFlow'
import { useExpenses } from '@/composables/useExpenses'
import { useToast } from '@/composables/useToast'
import ExpenseCategoryManage from '@/components/ExpenseEntry/ExpenseCategoryManage.vue'
import ExpenseCategoryPicker from '@/components/ExpenseEntry/ExpenseCategoryPicker.vue'
import { useExpenseCategoryCatalog } from '@/composables/useExpenseCategoryCatalog'
import type { ExpenseCategory } from '@/types/expense'
import { categoryMeta } from '@/utils/expenseCategories'
import { clampDueDay, currentJalaliDate, formatJalaliDate, formatJalaliMonth } from '@/utils/jalali'
import { formatToman } from '@/utils/formatToman'

const route = useRoute()
const router = useRouter()
const { getExpenseById, addExpense, updateExpense, removeExpense, viewMonth } = useExpenses()
const { stage, startIssue, formResetTick } = useExpenseEntryFlow()
const { showSuccess } = useToast()

const { visibleCategories, orderedIds } = useExpenseCategoryCatalog()

const expenseNotFound = ref(false)
const confirmingDelete = ref(false)
const manageCategories = ref(false)

function defaultEntryDate() {
  const today = currentJalaliDate()
  const viewed = viewMonth.value
  if (viewed.year === today.year && viewed.month === today.month) return today
  return { year: viewed.year, month: viewed.month, day: clampDueDay(today.day, viewed.year, viewed.month) }
}

const form = reactive({
  title: '',
  amount: null as number | null,
  category: 'food' as ExpenseCategory,
  year: defaultEntryDate().year,
  month: defaultEntryDate().month,
  day: defaultEntryDate().day,
  note: '',
})

const editId = computed(() => {
  const id = route.params.id
  return typeof id === 'string' && id.length > 0 ? id : null
})
const isEditing = computed(() => editId.value !== null)
const isPrinterBusy = computed(() => stage.value !== 'idle')

function resetForm() {
  const date = defaultEntryDate()
  form.title = ''
  form.amount = null
  form.category = 'food'
  form.year = date.year
  form.month = date.month
  form.day = date.day
  form.note = ''
  confirmingDelete.value = false
}

watch(
  editId,
  (id) => {
    expenseNotFound.value = false
    confirmingDelete.value = false
    if (!id) {
      resetForm()
      return
    }
    const expense = getExpenseById(id)
    if (!expense) {
      expenseNotFound.value = true
      return
    }
    form.title = expense.title
    form.amount = expense.amount
    form.category = expense.category
    form.year = expense.jalaliYear
    form.month = expense.jalaliMonth
    form.day = expense.jalaliDay
    form.note = expense.note ?? ''
  },
  { immediate: true },
)

watch(
  () => [form.year, form.month],
  ([year, month]) => {
    form.day = clampDueDay(form.day, year, month)
  },
)

watch(orderedIds, (ids) => {
  if (!ids.includes(form.category)) {
    form.category = ids[0] ?? 'other'
  }
})

watch(formResetTick, () => {
  if (isEditing.value) {
    void router.push({ name: 'expenses' })
    return
  }
  resetForm()
})

const isValid = computed(() => form.title.trim() !== '' && (form.amount ?? 0) > 0)
const dateLabel = computed(() => formatJalaliDate(form.year, form.month, form.day))
const amountLabel = computed(() => (form.amount && form.amount > 0 ? formatToman(form.amount) : '—'))

const inputClasses =
  'w-full rounded-2xl border border-primary/20 bg-surface px-3 py-3 text-base text-text outline-none placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-accent/60 disabled:opacity-50'

async function submit() {
  if (!isValid.value || isPrinterBusy.value || expenseNotFound.value) return

  const payload = {
    title: form.title,
    amount: form.amount!,
    category: form.category,
    jalaliYear: form.year,
    jalaliMonth: form.month,
    jalaliDay: form.day,
    note: form.note,
  }

  const saved = isEditing.value
    ? await updateExpense(editId.value!, payload)
    : await addExpense(payload)
  if (!saved) {
    expenseNotFound.value = true
    return
  }

  startIssue({
    id: saved.id,
    title: saved.title,
    category: saved.category,
    dateLabel: formatJalaliDate(saved.jalaliYear, saved.jalaliMonth, saved.jalaliDay),
    amountLabel: formatToman(saved.amount),
    note: saved.note,
    isUpdate: isEditing.value,
  })
}

async function deleteExpense() {
  if (!editId.value) return
  if (!confirmingDelete.value) {
    confirmingDelete.value = true
    return
  }
  await removeExpense(editId.value)
  showSuccess('Expense deleted.')
  void router.push({ name: 'expenses' })
}
</script>

<template>
  <article
    v-if="!expenseNotFound"
    class="relative overflow-visible rounded-t-3xl bg-surface text-text"
  >
    <div class="h-2" :class="categoryMeta(form.category).strip" />

    <header class="px-4 pb-4 pt-6 text-center sm:px-6">
      <p class="text-xs font-medium uppercase tracking-widest text-text-muted">
        Purchase
      </p>
      <h2 class="mt-2 text-xl font-bold">{{ isEditing ? 'Edit expense' : 'New expense' }}</h2>
      <p class="mt-1 text-xs text-text-muted">{{ dateLabel }}</p>
    </header>

    <ReceiptDivider />

    <form class="space-y-4 px-4 py-5 sm:px-6" @submit.prevent="submit">
      <div>
        <label class="mb-1.5 block text-xs text-text-muted">What did you buy?</label>
        <input
          v-model="form.title"
          type="text"
          placeholder="e.g. Dinner, Jacket, Cinema"
          :class="inputClasses"
          :disabled="isPrinterBusy"
        />
      </div>

      <TomanAmountInput v-model="form.amount" :disabled="isPrinterBusy" />

      <fieldset :disabled="isPrinterBusy">
        <div class="mb-1.5 flex items-baseline justify-between gap-2">
          <legend class="text-xs text-text-muted">Category</legend>
          <button
            type="button"
            class="text-xs font-medium text-accent hover:underline disabled:opacity-50"
            @click="manageCategories = !manageCategories"
          >
            {{ manageCategories ? 'Close editor' : 'Manage categories' }}
          </button>
        </div>
        <ExpenseCategoryManage v-model="manageCategories" class="mb-3" />
        <ExpenseCategoryPicker v-model="form.category" />
        <p v-if="!visibleCategories.length" class="text-xs text-danger">
          No visible categories. Open the editor and add one.
        </p>
      </fieldset>

      <JalaliDatePicker
        v-model:year="form.year"
        v-model:month="form.month"
        v-model:day="form.day"
        label="Purchase date"
        :disabled="isPrinterBusy"
      />

      <div>
        <label class="mb-1.5 block text-xs text-text-muted">
          Note <span class="text-text-muted/80">(optional)</span>
        </label>
        <input
          v-model="form.note"
          type="text"
          placeholder="e.g. Store, who it was for"
          :class="inputClasses"
          :disabled="isPrinterBusy"
        />
      </div>

      <ReceiptDivider />

      <dl class="space-y-2 font-mono text-sm">
        <div class="flex justify-between gap-4">
          <dt class="text-text-muted">Category</dt>
          <dd>{{ categoryMeta(form.category).label }}</dd>
        </div>
        <div class="flex justify-between gap-4">
          <dt class="text-text-muted">Counts in</dt>
          <dd>{{ formatJalaliMonth(form.year, form.month) }}</dd>
        </div>
        <div class="flex justify-between gap-4">
          <dt class="text-text-muted">Amount</dt>
          <dd class="font-bold">{{ amountLabel }}</dd>
        </div>
      </dl>

      <BaseButton type="submit" class="w-full" :disabled="!isValid || isPrinterBusy">
        {{ isEditing ? 'Update expense' : 'Save expense' }}
      </BaseButton>
      <BaseButton
        v-if="isEditing"
        type="button"
        :variant="confirmingDelete ? 'danger' : 'ghost'"
        class="w-full"
        :disabled="isPrinterBusy"
        @click="deleteExpense"
      >
        {{ confirmingDelete ? 'Tap again to delete' : 'Delete expense' }}
      </BaseButton>
      <p v-if="isPrinterBusy" class="text-center text-xs text-text-muted">
        Printer is issuing your receipt…
      </p>
    </form>

    <div class="relative overflow-hidden pb-6">
      <ReceiptEdge :teeth="20" />
    </div>
  </article>

  <article
    v-else
    class="rounded-3xl border border-primary/20 bg-surface px-6 py-10 text-center text-text shadow-xl"
  >
    <p class="font-medium">Expense not found</p>
    <p class="mt-2 text-sm text-text-muted">
      It may have been deleted from this device.
    </p>
    <RouterLink
      :to="{ name: 'expense-entry' }"
      class="mt-6 inline-block text-sm font-medium text-primary underline-offset-2 hover:underline"
    >
      Add a new expense
    </RouterLink>
  </article>
</template>
