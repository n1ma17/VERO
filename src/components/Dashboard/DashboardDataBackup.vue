<script setup lang="ts">
import { computed, ref } from 'vue'
import BaseButton from '@/components/shared/BaseButton.vue'
import { useToast } from '@/composables/useToast'
import {
  backupCounts,
  exportAppBackupExcel,
  readAppBackupFile,
  applyAppBackupSnapshot,
  type AppBackupSnapshot,
} from '@/utils/appBackupExcel'

const { showSuccess } = useToast()

const exporting = ref(false)
const importing = ref(false)
const pendingSnapshot = ref<AppBackupSnapshot | null>(null)
const errorMessage = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const pendingSummary = computed(() =>
  pendingSnapshot.value ? backupCounts(pendingSnapshot.value) : null,
)

async function exportExcel() {
  errorMessage.value = null
  exporting.value = true
  try {
    const counts = await exportAppBackupExcel()
    showSuccess(
      `Exported ${counts.bills} bill(s), ${counts.deposits} deposit(s), ${counts.expenses} expense(s).`,
    )
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Export failed.'
  } finally {
    exporting.value = false
  }
}

function openImportPicker() {
  errorMessage.value = null
  pendingSnapshot.value = null
  fileInput.value?.click()
}

async function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  importing.value = true
  errorMessage.value = null
  try {
    pendingSnapshot.value = await readAppBackupFile(file)
  } catch (error) {
    pendingSnapshot.value = null
    errorMessage.value = error instanceof Error ? error.message : 'Could not read this file.'
  } finally {
    importing.value = false
  }
}

function cancelImport() {
  pendingSnapshot.value = null
}

async function confirmImport() {
  if (!pendingSnapshot.value) return
  importing.value = true
  errorMessage.value = null
  try {
    await applyAppBackupSnapshot(pendingSnapshot.value)
    showSuccess('Backup restored. Reloading…')
    window.setTimeout(() => window.location.reload(), 600)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Import failed.'
    importing.value = false
  }
}
</script>

<template>
  <section
    class="min-w-0 animate-fade-up overflow-hidden rounded-3xl bg-surface p-4 text-text shadow-lg [animation-delay:540ms] motion-reduce:animate-none sm:p-6"
  >
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 class="text-lg font-semibold">Backup &amp; restore</h2>
        <p class="mt-0.5 max-w-xl text-sm text-text-muted">
          Export everything on this device to Excel — bills, deposits, expenses, paid installments,
          and bill logos. Import a file to replace local data after a loss.
        </p>
      </div>
      <div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
        <BaseButton type="button" class="w-full sm:w-auto" :disabled="exporting || importing" @click="exportExcel">
          {{ exporting ? 'Exporting…' : 'Export Excel' }}
        </BaseButton>
        <BaseButton
          type="button"
          variant="ghost"
          class="w-full sm:w-auto"
          :disabled="exporting || importing"
          @click="openImportPicker"
        >
          {{ importing && !pendingSnapshot ? 'Reading…' : 'Import Excel' }}
        </BaseButton>
        <input
          ref="fileInput"
          type="file"
          accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          class="hidden"
          @change="onFileSelected"
        />
      </div>
    </div>

    <p v-if="errorMessage" class="mt-4 rounded-2xl bg-danger/15 px-4 py-3 text-sm text-danger">
      {{ errorMessage }}
    </p>

    <div
      v-if="pendingSummary"
      class="mt-4 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-4 text-sm"
    >
      <p class="font-semibold">Replace all data on this device?</p>
      <p class="mt-1 text-text-muted">
        This file contains
        {{ pendingSummary.bills }} bill(s), {{ pendingSummary.deposits }} deposit(s),
        {{ pendingSummary.expenses }} expense(s), {{ pendingSummary.payments }} payment flag(s),
        and {{ pendingSummary.logos }} logo(s).
      </p>
      <div class="mt-4 flex flex-wrap gap-2">
        <BaseButton type="button" variant="danger" :disabled="importing" @click="confirmImport">
          {{ importing ? 'Restoring…' : 'Replace & restore' }}
        </BaseButton>
        <BaseButton type="button" variant="ghost" :disabled="importing" @click="cancelImport">
          Cancel
        </BaseButton>
      </div>
    </div>
  </section>
</template>
