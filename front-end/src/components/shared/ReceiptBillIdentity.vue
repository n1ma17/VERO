<script setup lang="ts">
import CompanyLogoImage from '@/components/shared/CompanyLogoImage.vue'
import { OTHERS_COMPANY_LABEL } from '@/types/company'

withDefaults(
  defineProps<{
    title: string
    companyName?: string | null
    logoKey?: string | null
  }>(),
  { companyName: null, logoKey: null },
)
</script>

<template>
  <div class="mt-4 flex items-center justify-start gap-3">
    <CompanyLogoImage
      :company-id="logoKey"
      :has-logo="Boolean(logoKey)"
      :label="companyName || OTHERS_COMPANY_LABEL"
      size="sm"
    />
    <div class="min-w-0 flex-1 text-end">
      <p
        v-if="companyName"
        class="truncate text-[10px] font-medium uppercase tracking-[0.12em] text-text-muted"
      >
        {{ companyName }}
      </p>
      <p class="truncate text-xs font-[400] uppercase leading-snug text-text">
        {{ title }}
      </p>
    </div>
  </div>
</template>