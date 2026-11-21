<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import CurrencySwitcher from '@/components/shared/CurrencySwitcher.vue'
import { useAuth } from '@/composables/useAuth'
import { currentJalaliDate, formatJalaliDate, JALALI_WEEKDAY_NAMES, jalaliWeekdayIndex } from '@/utils/jalali'

const router = useRouter()
const { logout, currentUser } = useAuth()

const today = currentJalaliDate()
const todayLabel = computed(
  () =>
    `${JALALI_WEEKDAY_NAMES[jalaliWeekdayIndex(today.year, today.month, today.day)]}, ${formatJalaliDate(today.year, today.month, today.day)}`,
)

async function signOut() {
  await logout()
  await router.replace({ name: 'landing' })
}
</script>

<template>
  <header
    class="sticky top-0 z-40 border-b border-text/20 bg-background pt-[env(safe-area-inset-top)]"
  >
    <div class="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
      <RouterLink
        to="/dashboard"
        class="flex min-w-0 items-baseline gap-2 truncate font-display text-base font-extrabold tracking-tight text-text sm:text-lg"
      >
        <span class="size-2 shrink-0 bg-accent" aria-hidden="true" />
        Money Management
      </RouterLink>
      <div class="flex min-w-0 items-center gap-3">
        <p class="hidden truncate text-xs text-text sm:block sm:text-sm">{{ todayLabel }}</p>
        <CurrencySwitcher />
        <button
          type="button"
          class="inline-flex min-h-11 shrink-0 items-center rounded-full border border-text/30 px-3 text-xs font-medium text-text transition hover:border-text"
          :title="currentUser?.email"
          @click="signOut"
        >
          Sign out
        </button>
      </div>
    </div>
  </header>
</template>
