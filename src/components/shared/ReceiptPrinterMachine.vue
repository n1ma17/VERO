<template>
  <div
    class="relative isolate w-full overflow-hidden rounded-3xl border border-printer-edge bg-printer p-3 pb-8 shadow-2xl"
  >
    <div aria-hidden="true" class="absolute inset-x-6 top-0 h-px bg-content/15" />
    <slot />
    <div
      aria-hidden="true"
      class="absolute inset-x-6 bottom-3 z-40 h-2 rounded border border-printer-slot bg-printer-slot shadow-inner"
    />
  </div>
</template>
