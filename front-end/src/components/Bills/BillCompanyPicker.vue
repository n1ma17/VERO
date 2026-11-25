<script setup lang="ts">
import { ref } from 'vue'
import BillCompanyManage from '@/components/Bills/BillCompanyManage.vue'
import CompanyLogoImage from '@/components/shared/CompanyLogoImage.vue'
import { useCompanies } from '@/composables/useCompanies'
import { OTHERS_COMPANY_LABEL } from '@/types/company'

const companyId = defineModel<string | null>({ required: true })

const { companies } = useCompanies()
const manageOpen = ref(false)

const chipClasses = {
  active: 'border-transparent ring-2 ring-accent ring-offset-1 ring-offset-surface',
  idle: 'border-text/20 hover:border-accent',
} as const

function selectOthers() {
  companyId.value = null
}

function selectCompany(id: string) {
  companyId.value = id
}
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-baseline justify-between gap-2">
      <label class="block text-xs text-text-muted">Company</label>
      <button
        type="button"
        class="text-xs font-medium text-accent hover:underline"
        @click="manageOpen = !manageOpen"
      >
        {{ manageOpen ? 'Hide manage' : 'Manage companies' }}
      </button>
    </div>

    <BillCompanyManage v-model="manageOpen" />

    <p v-if="!companies.length" class="text-xs text-text-muted">
      No saved companies yet — choose Others or open Manage to add one.
    </p>

    <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
      <button
        type="button"
        class="flex min-h-11 items-center gap-2 rounded-sm border px-2.5 py-2 text-left text-xs font-medium transition"
        :class="companyId === null ? chipClasses.active : chipClasses.idle"
        :aria-pressed="companyId === null"
        @click="selectOthers"
      >
        <span
          class="flex size-6 shrink-0 items-center justify-center rounded-sm bg-background text-[11px] font-bold text-accent"
        >
          O
        </span>
        <span class="truncate">{{ OTHERS_COMPANY_LABEL }}</span>
      </button>

      <button
        v-for="row in companies"
        :key="row.id"
        type="button"
        class="flex min-h-11 items-center gap-2 rounded-sm border px-2.5 py-2 text-left text-xs font-medium transition"
        :class="companyId === row.id ? chipClasses.active : chipClasses.idle"
        :aria-pressed="companyId === row.id"
        @click="selectCompany(row.id)"
      >
        <CompanyLogoImage
          :company-id="row.id"
          :has-logo="row.hasLogo"
          :label="row.name"
          class="!size-6 !rounded-sm"
        />
        <span class="truncate">{{ row.name }}</span>
      </button>
    </div>
  </div>
</template>