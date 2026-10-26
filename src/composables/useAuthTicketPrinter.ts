import { inject, nextTick, provide, readonly, ref, type InjectionKey, type Ref } from 'vue'
import type { AuthMode } from '@/types/auth'
import type { ReceiptPrinterStage } from '@/types/receiptPrinter'

const RETRACT_MS = 1400
const PRINT_MS = 2000
const TICKET_HEIGHT_MS = 380

interface AuthTicketPrinterContext {
  requestModeChange: (next: AuthMode, apply: () => void) => Promise<void>
  isExchanging: Readonly<Ref<boolean>>
}

const authTicketPrinterKey: InjectionKey<AuthTicketPrinterContext> = Symbol('AuthTicketPrinter')

function delay(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms))
}

function ticketMinHeightTarget(ticketEl: HTMLElement | undefined | null): HTMLElement | null {
  return ticketEl?.closest('.receipt-printer') ?? null
}

function setTicketMinHeight(printerEl: HTMLElement | null, px: number | null) {
  if (!printerEl) return
  if (px === null) {
    printerEl.style.removeProperty('--printer-ticket-min-height')
    return
  }
  printerEl.style.setProperty('--printer-ticket-min-height', `${px}px`)
}

export function provideAuthTicketPrinter(
  stage: Ref<ReceiptPrinterStage>,
  options?: { getTicketEl: () => HTMLElement | undefined | null },
) {
  const isExchanging = ref(false)

  async function requestModeChange(_next: AuthMode, apply: () => void) {
    if (isExchanging.value) return
    isExchanging.value = true

    const printerEl = ticketMinHeightTarget(options?.getTicketEl())
    const ticketEl = options?.getTicketEl()
    const heightBefore = ticketEl?.offsetHeight ?? 0

    stage.value = 'retracting'
    await delay(RETRACT_MS)

    stage.value = 'processing'
    if (printerEl && heightBefore > 0) {
      setTicketMinHeight(printerEl, heightBefore)
    }

    apply()
    await nextTick()

    const heightAfter = options?.getTicketEl()?.offsetHeight ?? heightBefore
    if (printerEl && heightAfter > 0) {
      setTicketMinHeight(printerEl, heightAfter)
      await delay(TICKET_HEIGHT_MS)
    }

    stage.value = 'printing'
    await delay(PRINT_MS)
    stage.value = 'complete'
    setTicketMinHeight(printerEl, null)
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
