/** localStorage keys owned by the app (export / import). */
export const APP_DATA_KEYS = {
  bills: 'money-managment:bills',
  deposits: 'money-managment:bank-deposits',
  expenses: 'money-managment:expenses',
  installmentPayments: 'money-managment:installment-payments',
} as const

/** 2 = amounts carry a `currency` column. 1 = integer Toman without currency. */
export const BACKUP_FORMAT_VERSION = 2
export const TOMAN_BACKUP_FORMAT_VERSION = 1
