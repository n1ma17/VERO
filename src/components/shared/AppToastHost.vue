<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { toasts, dismiss } = useToast()
</script>

<template>
  <Teleport to="body">
    <div
      class="pointer-events-none fixed inset-x-0 top-4 z-[300] flex flex-col items-center gap-2 px-4"
      aria-live="polite"
    >
      <TransitionGroup
        tag="div"
        class="flex w-full flex-col items-center gap-2"
        enter-active-class="transition duration-300 ease-out motion-reduce:transition-none"
        enter-from-class="-translate-y-2 opacity-0"
        leave-active-class="transition duration-200 ease-in motion-reduce:transition-none"
        leave-to-class="-translate-y-2 opacity-0"
      >
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl border border-success/30 bg-surface px-4 py-3 text-sm text-text shadow-lg"
          role="status"
        >
          <span
            class="flex size-8 shrink-0 items-center justify-center rounded-full bg-success/15 text-success"
            aria-hidden="true"
          >
            ✓
          </span>
          <p class="font-medium">{{ toast.text }}</p>
          <button
            type="button"
            class="ml-auto text-text-muted transition hover:text-text"
            aria-label="Dismiss"
            @click="dismiss(toast.id)"
          >
            ×
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
