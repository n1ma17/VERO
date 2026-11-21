import { ref } from 'vue'

/** Bumped when in-memory money collections change so ledger + dashboard views re-derive. */
export const moneyGeneration = ref(0)

export function bumpMoneyData(): void {
  moneyGeneration.value += 1
}