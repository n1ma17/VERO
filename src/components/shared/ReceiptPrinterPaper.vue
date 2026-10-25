<script setup lang="ts">
import ReceiptEdge from '@/components/shared/ReceiptEdge.vue'
</script>

<template>
  <article
    class="relative overflow-hidden bg-surface px-6 pb-10 pt-7 font-mono text-sm text-text shadow-lg"
  >
    <slot />
    <ReceiptEdge :teeth="20" />
  </article>
</template>
