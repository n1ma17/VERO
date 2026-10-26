import { inject, provide, type InjectionKey, type Ref } from 'vue'
import type { ReceiptPrinterStage } from '@/types/receiptPrinter'

interface ReceiptPrinterContext {
  stage: Readonly<Ref<ReceiptPrinterStage>>
}

const receiptPrinterKey: InjectionKey<ReceiptPrinterContext> = Symbol('ReceiptPrinter')

export function provideReceiptPrinter(stage: Readonly<Ref<ReceiptPrinterStage>>) {
  provide(receiptPrinterKey, { stage })
}

export function useReceiptPrinter(component: string): ReceiptPrinterContext {
  const context = inject(receiptPrinterKey, null)
  if (!context) throw new Error(`${component} must be used inside ReceiptPrinterRoot.`)
  return context
}
