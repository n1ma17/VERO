<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import BaseButton from '@/components/shared/BaseButton.vue'
import { useExpenseCategoryCatalog } from '@/composables/useExpenseCategoryCatalog'
import type { ExpenseCategoryColorToken } from '@/utils/expenseCategoryStyles'

const open = defineModel<boolean>({ default: false })

const {
  definitions,
  colorOptions,
  colorLabels,
  categoryMeta,
  addCategory,
  updateCategory,
  removeCategory,
} = useExpenseCategoryCatalog()

const newLabel = ref('')
const newColor = ref<ExpenseCategoryColorToken>('accent')

const editingId = ref<string | null>(null)
const editForm = reactive({ label: '', color: 'accent' as ExpenseCategoryColorToken })

const canAdd = computed(() => newLabel.value.trim().length > 0)

const colorSwatchClasses: Record<ExpenseCategoryColorToken, string> = {
  accent: 'bg-accent',
  text: 'bg-text',
  'stamp-approved': 'bg-stamp-approved',
  'status-paid': 'bg-status-paid',
  'status-unpaid': 'bg-status-unpaid',
  'status-overdue': 'bg-status-overdue',
  'deposit-card-sky': 'bg-deposit-card-sky',
  'deposit-card-mint': 'bg-deposit-card-mint',
  'deposit-card-lilac': 'bg-deposit-card-lilac',
  'deposit-card-rose': 'bg-deposit-card-rose',
  'deposit-card-peach': 'bg-deposit-card-peach',
}

function startEdit(id: string) {
  const row = definitions.value.find((item) => item.id === id)
  if (!row) return
  editingId.value = id
  editForm.label = row.label
  editForm.color = row.color
}

function cancelEdit() {
  editingId.value = null
}

function saveEdit() {
  if (!editingId.value || !editForm.label.trim()) return
  updateCategory(editingId.value, { label: editForm.label, color: editForm.color })
  editingId.value = null
}

function submitNew() {
  if (!canAdd.value) return
  addCategory(newLabel.value, newColor.value)
  newLabel.value = ''
  newColor.value = 'accent'
}

function hideCategory(id: string) {
  updateCategory(id, { hidden: true })
}

function showCategory(id: string) {
  updateCategory(id, { hidden: false })
}

function tryRemove(id: string) {
  removeCategory(id)
}
</script>

<template>
  <div v-if="open" class="rounded-sm border border-text/20 bg-background p-4">
    <div class="flex items-baseline justify-between gap-2">
      <h3 class="text-sm font-semibold uppercase tracking-wider text-text">Your categories</h3>
      <button type="button" class="text-xs text-accent hover:underline" @click="open = false">
        Done
      </button>
    </div>
    <p class="mt-1 text-xs text-text-muted">
      Add, rename, pick a theme color, or hide categories. Hidden ones stay on past expenses.
    </p>

    <ul class="mt-4 space-y-2">
      <li
        v-for="row in definitions"
        :key="row.id"
        class="rounded-sm border border-text/15 p-3"
        :class="row.hidden ? 'opacity-55' : ''"
      >
        <div v-if="editingId === row.id" class="space-y-3">
            <input
              v-model="editForm.label"
              type="text"
              class="w-full rounded-sm border border-text/25 bg-surface px-3 py-2 text-sm text-text outline-none focus:border-accent"
            />
            <div class="flex flex-wrap gap-2">
              <button
                v-for="token in colorOptions"
                :key="token"
                type="button"
                class="size-8 rounded-sm border border-text/20 ring-offset-2 ring-offset-background"
                :class="[
                  colorSwatchClasses[token],
                  editForm.color === token ? 'ring-2 ring-accent' : '',
                ]"
                :title="colorLabels[token]"
                @click="editForm.color = token"
              />
            </div>
            <div class="flex gap-2">
              <BaseButton type="button" class="flex-1" @click="saveEdit">Save</BaseButton>
              <BaseButton type="button" variant="ghost" @click="cancelEdit">Cancel</BaseButton>
            </div>
        </div>
        <div v-else class="flex flex-wrap items-center gap-2">
          <span
            class="flex size-8 shrink-0 items-center justify-center rounded-sm text-xs font-bold"
            :class="categoryMeta(row.id).tile"
          >
            {{ categoryMeta(row.id).label.slice(0, 1) }}
          </span>
          <span class="min-w-0 flex-1 truncate text-sm font-medium">{{ row.label }}</span>
          <span class="w-full text-[10px] uppercase tracking-wider text-text-muted sm:w-auto">
            {{ row.hidden ? 'Hidden' : row.id }}
          </span>
          <div class="flex w-full flex-wrap gap-2 sm:ml-auto sm:w-auto">
            <button type="button" class="text-xs text-accent hover:underline" @click="startEdit(row.id)">
              Edit
            </button>
            <button
              v-if="row.hidden"
              type="button"
              class="text-xs text-text hover:underline"
              @click="showCategory(row.id)"
            >
              Show
            </button>
            <button
              v-else
              type="button"
              class="text-xs text-text hover:underline"
              @click="hideCategory(row.id)"
            >
              Hide
            </button>
            <button
              type="button"
              class="text-xs text-danger hover:underline"
              @click="tryRemove(row.id)"
            >
              Delete
            </button>
          </div>
        </div>
      </li>
    </ul>

    <div class="mt-5 border-t border-dashed border-text/20 pt-4">
      <p class="text-xs font-medium uppercase tracking-wider text-text-muted">New category</p>
      <input
        v-model="newLabel"
        type="text"
        placeholder="e.g. Pet care, Subscriptions"
        class="mt-2 w-full rounded-sm border border-text/25 bg-surface px-3 py-2 text-sm text-text outline-none focus:border-accent"
      />
      <div class="mt-3 flex flex-wrap gap-2">
        <button
          v-for="token in colorOptions"
          :key="token"
          type="button"
          class="size-8 rounded-sm border border-text/20 ring-offset-2 ring-offset-background"
          :class="[colorSwatchClasses[token], newColor === token ? 'ring-2 ring-accent' : '']"
          :title="colorLabels[token]"
          @click="newColor = token"
        />
      </div>
      <BaseButton type="button" class="mt-3 w-full" :disabled="!canAdd" @click="submitNew">
        Add category
      </BaseButton>
    </div>
  </div>
</template>