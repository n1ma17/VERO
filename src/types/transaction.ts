export type TransactionType = 'income' | 'expense'

export interface Transaction {
  id: string
  title: string
  amount: number
  type: TransactionType
  date: string
}

export type NewTransaction = Omit<Transaction, 'id' | 'date'>
