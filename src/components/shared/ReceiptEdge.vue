<script setup lang="ts">
withDefaults(
  defineProps<{
    teeth?: number
  }>(),
  { teeth: 16 },
)
</script>

<template>
  <div class="absolute inset-x-0 -bottom-2 flex justify-between px-1" aria-hidden="true">
    <span v-for="n in teeth" :key="n" class="size-4 shrink-0 rounded-full bg-background" />
  </div>
</template>
