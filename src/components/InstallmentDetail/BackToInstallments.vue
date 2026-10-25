<template>
  <RouterLink
    :to="{ name: 'installments' }"
    class="inline-flex items-center gap-2 text-sm font-medium text-text-muted transition hover:text-text"
  >
    <span aria-hidden="true">←</span>
    All installments
  </RouterLink>
</template>
