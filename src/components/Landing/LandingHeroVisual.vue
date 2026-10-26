<script setup lang="ts">
import LandingBankCard from '@/components/Landing/LandingBankCard.vue'
</script>

<template>
  <div class="relative mx-auto w-full max-w-[18.5rem] px-3 py-2 sm:max-w-md sm:px-0" aria-hidden="true">
    <div
      class="pointer-events-none absolute inset-x-10 bottom-2 h-14 rounded-full bg-primary/45 blur-2xl"
    />

    <div
      class="relative z-0 ml-[12%] w-[70%] animate-landing-float [animation-delay:140ms] motion-reduce:animate-none"
    >
      <div class="-rotate-3 overflow-hidden rounded-2xl bg-surface text-text shadow-[0_28px_48px_-20px] shadow-primary/50 sm:-rotate-6">
        <div class="h-1.5 bg-accent" />
        <div class="px-5 py-4">
          <p class="font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted">Upcoming</p>
          <p class="mt-1 text-base font-semibold">Rent installment</p>
          <p class="mt-2 text-2xl font-bold tabular-nums">
            4,500,000 <span class="text-sm font-medium text-text-muted">Toman</span>
          </p>
          <div class="mt-3 flex gap-1">
            <span class="h-1 flex-1 rounded-full bg-success/30" />
            <span class="h-1 w-8 rounded-full bg-success" />
          </div>
        </div>
      </div>
    </div>

    <div
      class="relative z-10 -mt-[38%] mr-[4%] ml-auto w-[80%] animate-landing-float motion-reduce:animate-none sm:mr-0 sm:w-[84%]"
    >
      <div class="rotate-[6deg] sm:rotate-[8deg]">
        <LandingBankCard />
      </div>
    </div>
  </div>
</template>
