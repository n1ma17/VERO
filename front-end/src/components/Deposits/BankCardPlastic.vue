<script setup lang="ts">
import BankCardMandala from '@/components/Deposits/BankCardMandala.vue'
</script>

<template>
  <div
    class="bank-card-scene relative mx-auto w-full max-w-[22rem] sm:max-w-md md:max-w-lg lg:max-w-xl"
    aria-hidden="true"
  >
    <div class="bank-card-plate relative overflow-hidden rounded-2xl bg-primary">
      <div class="absolute inset-x-0 top-0 h-1/2 bg-linear-to-b from-primary to-primary" />

      <BankCardMandala ink-class="text-background/25" />

      <div class="relative flex aspect-8/5 flex-col justify-between px-5 py-5 sm:px-8 sm:py-6">
        <div class="flex items-center gap-2 text-foreground">
          <span
            class="grid size-6 place-items-center rounded-sm border border-foreground/25 bg-foreground/10"
          >
            <svg class="size-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M3 12 6 4 9 9 11 6 13 12"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </span>
          <span class="text-base font-medium tracking-wide">money</span>
        </div>

        <p class="self-end text-xl font-bold italic tracking-[0.2em] text-foreground">VISA</p>
      </div>

      <div class="bank-card-plate__edge" />
    </div>
  </div>
</template>