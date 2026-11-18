import { computed, ref } from 'vue'

const pending = ref(0)
const visible = ref(false)
let showTimer: ReturnType<typeof setTimeout> | null = null
let hideTimer: ReturnType<typeof setTimeout> | null = null
let visibleSince = 0

const SHOW_DELAY_MS = 200
const MIN_VISIBLE_MS = 5000

let overlaySuppressed = false

export function setLoadingOverlaySuppressed(suppressed: boolean): void {
  overlaySuppressed = suppressed
  if (suppressed) dismissLoadingOverlay()
}

function dismissLoadingOverlay(): void {
  if (showTimer) {
    clearTimeout(showTimer)
    showTimer = null
  }
  clearHideTimer()
  pending.value = 0
  visible.value = false
}

function clearHideTimer(): void {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
}

function showOverlay(): void {
  clearHideTimer()
  visibleSince = Date.now()
  visible.value = true
}

function scheduleHide(): void {
  clearHideTimer()
  const elapsed = Date.now() - visibleSince
  const wait = Math.max(0, MIN_VISIBLE_MS - elapsed)
  hideTimer = setTimeout(() => {
    hideTimer = null
    if (pending.value === 0) visible.value = false
  }, wait)
}

export function beginLoading(): void {
  if (overlaySuppressed) return
  pending.value += 1
  clearHideTimer()
  if (pending.value === 1 && !showTimer && !visible.value) {
    showTimer = setTimeout(() => {
      showTimer = null
      if (pending.value > 0) showOverlay()
    }, SHOW_DELAY_MS)
  }
}

export function endLoading(): void {
  if (overlaySuppressed) return
  pending.value = Math.max(0, pending.value - 1)
  if (pending.value > 0) return

  if (showTimer) {
    clearTimeout(showTimer)
    showTimer = null
  }

  if (!visible.value) return
  scheduleHide()
}

export async function runWithLoading<T>(work: () => Promise<T>): Promise<T> {
  beginLoading()
  try {
    return await work()
  } finally {
    endLoading()
  }
}

export function useLoadingOverlay() {
  const isVisible = computed(() => visible.value)
  return { isVisible }
}
