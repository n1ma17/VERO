<template>
  <div class="relative py-1" aria-hidden="true">
    <span class="absolute top-1/2 size-6 -left-3 -translate-y-1/2 rounded-full bg-background" v-if="!props.left" />
    <span class="absolute top-1/2 size-6 -left-3 -translate-y-1/2 rounded-full bg-background" v-else :class="`-left-${props.left}`" />
    <span class="absolute top-1/2 size-6 -translate-y-1/2 rounded-full bg-background" :class="`-right-${props.right ?? 3}`" />
    <div class="mx-0 w-full border-t-2 border-dashed border-text-muted/30" />
  </div>
</template>
<script setup lang="ts">
const props = defineProps<{
  right?: number
  left?: number
}>()
</script>