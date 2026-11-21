<script setup lang="ts">
import BillLogoImage from '@/components/shared/BillLogoImage.vue'

defineProps<{
  title: string
  logoKey: string | null
}>()
</script>

<template>
  <div class="mt-4 flex items-center justify-start gap-3">
    <BillLogoImage v-if="logoKey" :logo-key="logoKey" size="sm"  />
    <span
      v-else
      class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-background text-base font-bold uppercase text-accent"
      aria-hidden="true"
    >
      {{ title.slice(0, 1) }}
    </span>
    <p class="w-full text-xs truncate text-end font-[400] uppercase leading-snug text-text">
      {{ title }}
    </p>
  </div>
</template>