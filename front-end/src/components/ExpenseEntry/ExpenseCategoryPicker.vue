<script setup lang="ts">
import { useExpenseCategoryCatalog } from '@/composables/useExpenseCategoryCatalog'

const categoryId = defineModel<string>({ required: true })

const { visibleCategories, categoryMeta } = useExpenseCategoryCatalog()

const chipClasses = {
  active: 'border-transparent ring-2 ring-accent ring-offset-1 ring-offset-surface',
  idle: 'border-text/20 hover:border-accent',
} as const
</script>

<template>
  <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
    <button
      v-for="row in visibleCategories"
      :key="row.id"
      type="button"
      class="flex min-h-11 items-center gap-2 rounded-sm border px-2.5 py-2 text-left text-xs font-medium transition disabled:opacity-50"
      :class="categoryId === row.id ? chipClasses.active : chipClasses.idle"
      :aria-pressed="categoryId === row.id"
      @click="categoryId = row.id"
    >
      <span
        class="flex size-6 shrink-0 items-center justify-center rounded-sm text-[11px] font-bold"
        :class="categoryMeta(row.id).tile"
      >
        {{ categoryMeta(row.id).label.slice(0, 1) }}
      </span>
      <span class="truncate">{{ categoryMeta(row.id).label }}</span>
    </button>
  </div>
</template>