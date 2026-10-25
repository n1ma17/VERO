<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { loadBillLogo } from '@/composables/useBillLogos'

const props = withDefaults(
  defineProps<{
    logoKey: string | null
    size?: 'sm' | 'md'
  }>(),
  { size: 'sm' },
)

const src = ref<string | null>(null)

const sizeClasses = {
  sm: 'size-11',
  md: 'size-14',
}

async function refresh() {
  src.value = props.logoKey ? await loadBillLogo(props.logoKey) : null
}

onMounted(refresh)
watch(() => props.logoKey, refresh)
</script>

<template>
  <div
    v-if="src"
    class="flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-primary/20 bg-primary/15"
    :class="sizeClasses[size]"
  >
    <img :src="src" alt="" class="size-full object-contain p-1" />
  </div>
</template>
