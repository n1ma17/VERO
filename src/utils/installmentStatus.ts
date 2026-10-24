import type { Installment, InstallmentStatus } from '@/types/installment'
import { toIsoDate } from '@/utils/date'

export const installmentStatusLabels: Record<InstallmentStatus, string> = {
  paid: 'Paid',
  unpaid: 'Unpaid',
  overdue: 'Overdue',
}

export function getInstallmentStatus(
  installment: Pick<Installment, 'dueDate' | 'paidAt'>,
  today: string = toIsoDate(new Date()),
): InstallmentStatus {
  if (installment.paidAt) return 'paid'
  return installment.dueDate < today ? 'overdue' : 'unpaid'
}
