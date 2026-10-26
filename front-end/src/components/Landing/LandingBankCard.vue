<script setup lang="ts"></script>

<template>
  <div
    class="relative overflow-hidden rounded-2xl bg-primary shadow-[0_32px_56px_-16px] shadow-primary/55"
  >
    <svg
      class="pointer-events-none absolute inset-0 size-full text-background/25"
      viewBox="0 0 400 252"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <g transform="translate(292 8)" stroke="currentColor" stroke-width="0.65">
        <circle r="52" opacity="0.9" />
        <circle r="44" opacity="0.85" />
        <circle r="36" opacity="0.8" />
        <path
          d="M0 -36 L9 -11 L36 0 L9 11 L0 36 L-9 11 L-36 0 L-9 -11 Z"
          opacity="0.75"
        />
        <path
          d="M0 -28 L7 -9 L28 0 L7 9 L0 28 L-7 9 L-28 0 L-7 -9 Z"
          opacity="0.7"
        />
        <path d="M-28 0 H28 M0 -28 V28 M-20 -20 L20 20 M20 -20 L-20 20" opacity="0.55" />
      </g>
      <g transform="translate(-36 118)" stroke="currentColor" stroke-width="0.7">
        <circle r="108" opacity="0.85" />
        <circle r="96" opacity="0.8" />
        <circle r="84" opacity="0.75" />
        <circle r="72" opacity="0.7" />
        <circle r="60" opacity="0.65" />
        <path
          d="M0 -72 L18 -22 L72 0 L18 22 L0 72 L-18 22 L-72 0 L-18 -22 Z"
          opacity="0.6"
        />
        <path
          d="M0 -56 L14 -17 L56 0 L14 17 L0 56 L-14 17 L-56 0 L-14 -17 Z"
          opacity="0.55"
        />
        <path
          d="M0 -40 L10 -12 L40 0 L10 12 L0 40 L-10 12 L-40 0 L-10 -12 Z"
          opacity="0.5"
        />
      </g>
    </svg>

    <div class="relative flex aspect-8/5 flex-col justify-between px-6 py-5 sm:px-7 sm:py-6">
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-center gap-2 text-background">
          <span
            class="grid size-6 place-items-center rounded-sm border border-background/25 bg-background/10"
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
          <span class="text-sm font-medium tracking-wide sm:text-base">money</span>
        </div>
        <p class="text-lg font-bold italic tracking-[0.2em] text-background sm:text-xl">VISA</p>
      </div>

      <div
        class="mt-2 h-8 w-11 rounded-md border border-background/20 bg-linear-to-br from-accent/80 to-accent/40"
        aria-hidden="true"
      />

      <div class="flex items-end justify-between gap-2 text-background">
        <div>
          <p class="text-[10px] uppercase tracking-widest text-background/65">Balance</p>
          <p class="text-lg font-semibold tabular-nums sm:text-xl">12,340,000</p>
        </div>
        <p class="text-[10px] uppercase tracking-[0.35em] text-background/50">Toman</p>
      </div>
    </div>
  </div>
</template>
