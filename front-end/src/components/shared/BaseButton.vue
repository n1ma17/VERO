<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'danger' | 'ghost'
    type?: 'button' | 'submit'
  }>(),
  { variant: 'primary', type: 'button' },
)

const variantClasses = {
  primary: 'bg-surface text-text hover:bg-accent',
  danger: 'bg-danger text-background hover:bg-danger',
  ghost: 'text-text-muted hover:bg-danger/15 hover:text-danger',
}

const classes = computed(() => variantClasses[props.variant])
</script>

<template>
  <button
    :type="type"
    class="inline-flex min-h-11 items-center justify-center rounded-[16px] px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
    :class="classes"
  >
    <slot />
  </button>
</template>
