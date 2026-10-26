<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppBottomNav from '@/components/shared/AppBottomNav.vue'
import AppNavbar from '@/components/shared/AppNavbar.vue'
import AppToastHost from '@/components/shared/AppToastHost.vue'
import { useAuth } from '@/composables/useAuth'

const route = useRoute()
const { isAuthenticated } = useAuth()

const hideChrome = computed(() => route.meta.hideChrome === true || !isAuthenticated.value)
const fullBleed = computed(() => route.meta.fullBleed === true)
const mainPad = {
  guest: 'mx-auto min-w-0 max-w-5xl px-4 py-5 sm:py-6',
  app:
    'mx-auto min-w-0 max-w-5xl px-4 pt-5 pb-[calc(7.5rem+env(safe-area-inset-bottom))] sm:pt-8 sm:pb-[calc(7.5rem+env(safe-area-inset-bottom))]',
  bleed: 'min-w-0',
} as const
const mainClass = computed(() => {
  if (fullBleed.value) return mainPad.bleed
  return hideChrome.value ? mainPad.guest : mainPad.app
})
</script>

<template>
  <div class="min-h-screen min-w-0 overflow-x-clip">
    <AppToastHost />
    <AppNavbar v-if="!hideChrome" />
    <main :class="mainClass">
      <RouterView />
    </main>
    <AppBottomNav v-if="!hideChrome" />
  </div>
</template>
