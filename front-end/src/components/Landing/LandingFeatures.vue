<script setup lang="ts">
const features = [
  {
    index: '01',
    title: 'Bills turn into installments',
    body: 'Enter a bill once with its due day and length. Each month shows up on its own, marked paid or overdue.',
  },
  {
    index: '02',
    title: 'Deposits count where they belong',
    body: 'Book a deposit to the month it pays for, not the day it arrived. The balance follows.',
  },
  {
    index: '03',
    title: 'Every payment prints a receipt',
    body: 'Paying a bill or logging a purchase prints a receipt you can open again later.',
  },
] as const
</script>

<template>
  <section class="grid grid-cols-12 gap-x-6 gap-y-10">
    <article
      v-for="feature in features"
      :key="feature.index"
      class="col-span-12 border-t border-text/30 pt-5 sm:col-span-6 lg:col-span-4"
    >
      <p class="text-xs tabular-nums tracking-[0.18em]">{{ feature.index }}</p>
      <h2 class="mt-6 font-display text-2xl font-extrabold leading-tight tracking-tight">
        {{ feature.title }}
      </h2>
      <p class="mt-3 text-sm leading-relaxed">{{ feature.body }}</p>
    </article>
  </section>
</template>
