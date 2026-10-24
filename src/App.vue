<script setup lang="ts">
import AppNavbar from '@/components/shared/AppNavbar.vue'
</script>

<template>
  <div class="min-h-screen">
    <AppNavbar />
    <main class="mx-auto max-w-5xl px-4 py-8">
      <RouterView />
    </main>
  </div>
</template>
