<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BillLogoUpload from '@/components/Bills/BillLogoUpload.vue'
import TomanAmountInput from '@/components/shared/TomanAmountInput.vue'
import BaseButton from '@/components/shared/BaseButton.vue'
import JalaliDatePicker from '@/components/shared/JalaliDatePicker.vue'
import ReceiptDivider from '@/components/shared/ReceiptDivider.vue'
import ReceiptEdge from '@/components/shared/ReceiptEdge.vue'
import { useBillDefinitionFlow } from '@/composables/useBillDefinitionFlow'
import { loadBillLogo } from '@/composables/useBillLogos'
import { useBills } from '@/composables/useBills'
import {
  clampDueDay,
  currentJalaliDate,
  currentJalaliMonth,
  formatJalaliDate,
  formatJalaliMonthRange,
} from '@/utils/jalali'
import { formatToman } from '@/utils/formatToman'

const route = useRoute()
const router = useRouter()
const { getBillById, addBill, updateBill } = useBills()
const { stage, startIssue, formResetTick } = useBillDefinitionFlow()

const today = currentJalaliDate()
const billNotFound = ref(false)

const form = reactive({
  title: '',
  amount: null as number | null,
  startYear: currentJalaliMonth().year,
  startMonth: currentJalaliMonth().month,
  dueDay: today.day,
  durationMonths: 1,
  logoUrl: null as string | null,
})

const editBillId = computed(() => {
  const id = route.params.id
  return typeof id === 'string' && id.length > 0 ? id : null
})

const isEditing = computed(() => editBillId.value !== null)

watch(
  () => [form.startYear, form.startMonth],
  ([year, month]) => {
    form.dueDay = clampDueDay(form.dueDay, year, month)
  },
)

watch(
  () => editBillId.value,
  async (id) => {
    billNotFound.value = false
    if (!id) {
      resetFormFields()
      return
    }
    const bill = getBillById(id)
    if (!bill) {
      billNotFound.value = true
      return
    }
    form.title = bill.title
    form.amount = bill.amount
    form.startYear = bill.startYear
    form.startMonth = bill.startMonth
    form.dueDay = bill.dueDay
    form.durationMonths = bill.durationMonths
    form.logoUrl = bill.logoKey ? await loadBillLogo(bill.logoKey) : null
  },
  { immediate: true },
)

watch(formResetTick, () => {
  resetFormFields()
  if (editBillId.value) {
    void router.replace({ name: 'bills' })
  }
})

function resetFormFields() {
  form.title = ''
  form.amount = null
  form.logoUrl = null
  form.durationMonths = 1
  const month = currentJalaliMonth()
  form.startYear = month.year
  form.startMonth = month.month
  form.dueDay = clampDueDay(today.day, month.year, month.month)
}

const isValid = computed(
  () => form.title.trim() !== '' && (form.amount ?? 0) > 0 && form.durationMonths >= 1,
)

const isPrinterBusy = computed(() => stage.value !== 'idle')

const firstDueLabel = computed(() =>
  formatJalaliDate(form.startYear, form.startMonth, form.dueDay),
)

const previewPeriod = computed(() =>
  formatJalaliMonthRange(form.startYear, form.startMonth, form.durationMonths),
)

const previewAmount = computed(() =>
  form.amount && form.amount > 0 ? formatToman(form.amount) : '—',
)

const inputClasses =
  'w-full rounded-2xl border border-primary/20 bg-surface px-3 py-2.5 text-sm text-text outline-none placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-accent/60'

async function submit() {
  if (!isValid.value || isPrinterBusy.value || billNotFound.value) return

  const payload = {
    title: form.title.trim(),
    amount: Math.round(form.amount!),
    startYear: form.startYear,
    startMonth: form.startMonth,
    dueDay: form.dueDay,
    durationMonths: form.durationMonths,
    logoUrl: form.logoUrl,
  }

  const bill = isEditing.value
    ? await updateBill(editBillId.value!, payload)
    : await addBill(payload)

  if (!bill) {
    billNotFound.value = true
    return
  }

  startIssue({
    id: bill.id,
    title: bill.title,
    firstDueLabel: formatJalaliDate(bill.startYear, bill.startMonth, bill.dueDay),
    periodLabel: formatJalaliMonthRange(bill.startYear, bill.startMonth, bill.durationMonths),
    amountLabel: formatToman(bill.amount),
    isUpdate: isEditing.value,
  })
}
</script>

<template>
  <article
    v-if="!billNotFound"
    class="relative overflow-visible rounded-t-3xl bg-surface text-text"
  >
    <div class="h-2 bg-primary" />

    <header class="px-6 pb-4 pt-6 text-center">
      <p class="text-xs font-medium uppercase tracking-widest text-text-muted">
        Bill definition
      </p>
      <h2 class="mt-2 text-xl font-bold">{{ isEditing ? 'Edit bill' : 'New bill' }}</h2>
      <p class="mt-1 text-xs text-text-muted">First due: {{ firstDueLabel }}</p>
    </header>

    <ReceiptDivider />

    <form class="space-y-4 px-6 py-5" @submit.prevent="submit">
      <BillLogoUpload v-model="form.logoUrl" />

      <div>
        <label class="mb-1.5 block text-xs text-text-muted">Title</label>
        <input
          v-model="form.title"
          type="text"
          placeholder="e.g. Rent, Internet"
          :class="inputClasses"
          :disabled="isPrinterBusy"
        />
      </div>

      <TomanAmountInput v-model="form.amount" :disabled="isPrinterBusy" />

      <JalaliDatePicker
        v-model:year="form.startYear"
        v-model:month="form.startMonth"
        v-model:day="form.dueDay"
        label="Due date (first month)"
        :disabled="isPrinterBusy"
      />

      <div>
        <label class="mb-1.5 block text-xs text-text-muted">
          Duration (1–60 months) — {{ form.durationMonths }} month(s)
        </label>
        <input
          v-model.number="form.durationMonths"
          type="range"
          min="1"
          max="60"
          class="w-full accent-primary"
          :disabled="isPrinterBusy"
        />
        <p class="mt-1 text-xs text-text-muted">
          Due on day {{ form.dueDay }} in each active month (adjusted for shorter months).
        </p>
      </div>

      <ReceiptDivider />

      <dl class="space-y-2 font-mono text-sm">
        <div class="flex justify-between gap-4">
          <dt class="text-text-muted">Period</dt>
          <dd class="text-right">{{ previewPeriod }}</dd>
        </div>
        <div class="flex justify-between gap-4">
          <dt class="text-text-muted">Due</dt>
          <dd class="text-right">{{ firstDueLabel }}</dd>
        </div>
        <div class="flex justify-between gap-4">
          <dt class="text-text-muted">Amount</dt>
          <dd class="font-bold">{{ previewAmount }}</dd>
        </div>
      </dl>

      <BaseButton type="submit" class="w-full" :disabled="!isValid || isPrinterBusy">
        {{ isEditing ? 'Update bill' : 'Save bill' }}
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
    <p class="font-medium">Bill not found</p>
    <p class="mt-2 text-sm text-text-muted">
      This bill may have been removed from this device.
    </p>
    <RouterLink
      :to="{ name: 'bills' }"
      class="mt-6 inline-block text-sm font-medium text-primary underline-offset-2 hover:underline"
    >
      Create a new bill
    </RouterLink>
  </article>
</template>
