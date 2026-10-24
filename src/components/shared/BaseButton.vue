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
  primary: 'bg-primary text-on-primary hover:bg-primary-hover',
  danger: 'bg-danger text-on-primary hover:bg-danger-hover',
  ghost: 'text-content-muted hover:bg-danger-soft hover:text-danger',
}

const classes = computed(() => variantClasses[props.variant])
</script>

<template>
  <button
    :type="type"
    class="rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
    :class="classes"
  >
    <slot />
  </button>
</template>
