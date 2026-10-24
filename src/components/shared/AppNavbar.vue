<script setup lang="ts">
const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/transactions', label: 'Transactions' },
]
</script>

<template>
  <header class="border-b border-border bg-surface">
    <nav class="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
      <RouterLink to="/" class="text-lg font-bold text-primary">Money Management</RouterLink>
      <ul class="flex gap-2">
        <li v-for="link in links" :key="link.to">
          <RouterLink
            :to="link.to"
            class="rounded-lg px-3 py-2 text-sm font-medium text-content-muted transition hover:bg-primary-soft hover:text-primary"
            exact-active-class="bg-primary-soft text-primary"
          >
            {{ link.label }}
          </RouterLink>
        </li>
      </ul>
    </nav>
  </header>
</template>
