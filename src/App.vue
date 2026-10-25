<script setup lang="ts">
import AppBottomNav from '@/components/shared/AppBottomNav.vue'
import AppNavbar from '@/components/shared/AppNavbar.vue'
import AppToastHost from '@/components/shared/AppToastHost.vue'
</script>

<template>
  <div class="min-h-screen min-w-0 overflow-x-clip">
    <AppToastHost />
    <AppNavbar />
    <main class="mx-auto min-w-0 max-w-5xl px-4 py-8 pb-28">
      <RouterView />
    </main>
    <AppBottomNav />
  </div>
</template>
