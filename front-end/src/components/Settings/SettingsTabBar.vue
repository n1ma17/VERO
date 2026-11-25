<script setup lang="ts">
import { ref } from 'vue'
import SettingsCurrencyPanel from '@/components/Settings/SettingsCurrencyPanel.vue'
import SettingsThemePanel from '@/components/Settings/SettingsThemePanel.vue'

type SettingsTab = 'currency' | 'theme'

const tab = ref<SettingsTab>('currency')

const tabClass = (id: SettingsTab) =>
  tab.value === id
    ? 'border-accent text-text'
    : 'border-transparent text-text-muted hover:text-text'
</script>

<template>
  <div class="min-w-0 rounded-3xl border border-text/15 bg-surface p-4 sm:p-6">
    <div
      class="flex gap-6 border-b border-text/15"
      role="tablist"
      aria-label="Settings sections"
    >
      <button
        type="button"
        role="tab"
        :aria-selected="tab === 'currency'"
        class="-mb-px border-b-2 pb-2 text-sm font-semibold transition"
        :class="tabClass('currency')"
        @click="tab = 'currency'"
      >
        Currency
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="tab === 'theme'"
        class="-mb-px border-b-2 pb-2 text-sm font-semibold transition"
        :class="tabClass('theme')"
        @click="tab = 'theme'"
      >
        Theme
      </button>
    </div>

    <div class="mt-6" role="tabpanel">
      <SettingsCurrencyPanel v-if="tab === 'currency'" />
      <SettingsThemePanel v-else />
    </div>
  </div>
</template>