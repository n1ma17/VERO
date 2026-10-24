<script setup lang="ts">
import { computed } from 'vue'
import BaseButton from '@/components/shared/BaseButton.vue'
import type { Transaction } from '@/types/transaction'
import { formatAmount } from '@/utils/formatAmount'

const props = defineProps<{
  transaction: Transaction
  removable?: boolean
}>()

const emit = defineEmits<{
  remove: [id: string]
}>()

const isIncome = computed(() => props.transaction.type === 'income')
const signedAmount = computed(
  () => `${isIncome.value ? '+' : '-'}${formatAmount(props.transaction.amount)}`,
)
const formattedDate = computed(() => new Date(props.transaction.date).toLocaleDateString())
</script>

<template>
  <li class="flex items-center justify-between gap-4 py-3">
    <div>
      <p class="font-medium">{{ transaction.title }}</p>
      <p class="text-xs text-content-muted">{{ formattedDate }}</p>
    </div>
    <div class="flex items-center gap-2">
      <span class="font-semibold" :class="isIncome ? 'text-success' : 'text-danger'">
        {{ signedAmount }}
      </span>
      <BaseButton v-if="removable" variant="ghost" @click="emit('remove', transaction.id)">
        Remove
      </BaseButton>
    </div>
  </li>
</template>
