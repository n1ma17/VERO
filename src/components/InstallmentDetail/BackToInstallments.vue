<template>
  <RouterLink
    :to="{ name: 'installments' }"
    class="inline-flex items-center gap-2 text-sm font-medium text-content-muted transition hover:text-content"
  >
    <span aria-hidden="true">←</span>
    All installments
  </RouterLink>
</template>
