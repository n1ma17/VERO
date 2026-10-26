import {
  computed,
  readonly,
  ref,
  shallowRef,
  type ComputedRef,
  type Ref,
  type ShallowRef,
} from 'vue'
import type { ReceiptPrinterStage } from '@/types/receiptPrinter'
import { scrollToReceiptPrinter } from '@/utils/scrollToReceiptPrinter'

const PROCESSING_MS = 1200
/** Matches the 2s `animate-receipt-feed` duration in `main.css`. */
const PRINTING_MS = 2000
export const PRINTER_RESET_MS = 3_000

/**
 * Creates a singleton "save → print → reset" flow shared by a form and its printer.
 * After printing completes the printer resets and `formResetTick` increments so the form can clear itself.
 */
export interface PrinterFlow<Snapshot> {
  stage: Readonly<Ref<ReceiptPrinterStage>>
  snapshot: ComputedRef<Snapshot | null>
  formResetTick: Readonly<Ref<number>>
  startIssue: (receipt: Snapshot) => void
  cancelFlow: () => void
}

export function createPrinterFlow<Snapshot>(): () => PrinterFlow<Snapshot> {
  const stage = ref<ReceiptPrinterStage>('idle')
  const snapshot = shallowRef<Snapshot | null>(null) as ShallowRef<Snapshot | null>
  const formResetTick = ref(0)
  let timer: ReturnType<typeof setTimeout> | undefined
  let issuing = false

  function resetPrinter() {
    clearTimeout(timer)
    timer = undefined
    issuing = false
    stage.value = 'idle'
    snapshot.value = null
    formResetTick.value += 1
  }

  function beginPrint(receipt: Snapshot) {
    clearTimeout(timer)
    snapshot.value = receipt
    stage.value = 'processing'
    timer = setTimeout(() => {
      stage.value = 'printing'
      timer = setTimeout(() => {
        stage.value = 'complete'
        timer = setTimeout(resetPrinter, PRINTER_RESET_MS)
      }, PRINTING_MS)
    }, PROCESSING_MS)
  }

  function startIssue(receipt: Snapshot) {
    if (issuing || stage.value !== 'idle') return
    issuing = true
    void scrollToReceiptPrinter()
      .then(() => {
        issuing = false
        if (stage.value !== 'idle') return
        beginPrint(receipt)
      })
      .catch(() => {
        issuing = false
        if (stage.value !== 'idle') return
        beginPrint(receipt)
      })
  }

  return function usePrinterFlow() {
    return {
      stage: readonly(stage),
      snapshot: computed(() => snapshot.value),
      formResetTick: readonly(formResetTick),
      startIssue,
      cancelFlow: resetPrinter,
    }
  }
}
