import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useInstallments } from '@/composables/useInstallments'
import { isBeforeCurrentCalendarMonth } from '@/utils/calendar'
import { getInstallmentStatus } from '@/utils/installmentStatus'

/** The installment addressed by the `:id` route param. */
export function useCurrentInstallment() {
  const route = useRoute()
  const { allInstallments, setPaid } = useInstallments()

  const installment = computed(() =>
    allInstallments.value.find((item) => item.id === route.params.id),
  )
  const status = computed(() => (installment.value ? getInstallmentStatus(installment.value) : null))

  const readOnly = computed(
    () =>
      installment.value !== undefined &&
      isBeforeCurrentCalendarMonth(installment.value.dueYear, installment.value.dueMonth),
  )

  return { installment, status, readOnly, setPaid }
}
