<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import JalaliCalendarPanel from '@/components/shared/JalaliCalendarPanel.vue'
import { clampDueDay, formatJalaliDate } from '@/utils/jalali'

const props = defineProps<{
  year: number
  month: number
  day: number
  label?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:year': [year: number]
  'update:month': [month: number]
  'update:day': [day: number]
}>()

const open = ref(false)
const panelYear = ref(props.year)
const panelMonth = ref(props.month)
const panelDay = ref(props.day)
const root = ref<HTMLElement | null>(null)
const trigger = ref<HTMLButtonElement | null>(null)
const popover = ref<HTMLElement | null>(null)

const VIEWPORT_GAP = 8
const POPOVER_MIN_WIDTH = 280

const popoverStyle = ref({
  top: '0px',
  left: '0px',
  width: 'min(100vw - 1rem, 22rem)',
  maxHeight: 'calc(100dvh - 1rem)',
})

const display = computed(() => formatJalaliDate(props.year, props.month, props.day))

watch(
  () => [props.year, props.month, props.day],
  ([year, month, day]) => {
    panelYear.value = year
    panelMonth.value = month
    panelDay.value = day
  },
)

function updatePosition() {
  const el = trigger.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  const width = Math.min(Math.max(rect.width, POPOVER_MIN_WIDTH), viewportWidth - VIEWPORT_GAP * 2)
  const left = Math.min(
    Math.max(VIEWPORT_GAP, rect.left),
    viewportWidth - width - VIEWPORT_GAP,
  )

  const naturalHeight = popover.value?.scrollHeight ?? 0
  const spaceBelow = viewportHeight - rect.bottom - VIEWPORT_GAP * 2
  const spaceAbove = rect.top - VIEWPORT_GAP * 2
  const openAbove = naturalHeight > spaceBelow && spaceAbove > spaceBelow
  const available = Math.max(openAbove ? spaceAbove : spaceBelow, 200)
  const height = Math.min(naturalHeight || available, available)

  const top = openAbove
    ? Math.max(VIEWPORT_GAP, rect.top - VIEWPORT_GAP - height)
    : Math.min(rect.bottom + VIEWPORT_GAP, viewportHeight - VIEWPORT_GAP - height)

  popoverStyle.value = {
    top: `${top}px`,
    left: `${left}px`,
    width: `${width}px`,
    maxHeight: `${available}px`,
  }
}

function bindPositionListeners() {
  window.addEventListener('scroll', updatePosition, true)
  window.addEventListener('resize', updatePosition)
}

function unbindPositionListeners() {
  window.removeEventListener('scroll', updatePosition, true)
  window.removeEventListener('resize', updatePosition)
}

function toggle() {
  if (props.disabled) return
  open.value = !open.value
  if (open.value) {
    panelYear.value = props.year
    panelMonth.value = props.month
    panelDay.value = props.day
    updatePosition()
    void nextTick(updatePosition)
    bindPositionListeners()
  } else {
    unbindPositionListeners()
  }
}

function close() {
  if (!open.value) return
  open.value = false
  unbindPositionListeners()
}

function onPanelYear(year: number) {
  panelYear.value = year
  panelDay.value = clampDueDay(panelDay.value, year, panelMonth.value)
  emit('update:year', year)
  emit('update:day', panelDay.value)
  void nextTick(updatePosition)
}

function onPanelMonth(month: number) {
  panelMonth.value = month
  panelDay.value = clampDueDay(panelDay.value, panelYear.value, month)
  emit('update:month', month)
  emit('update:day', panelDay.value)
  void nextTick(updatePosition)
}

function onPanelDay(day: number) {
  panelDay.value = day
  emit('update:year', panelYear.value)
  emit('update:month', panelMonth.value)
  emit('update:day', day)
  close()
}

function onDocumentClick(event: MouseEvent) {
  if (!open.value || !root.value) return
  const target = event.target as Node
  if (root.value.contains(target)) return
  const teleported = document.getElementById('jalali-date-picker-popover')
  if (teleported?.contains(target)) return
  close()
}

onMounted(() => document.addEventListener('click', onDocumentClick))
onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
  unbindPositionListeners()
})
</script>

<template>
  <div ref="root" class="relative">
    <label v-if="label" class="mb-1.5 block text-xs font-medium text-text-muted">
      {{ label }}
    </label>
    <button
      ref="trigger"
      type="button"
      class="flex min-h-11 w-full items-center justify-between gap-2 rounded-2xl border border-primary/20 bg-surface px-4 py-3 text-base text-text transition hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 disabled:cursor-not-allowed disabled:opacity-50"
      :aria-expanded="open"
      :disabled="disabled"
      @click.stop="toggle"
    >
      <span class="font-mono font-medium">{{ display }}</span>
      <span class="text-text-muted" aria-hidden="true">▾</span>
    </button>

    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out motion-reduce:transition-none"
        enter-from-class="translate-y-1 opacity-0"
        leave-active-class="transition duration-150 ease-in motion-reduce:transition-none"
        leave-to-class="translate-y-1 opacity-0"
      >
        <div
          v-if="open"
          id="jalali-date-picker-popover"
          ref="popover"
          class="fixed z-[200] overflow-y-auto overscroll-contain rounded-3xl shadow-2xl"
          :style="popoverStyle"
          @click.stop
        >
          <JalaliCalendarPanel
            :year="panelYear"
            :month="panelMonth"
            :selected-day="panelDay"
            @update:year="onPanelYear"
            @update:month="onPanelMonth"
            @update:day="onPanelDay"
          />
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
