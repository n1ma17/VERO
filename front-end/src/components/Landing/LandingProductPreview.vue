<script setup lang="ts">
import LandingPreviewBalance from '@/components/Landing/LandingPreviewBalance.vue'
import LandingPreviewStatement from '@/components/Landing/LandingPreviewStatement.vue'
</script>

<template>
  <figure>
    <figcaption class="flex items-baseline gap-2 text-xs uppercase tracking-[0.18em]">
      <span class="size-1.5 shrink-0 bg-accent" aria-hidden="true" />
      Dashboard and statement, Aban 1405
    </figcaption>

    <div class="mt-4 border-y-2 border-text">
      <div
        class="grid grid-cols-12 items-center gap-x-6 border-b border-text/20 py-3 text-xs sm:text-sm"
      >
        <p class="col-span-6 font-display font-extrabold tracking-tight sm:col-span-4">
          OUVINA
        </p>
        <p class="col-span-6 text-right sm:col-span-4 sm:text-left">Wed, 27 Aban 1405</p>
        <div class="hidden sm:col-span-4 sm:flex sm:justify-end">
          <span class="rounded-full border border-text/30 px-3 py-1">Sign out</span>
        </div>
      </div>

      <div class="grid grid-cols-12 gap-x-6 gap-y-12 py-10 sm:py-12">
        <LandingPreviewBalance class="col-span-12 lg:col-span-5" />
        <LandingPreviewStatement class="col-span-12 lg:col-span-7" />
      </div>
    </div>
  </figure>
</template>
