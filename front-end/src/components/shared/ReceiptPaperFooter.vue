<script setup lang="ts">
import ReceiptBarcode from '@/components/shared/ReceiptBarcode.vue'

defineProps<{
  status: string
  code: string
  note: string
}>()
</script>

<template>
  <footer>
    <div class="mt-5 border-t border-dashed border-text-muted/60" />
    <div class="mt-4 flex items-baseline justify-between gap-4 text-xs uppercase">
      <span class="font-bold tracking-[0.12em]">{{ status }}</span>
      <span class="tracking-[0.12em]">Ref {{ code }}</span>
    </div>
    <ReceiptBarcode class="mt-3" :code="code" :show-code="false" />
    <p class="mt-3 text-center text-[10px] uppercase tracking-[0.25em]">{{ note }}</p>
  </footer>
</template>
