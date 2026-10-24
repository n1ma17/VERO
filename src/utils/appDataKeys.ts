/** localStorage keys owned by the app (export / import). */
export const APP_DATA_KEYS = {
  bills: 'money-managment:bills',
  deposits: 'money-managment:bank-deposits',
  expenses: 'money-managment:expenses',
  installmentPayments: 'money-managment:installment-payments',
} as const

export const BACKUP_FORMAT_VERSION = 1
