<script setup lang="ts">
import { useRouter } from 'vue-router'
import LandingBrand from '@/components/Landing/LandingBrand.vue'
import LandingContinueButton from '@/components/Landing/LandingContinueButton.vue'
import LandingHeroVisual from '@/components/Landing/LandingHeroVisual.vue'
import LandingPitch from '@/components/Landing/LandingPitch.vue'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { isAuthenticated } = useAuth()

function onContinue() {
  if (isAuthenticated.value) {
    void router.push({ name: 'dashboard' })
    return
  }
  void router.push({ name: 'login' })
}
</script>

<template>
  <div
    class="relative flex min-h-dvh flex-col overflow-hidden bg-linear-to-b from-landing-hero-top to-landing-hero-bottom text-on-hero"
  >
    <div
      class="pointer-events-none absolute -right-16 top-24 size-56 rounded-full bg-accent/25 blur-3xl"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none absolute -left-20 bottom-40 size-64 rounded-full bg-success/30 blur-3xl"
      aria-hidden="true"
    />

    <div
      class="relative z-10 mx-auto flex w-full min-w-0 max-w-5xl flex-1 flex-col px-4 pb-10 pt-12 sm:pt-14"
    >
      <LandingBrand class="shrink-0" />

      <div class="flex flex-1 flex-col justify-center py-8 sm:py-10">
        <LandingHeroVisual />
      </div>

      <div class="relative z-10 flex shrink-0 items-end justify-between gap-6">
        <LandingPitch class="min-w-0 flex-1 pb-2" />
        <LandingContinueButton @continue="onContinue" />
      </div>
    </div>
  </div>
</template>
