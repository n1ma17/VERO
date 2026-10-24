import { computed, readonly, ref, watch } from 'vue'
import type { NewTransaction, Transaction, TransactionType } from '@/types/transaction'

const STORAGE_KEY = 'money-managment:transactions'

function load(): Transaction[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch {
    return []
  }
}

const transactions = ref<Transaction[]>(load())

watch(transactions, (value) => localStorage.setItem(STORAGE_KEY, JSON.stringify(value)), {
  deep: true,
})

function sumOf(type: TransactionType): number {
  return transactions.value
    .filter((transaction) => transaction.type === type)
    .reduce((total, transaction) => total + transaction.amount, 0)
}

export function useTransactions() {
  const totalIncome = computed(() => sumOf('income'))
  const totalExpense = computed(() => sumOf('expense'))
  const balance = computed(() => totalIncome.value - totalExpense.value)

  function addTransaction(input: NewTransaction) {
    transactions.value.unshift({
      ...input,
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
    })
  }

  function removeTransaction(id: string) {
    transactions.value = transactions.value.filter((transaction) => transaction.id !== id)
  }

  return {
    transactions: readonly(transactions),
    totalIncome,
    totalExpense,
    balance,
    addTransaction,
    removeTransaction,
  }
}
