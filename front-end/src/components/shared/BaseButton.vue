<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
    type?: 'button' | 'submit'
  }>(),
  { variant: 'primary', type: 'button' },
)

const variantClasses = {
  primary: 'bg-accent text-on-accent hover:bg-accent/90',
  secondary: 'border border-primary/40 bg-surface text-text hover:bg-primary hover:text-background',
  danger: 'bg-danger text-on-accent hover:bg-danger/90',
  ghost: 'text-text-muted hover:bg-danger/15 hover:text-danger',
}

const classes = computed(() => variantClasses[props.variant])
</script>

<template>
  <button
    :type="type"
    class="inline-flex min-h-11 items-center justify-center rounded-sm px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
    :class="classes"
  >
    <slot />
  </button>
</template>
