/** Anchor on `ReceiptPrinterRoot` — one printer per page. */
export const RECEIPT_PRINTER_ID = 'receipt-printer'

const SCROLL_FALLBACK_MS = 720

/**
 * Smoothly scrolls the receipt printer into view, then resolves so printing can start.
 * Respects `prefers-reduced-motion`.
 */
export function scrollToReceiptPrinter(): Promise<void> {
  const el = document.getElementById(RECEIPT_PRINTER_ID)
  if (!el) return Promise.resolve()

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({
    behavior: reducedMotion ? 'auto' : 'smooth',
    block: 'center',
    inline: 'nearest',
  })

  if (reducedMotion) return Promise.resolve()

  return new Promise((resolve) => {
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      window.removeEventListener('scrollend', finish)
      resolve()
    }

    if ('onscrollend' in window) {
      window.addEventListener('scrollend', finish, { once: true })
      setTimeout(finish, SCROLL_FALLBACK_MS)
    } else {
      setTimeout(finish, SCROLL_FALLBACK_MS)
    }
  })
}
