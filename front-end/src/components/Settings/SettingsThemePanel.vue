<script setup lang="ts">
import type { AppThemeId } from '@/constants/appThemes'
import { useAppTheme } from '@/composables/useAppTheme'

const { themes, themeId, setTheme } = useAppTheme()

function selectTheme(id: AppThemeId): void {
  setTheme(id)
}

function swatchStyle(theme: (typeof themes)[number], role: 'background' | 'text' | 'accent') {
  const hex =
    role === 'background' ? theme.background : role === 'text' ? theme.text : theme.accent
  return { backgroundColor: hex }
}
</script>

<template>
  <section class="space-y-4">
    <p class="text-sm text-text-muted">
      Pick a three-color palette. Accent is reserved for the primary action on each screen.
    </p>

    <ul
      class="grid grid-cols-2 gap-x-2 gap-y-3 min-[22.5rem]:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 sm:gap-3"
    >
      <li v-for="theme in themes" :key="theme.id" class="min-w-0">
        <button
          type="button"
          class="flex h-full w-full min-w-0 cursor-pointer flex-col items-center rounded-[16px] border border-transparent border-t-2 px-1.5 py-2 transition-[border-color,background-color] hover:border-b-[var(--theme-accent)] hover:border-t-[var(--theme-accent)] sm:px-2"
          :style="{ '--theme-accent': theme.accent }"
          :class="themeId === theme.id ? 'bg-accent/10 border-t-[var(--theme-accent)]' : 'bg-surface'"
          :aria-pressed="themeId === theme.id"
          @click="selectTheme(theme.id)"
        >
          <img
            :src="theme.previewSrc"
            :alt="`${theme.name} theme preview`"
            width="100"
            height="100"
            class="mx-auto my-1.5 aspect-square w-full max-w-[6.25rem] shrink-0 rounded-[8px] border border-primary object-cover sm:my-2 lg:max-w-[6.25rem]"
            loading="lazy"
            decoding="async"
          />
          <p class="w-full text-center text-[10px] font-semibold leading-tight text-text sm:text-xs">
            {{ theme.name }}
          </p>
          <ul class="mt-2 flex sm:mt-4" :aria-label="`${theme.name} colors`">
            <li class="text-center">
              <span
                class="mx-[-3px] block size-3 rounded-[50%] border border-white/20 sm:mx-[-4px] sm:size-4"
                :style="swatchStyle(theme, 'background')"
              />
            </li>
            <li class="text-center">
              <span
                class="mx-[-3px] block size-3 rounded-[50%] border border-white/20 sm:mx-[-4px] sm:size-4"
                :style="swatchStyle(theme, 'text')"
              />
            </li>
            <li class="text-center">
              <span
                class="mx-[-3px] block size-3 rounded-[50%] border border-white/20 sm:mx-[-4px] sm:size-4"
                :style="swatchStyle(theme, 'accent')"
              />
            </li>
          </ul>
        </button>
      </li>
    </ul>
  </section>
</template>