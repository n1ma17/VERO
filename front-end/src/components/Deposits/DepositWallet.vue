<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import BaseButton from '@/components/shared/BaseButton.vue'
import DepositCard from '@/components/Deposits/DepositCard.vue'
import { useBankDeposits } from '@/composables/useBankDeposits'
import { useToast } from '@/composables/useToast'
import type { BankDeposit } from '@/types/bankDeposit'
import { formatMoney } from '@/utils/formatMoney'

const {
  depositsInViewMonth,
  monthTotal,
  viewMonth,
  editingDepositId,
  startEditingDeposit,
  cancelEditingDeposit,
  removeDeposit,
} = useBankDeposits()
const { showSuccess } = useToast()

const tones = ['sky', 'mint', 'peach', 'lilac', 'rose'] as const

type WalletEntry = { deposit: BankDeposit; tone: (typeof tones)[number] }

const selectedId = ref<string | null>(null)
const confirmingDeleteId = ref<string | null>(null)
const balanceHidden = ref(false)

const entries = computed<WalletEntry[]>(() =>
  depositsInViewMonth.value.map((deposit, index) => ({ deposit, tone: tones[index % tones.length]! })),
)

const lifted = computed(() => entries.value.find((entry) => entry.deposit.id === selectedId.value))

const ordered = computed(() => {
  if (!lifted.value) return entries.value
  return [lifted.value, ...entries.value.filter((entry) => entry !== lifted.value)]
})

const pocketIsEmpty = computed(() => Boolean(lifted.value) && ordered.value.length === 1)

watch(viewMonth, () => {
  selectedId.value = null
})

watch(selectedId, () => {
  confirmingDeleteId.value = null
})

function toggle(id: string) {
  selectedId.value = selectedId.value === id ? null : id
}

function isLifted(id: string) {
  return lifted.value?.deposit.id === id
}

function toggleEditing(id: string) {
  confirmingDeleteId.value = null
  if (editingDepositId.value === id) cancelEditingDeposit()
  else startEditingDeposit(id)
}

async function remove(id: string) {
  if (confirmingDeleteId.value !== id) {
    confirmingDeleteId.value = id
    return
  }
  await removeDeposit(id)
  selectedId.value = null
  showSuccess('Deposit removed.')
}
</script>

<template>
  <div class="deposit-pocket">
    <TransitionGroup
      tag="ul"
      class="deposit-pocket__stack"
      move-class="transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
      enter-active-class="transition duration-500 ease-out"
      enter-from-class="opacity-0"
      leave-active-class="transition duration-300 ease-in"
      leave-to-class="opacity-0"
    >
      <li
        v-for="(entry, index) in ordered"
        :key="entry.deposit.id"
        class="deposit-pocket__item"
        :class="{
          'deposit-pocket__item--lifted': isLifted(entry.deposit.id),
          'deposit-pocket__item--after-lifted': lifted && index === 1,
        }"
      >
        <button
          type="button"
          class="deposit-pocket__card block w-full cursor-pointer rounded-[1rem] text-left outline-none focus-visible:ring-2 focus-visible:ring-accent"
          :aria-pressed="isLifted(entry.deposit.id)"
          @click="toggle(entry.deposit.id)"
        >
          <DepositCard
            :deposit="entry.deposit"
            :tone="entry.tone"
            :editing="editingDepositId === entry.deposit.id"
          />
        </button>

        <div v-if="isLifted(entry.deposit.id)" class="flex gap-2 pt-3">
          <BaseButton variant="secondary" class="flex-1" @click="toggleEditing(entry.deposit.id)">
            {{ editingDepositId === entry.deposit.id ? 'Cancel edit' : 'Edit' }}
          </BaseButton>
          <BaseButton
            :variant="confirmingDeleteId === entry.deposit.id ? 'danger' : 'secondary'"
            class="flex-1"
            @click="remove(entry.deposit.id)"
          >
            {{ confirmingDeleteId === entry.deposit.id ? 'Tap again to delete' : 'Delete' }}
          </BaseButton>
        </div>
      </li>
    </TransitionGroup>

    <div class="deposit-pocket__body" :class="{ 'deposit-pocket__body--empty': pocketIsEmpty }">
      <div class="deposit-pocket__back" aria-hidden="true" />
      <div class="deposit-pocket__front">
        <svg
          class="absolute inset-0 size-full"
          viewBox="0 0 400 180"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            class="fill-deposit-wallet"
            d="M0 12 Q0 0 12 0 Q200 28 388 0 Q400 0 400 12 L400 148 Q400 180 368 180 L32 180 Q0 180 0 148 Z"
          />
          <path
            class="stroke-deposit-wallet-stitch"
            fill="none"
            stroke-width="1.5"
            stroke-dasharray="5 4"
            vector-effect="non-scaling-stroke"
            d="M14 22 Q14 14 24 14 Q200 40 376 14 Q386 14 386 22 L386 146 Q386 166 366 166 L34 166 Q14 166 14 146 Z"
          />
        </svg>

        <div class="relative flex flex-col items-center pt-11 text-center">
          <p class="font-display text-3xl leading-none font-bold text-on-paper tabular-nums">
            {{ balanceHidden ? '••••••••' : formatMoney(monthTotal) }}
          </p>
          <p class="mt-2.5 text-sm text-on-paper/70">Total Balance</p>
          <button
            type="button"
            class="mt-4 grid size-8 place-items-center text-deposit-wallet-eye"
            :aria-pressed="balanceHidden"
            :aria-label="balanceHidden ? 'Show balance' : 'Hide balance'"
            @click="balanceHidden = !balanceHidden"
          >
            <svg viewBox="0 0 24 24" class="size-5" fill="none" aria-hidden="true">
              <path
                d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linejoin="round"
              />
              <circle cx="12" cy="12" r="2.6" stroke="currentColor" stroke-width="1.8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
