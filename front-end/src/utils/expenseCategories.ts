export type { ExpenseCategoryMeta, ExpenseCategoryColorToken } from '@/utils/expenseCategoryStyles'
export {
  EXPENSE_CATEGORY_COLOR_TOKENS,
  expenseCategoryColorLabels,
  isExpenseCategoryColorToken,
  metaFromColorToken,
} from '@/utils/expenseCategoryStyles'

export {
  categoryMeta,
  isExpenseCategorySlug,
  type ExpenseCategoryDefinition,
  useExpenseCategoryCatalog,
} from '@/composables/useExpenseCategoryCatalog'