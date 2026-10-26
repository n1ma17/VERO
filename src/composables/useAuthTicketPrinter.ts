import { inject, nextTick, provide, readonly, ref, type InjectionKey, type Ref } from 'vue'
import type { AuthMode } from '@/types/auth'
import type { ReceiptPrinterStage } from '@/types/receiptPrinter'

const RETRACT_MS = 1400
const PRINT_MS = 1750

interface AuthTicketPrinterContext {
  requestModeChange: (next: AuthMode, apply: () => void) => Promise<void>
  isExchanging: Readonly<Ref<boolean>>
}

const authTicketPrinterKey: InjectionKey<AuthTicketPrinterContext> = Symbol('AuthTicketPrinter')

function delay(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms))
}

export function provideAuthTicketPrinter(stage: Ref<ReceiptPrinterStage>) {
  const isExchanging = ref(false)

  async function requestModeChange(_next: AuthMode, apply: () => void) {
    if (isExchanging.value) return
    isExchanging.value = true
    stage.value = 'retracting'
    await delay(RETRACT_MS)
    stage.value = 'processing'
    apply()
    await nextTick()
    await delay(32)
    stage.value = 'printing'
    await delay(PRINT_MS)
    stage.value = 'complete'
    isExchanging.value = false
  }

  const context: AuthTicketPrinterContext = {
    requestModeChange,
    isExchanging: readonly(isExchanging),
  }
  provide(authTicketPrinterKey, context)
  return context
}

export function useAuthTicketPrinter() {
  const context = inject(authTicketPrinterKey, null)
  if (!context) {
    throw new Error('useAuthTicketPrinter must be used inside AuthTicketPrinter.')
  }
  return context
}

export const AUTH_TICKET_PRINT_MS = PRINT_MS
