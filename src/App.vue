<script setup lang="ts">
import AppBottomNav from '@/components/shared/AppBottomNav.vue'
import AppNavbar from '@/components/shared/AppNavbar.vue'
import AppToastHost from '@/components/shared/AppToastHost.vue'
</script>

<template>
  <div class="min-h-screen">
    <AppToastHost />
    <AppNavbar />
    <main class="mx-auto max-w-5xl px-4 py-8 pb-36">
      <RouterView />
    </main>
    <AppBottomNav />
  </div>
</template>
