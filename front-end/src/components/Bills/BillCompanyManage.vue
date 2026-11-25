<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import BaseButton from '@/components/shared/BaseButton.vue'
import CompanyLogoImage from '@/components/shared/CompanyLogoImage.vue'
import { ApiError } from '@/api/http'
import { useCompanies } from '@/composables/useCompanies'
import { readImageAsDataUrl } from '@/utils/readImageFile'

const open = defineModel<boolean>({ default: false })

const { companies, isCompanyNameTaken, addCompany, updateCompany, removeCompany } =
  useCompanies()

const newName = ref('')
const newLogo = ref<string | null>(null)
const editingId = ref<string | null>(null)
const editForm = reactive({ name: '', logoUrl: null as string | null | undefined })
const logoError = ref('')
const nameError = ref('')
const confirmingDelete = ref<string | null>(null)

const canAdd = computed(() => newName.value.trim().length > 0)

async function onNewLogo(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  logoError.value = ''
  try {
    newLogo.value = await readImageAsDataUrl(file)
  } catch (err) {
    logoError.value = err instanceof Error ? err.message : 'Upload failed.'
  }
}

async function onEditLogo(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  logoError.value = ''
  try {
    editForm.logoUrl = await readImageAsDataUrl(file)
  } catch (err) {
    logoError.value = err instanceof Error ? err.message : 'Upload failed.'
  }
}

function startEdit(id: string) {
  const row = companies.value.find((item) => item.id === id)
  if (!row) return
  editingId.value = id
  confirmingDelete.value = null
  editForm.name = row.name
  editForm.logoUrl = undefined
}

function cancelEdit() {
  editingId.value = null
  editForm.logoUrl = undefined
}

function readNameConflict(err: unknown): string | null {
  if (err instanceof ApiError && err.status === 409) {
    return err.message || 'A company with this name already exists.'
  }
  return null
}

async function saveEdit() {
  if (!editingId.value || !editForm.name.trim()) return
  nameError.value = ''
  if (isCompanyNameTaken(editForm.name, editingId.value)) {
    nameError.value = 'You already have a company with this name.'
    return
  }
  try {
    await updateCompany(editingId.value, {
      name: editForm.name,
      logoUrl: editForm.logoUrl,
    })
    editingId.value = null
  } catch (err) {
    const conflict = readNameConflict(err)
    if (conflict) nameError.value = conflict
    else throw err
  }
}

async function submitNew() {
  if (!canAdd.value) return
  nameError.value = ''
  if (isCompanyNameTaken(newName.value)) {
    nameError.value = 'You already have a company with this name.'
    return
  }
  try {
    await addCompany({ name: newName.value, logoUrl: newLogo.value })
    newName.value = ''
    newLogo.value = null
  } catch (err) {
    const conflict = readNameConflict(err)
    if (conflict) nameError.value = conflict
    else throw err
  }
}

async function tryRemove(id: string) {
  if (confirmingDelete.value !== id) {
    confirmingDelete.value = id
    return
  }
  await removeCompany(id)
  confirmingDelete.value = null
  if (editingId.value === id) editingId.value = null
}
</script>

<template>
  <div v-if="open" class="rounded-sm border border-text/20 bg-background p-4">
    <div class="flex items-baseline justify-between gap-2">
      <h3 class="text-sm font-semibold uppercase tracking-wider text-text">Companies</h3>
      <button type="button" class="text-xs text-accent hover:underline" @click="open = false">
        Done
      </button>
    </div>
    <p class="mt-1 text-xs text-text-muted">
      Add a name and optional logo. Bills can pick one, or stay as Others.
    </p>

    <ul class="mt-4 space-y-2">
      <li
        v-for="row in companies"
        :key="row.id"
        class="rounded-sm border border-text/15 p-3"
      >
        <div v-if="editingId === row.id" class="space-y-3">
          <input
            v-model="editForm.name"
            type="text"
            class="w-full rounded-sm border border-text/20 bg-surface px-3 py-2 text-sm text-text outline-none focus:border-accent"
            placeholder="Company name"
          />
          <div class="flex items-center gap-3">
            <CompanyLogoImage
              :company-id="row.id"
              :has-logo="editForm.logoUrl !== null && (editForm.logoUrl ? true : row.hasLogo)"
              :label="editForm.name || row.name"
            />
            <img
              v-if="editForm.logoUrl"
              :src="editForm.logoUrl"
              alt=""
              class="size-11 rounded-xl object-contain"
            />
            <label class="cursor-pointer text-xs font-medium text-accent hover:underline">
              Change logo
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="hidden" @change="onEditLogo" />
            </label>
            <button
              type="button"
              class="text-xs text-text-muted hover:underline"
              @click="editForm.logoUrl = null"
            >
              Remove logo
            </button>
          </div>
          <div class="flex flex-wrap gap-2">
            <BaseButton type="button" class="min-h-10" @click="saveEdit">Save</BaseButton>
            <BaseButton type="button" variant="ghost" class="min-h-10" @click="cancelEdit">
              Cancel
            </BaseButton>
          </div>
        </div>
        <div v-else class="flex items-center gap-3">
          <CompanyLogoImage
            :company-id="row.id"
            :has-logo="row.hasLogo"
            :label="row.name"
          />
          <p class="min-w-0 flex-1 truncate text-sm font-medium text-text">{{ row.name }}</p>
          <button type="button" class="text-xs text-accent hover:underline" @click="startEdit(row.id)">
            Edit
          </button>
          <button
            type="button"
            class="text-xs hover:underline"
            :class="confirmingDelete === row.id ? 'text-danger' : 'text-text-muted'"
            @click="tryRemove(row.id)"
          >
            {{ confirmingDelete === row.id ? 'Confirm delete' : 'Delete' }}
          </button>
        </div>
      </li>
    </ul>

    <div class="mt-4 space-y-3 border-t border-text/15 pt-4">
      <p class="text-xs font-semibold uppercase tracking-wider text-text-muted">New company</p>
      <input
        v-model="newName"
        type="text"
        class="w-full rounded-sm border border-text/20 bg-surface px-3 py-2 text-sm text-text outline-none focus:border-accent"
        placeholder="Company name"
      />
      <div class="flex items-center gap-3">
        <img
          v-if="newLogo"
          :src="newLogo"
          alt=""
          class="size-11 rounded-xl border border-text/20 object-contain"
        />
        <label class="cursor-pointer text-xs font-medium text-accent hover:underline">
          {{ newLogo ? 'Change logo' : 'Add logo' }}
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="hidden" @change="onNewLogo" />
        </label>
        <button
          v-if="newLogo"
          type="button"
          class="text-xs text-text-muted hover:underline"
          @click="newLogo = null"
        >
          Clear
        </button>
      </div>
      <p v-if="nameError" class="text-xs text-danger">{{ nameError }}</p>
      <p v-if="logoError" class="text-xs text-danger">{{ logoError }}</p>
      <BaseButton type="button" class="w-full min-h-10" :disabled="!canAdd" @click="submitNew">
        Add company
      </BaseButton>
    </div>
  </div>
</template>
