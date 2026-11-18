<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue'
import { useLoadingOverlay } from '@/composables/useLoadingOverlay'

const { isVisible } = useLoadingOverlay()

const SEGMENT_COUNT = 18
const filled = ref(0)

let tick: ReturnType<typeof setInterval> | null = null

function stopTick() {
  if (tick) {
    clearInterval(tick)
    tick = null
  }
  filled.value = 0
}

function startTick() {
  stopTick()
  tick = setInterval(() => {
    filled.value = filled.value >= SEGMENT_COUNT ? 0 : filled.value + 1
  }, 130)
}

watch(isVisible, (visible) => {
  if (visible) startTick()
  else stopTick()
}, { immediate: true })

onUnmounted(stopTick)

const segmentClasses = {
  full: 'bg-text',
  partial: 'bg-text/45',
  empty: 'bg-transparent',
}

function segmentClass(index: number) {
  if (filled.value <= 0) return segmentClasses.empty
  if (index < filled.value - 1) return segmentClasses.full
  if (index === filled.value - 1) return segmentClasses.partial
  return segmentClasses.empty
}
</script>

<template>
  <div
    v-show="isVisible"
    class="loading-overlay fixed inset-0 z-[100] grid place-items-center"
    role="status"
    aria-live="polite"
    aria-busy="true"
    aria-label="Loading"
  >
    <div class="loading-screen">
      <p class="loading-screen__title text-accent">Loading</p>

      <div
        class="loading-screen__bar"
        role="progressbar"
        :aria-valuemin="0"
        :aria-valuemax="SEGMENT_COUNT"
        :aria-valuenow="filled"
      >
        <span
          v-for="index in SEGMENT_COUNT"
          :key="index"
          class="loading-screen__seg"
          :class="segmentClass(index - 1)"
        />
      </div>

      <p class="loading-screen__subtitle">Please Wait</p>
    </div>
  </div>
</template>