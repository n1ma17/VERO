<script setup lang="ts">
import type { AppNavIconName } from '@/utils/appNav'

defineProps<{
  name: AppNavIconName
}>()
</script>

<template>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.75"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path
      v-if="name === 'home'"
      d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
    />
    <g v-else-if="name === 'ledger'">
      <path d="M4 20h16M7 16v-5M12 16V7M17 16v-3" />
    </g>
    <g v-else-if="name === 'deposits'">
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10h18M7 15h4" />
    </g>
    <g v-else-if="name === 'bills'">
      <path d="M7 3h7l4 4v14H7V3Z" />
      <path d="M14 3v4h4M10 12h5M10 16h3" />
    </g>
    <g v-else-if="name === 'installments'">
      <rect x="4" y="5" width="16" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M4 11h16" />
    </g>
    <g v-else>
      <path d="M3 4h2l2.4 10.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.2" />
      <circle cx="10" cy="20" r="1" />
      <circle cx="17" cy="20" r="1" />
    </g>
  </svg>
</template>
