<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { currentJalaliDate, formatJalaliDate, JALALI_WEEKDAY_NAMES, jalaliWeekdayIndex } from '@/utils/jalali'

const router = useRouter()
const { logout, currentUser } = useAuth()

const today = currentJalaliDate()
const todayLabel = computed(
  () =>
    `${JALALI_WEEKDAY_NAMES[jalaliWeekdayIndex(today.year, today.month, today.day)]}, ${formatJalaliDate(today.year, today.month, today.day)}`,
)

function signOut() {
  logout()
  void router.replace({ name: 'landing' })
}
</script>

<template>
  <header
    class="sticky top-0 z-40 border-b border-background/15 bg-primary pt-[env(safe-area-inset-top)]"
  >
    <div class="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
      <RouterLink
        to="/dashboard"
        class="min-w-0 truncate text-base font-bold text-background sm:text-lg"
      >
        Money Management
      </RouterLink>
      <div class="flex min-w-0 items-center gap-3">
        <p class="hidden truncate text-xs text-background/70 sm:block sm:text-sm">{{ todayLabel }}</p>
        <button
          type="button"
          class="inline-flex min-h-11 shrink-0 items-center rounded-full border border-background/20 px-3 text-xs font-medium text-background/80 transition hover:bg-background/10 hover:text-background"
          :title="currentUser?.email"
          @click="signOut"
        >
          Sign out
        </button>
      </div>
    </div>
  </header>
</template>
