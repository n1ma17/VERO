import { readonly, ref } from 'vue'

interface ToastMessage {
  id: number
  text: string
}

const queue = ref<ToastMessage[]>([])
let nextId = 0
let hideTimer: ReturnType<typeof setTimeout> | undefined

export function useToast() {
  function showSuccess(text: string, durationMs = 2800) {
    const id = ++nextId
    queue.value = [{ id, text }]
    clearTimeout(hideTimer)
    hideTimer = setTimeout(() => {
      queue.value = queue.value.filter((item) => item.id !== id)
    }, durationMs)
  }

  function dismiss(id: number) {
    queue.value = queue.value.filter((item) => item.id !== id)
  }

  return {
    toasts: readonly(queue),
    showSuccess,
    dismiss,
  }
}
