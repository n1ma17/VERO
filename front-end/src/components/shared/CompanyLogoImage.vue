<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { loadCompanyLogo } from '@/composables/useCompanyLogos'

const props = withDefaults(
  defineProps<{
    companyId: string | null
    hasLogo?: boolean
    label?: string
    size?: 'sm' | 'md'
  }>(),
  { hasLogo: true, label: '', size: 'sm' },
)

const src = ref<string | null>(null)

const sizeClasses = {
  sm: 'size-11',
  md: 'size-14',
}

async function refresh() {
  src.value =
    props.companyId && props.hasLogo ? await loadCompanyLogo(props.companyId) : null
}

onMounted(refresh)
watch(() => [props.companyId, props.hasLogo] as const, refresh)
</script>

<template>
  <div
    v-if="src"
    class="flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-primary/20 bg-primary/15"
    :class="sizeClasses[size]"
  >
    <img :src="src" alt="" class="size-full object-contain p-1" />
  </div>
  <span
    v-else
    class="flex shrink-0 items-center justify-center rounded-xl bg-background text-base font-bold uppercase text-accent"
    :class="sizeClasses[size]"
    aria-hidden="true"
  >
    {{ (label || '?').slice(0, 1) }}
  </span>
</template>