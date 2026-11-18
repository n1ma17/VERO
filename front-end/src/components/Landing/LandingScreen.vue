<script setup lang="ts">
import { useRouter } from 'vue-router'
import LandingBrand from '@/components/Landing/LandingBrand.vue'
import LandingContinueButton from '@/components/Landing/LandingContinueButton.vue'
import LandingFeatures from '@/components/Landing/LandingFeatures.vue'
import LandingFooter from '@/components/Landing/LandingFooter.vue'
import LandingPitch from '@/components/Landing/LandingPitch.vue'
import LandingProductPreview from '@/components/Landing/LandingProductPreview.vue'
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
  <div class="min-h-dvh bg-background text-text">
    <div
      class="mx-auto w-full min-w-0 max-w-6xl px-4 pb-[max(2rem,calc(env(safe-area-inset-bottom)+1rem))] pt-[max(1.25rem,calc(env(safe-area-inset-top)+0.75rem))] sm:px-6"
    >
      <LandingBrand />

      <LandingPitch class="mt-16 sm:mt-24" />

      <div class="mt-10 grid grid-cols-12 gap-x-6">
        <LandingContinueButton
          class="col-span-12 sm:col-span-6 lg:col-span-4"
          @continue="onContinue"
        />
      </div>

      <LandingProductPreview class="mt-20 sm:mt-28" />

      <LandingFeatures class="mt-20 sm:mt-28" />

      <LandingFooter class="mt-20 sm:mt-28" />
    </div>
  </div>
</template>
