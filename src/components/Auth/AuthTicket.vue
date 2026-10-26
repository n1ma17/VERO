<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AuthTicketForm from '@/components/Auth/AuthTicketForm.vue'
import AuthTicketStamp from '@/components/Auth/AuthTicketStamp.vue'
import ReceiptBarcode from '@/components/shared/ReceiptBarcode.vue'
import ReceiptDivider from '@/components/shared/ReceiptDivider.vue'
import ReceiptEdge from '@/components/shared/ReceiptEdge.vue'
import { useAuth } from '@/composables/useAuth'
import { useAuthTicketPrinter } from '@/composables/useAuthTicketPrinter'
import type { AuthMode, AuthOutcome } from '@/types/auth'
import { currentJalaliDate, formatJalaliDate } from '@/utils/jalali'

const STAMP_MS = 650
const LEAVE_MS = 450

const route = useRoute()
const router = useRouter()
const { login, register } = useAuth()
const { requestModeChange, isExchanging } = useAuthTicketPrinter()

const mode = ref<AuthMode>('login')
const outcome = ref<AuthOutcome>('idle')
const failHint = ref('')

const issuedLabel = formatJalaliDate(
  currentJalaliDate().year,
  currentJalaliDate().month,
  currentJalaliDate().day,
)

const ticketCode = `MM-${currentJalaliDate().year}${String(currentJalaliDate().month).padStart(2, '0')}`

const isBusy = computed(
  () => outcome.value === 'pending' || outcome.value === 'success' || isExchanging.value,
)
const showStamp = computed(() => outcome.value === 'success' || outcome.value === 'rejected')
const stampTone = computed(() => (outcome.value === 'rejected' ? 'rejected' : 'success'))

const ticketMotionClasses = {
  idle: '',
  pending: '',
  success: '',
  rejected: 'animate-ticket-shake motion-reduce:animate-none',
} as const

const stubCaption = computed(() => {
  if (outcome.value === 'pending') return 'Checking credentials'
  if (outcome.value === 'success') return 'Pass punched'
  if (outcome.value === 'rejected') return 'Admission denied'
  return 'Awaiting admission'
})

function redirectTarget(): string {
  const redirect = route.query.redirect
  if (typeof redirect === 'string' && redirect.startsWith('/') && redirect !== '/') {
    return redirect
  }
  return '/dashboard'
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

async function onSubmit(payload: { name: string; email: string; password: string }) {
  if (isBusy.value || outcome.value === 'rejected') return

  outcome.value = 'pending'
  const result =
    mode.value === 'register'
      ? await register({ name: payload.name, email: payload.email, password: payload.password })
      : await login(payload.email, payload.password)

  if (!result.ok) {
    failHint.value =
      result.reason === 'exists' ? 'This email already has a pass' : 'Email or password did not match'
    outcome.value = 'rejected'
    return
  }

  outcome.value = 'success'
  await delay(STAMP_MS + LEAVE_MS)
  await router.replace(redirectTarget())
}

function tryAgain() {
  outcome.value = 'idle'
  failHint.value = ''
}

async function onRequestMode(next: AuthMode) {
  if (next === mode.value || isBusy.value) return

  await requestModeChange(next, () => {
    if (outcome.value === 'rejected') {
      tryAgain()
    }
    mode.value = next
  })
}
</script>

<template>
  <div class="w-full">
    <div
      class="relative"
      :class="ticketMotionClasses[outcome]"
      aria-live="polite"
    >
      <div class="isolate bg-surface text-text">
        <div class="h-1.5" :class="mode === 'login' ? 'bg-accent' : 'bg-success'" />

        <header class="px-6 pb-2 pt-3 text-center">
          <h1 class="text-xl font-bold">
            {{ mode === 'login' ? 'Sign in' : 'Create account' }}
          </h1>
          <p class="mt-1 text-xs text-text-muted">
            {{
              mode === 'login'
                ? 'Punch this ticket to enter your books'
                : 'Issue a pass, then keep this device signed in'
            }}
          </p>
        </header>

        <ReceiptDivider />

        <AuthTicketForm
          :mode="mode"
          :disabled="isBusy || outcome === 'rejected'"
          :busy="outcome === 'pending' || isExchanging"
          :rejected="outcome === 'rejected'"
          @request-mode="onRequestMode"
          @submit="onSubmit"
          @try-again="tryAgain"
        />

        <ReceiptDivider />

        <div class="relative overflow-hidden pb-8 pt-1">
          <div
            class="flex items-center justify-between px-6 font-mono text-[10px] uppercase tracking-[0.25em] text-text-muted"
          >
            <span>Stub</span>
            <span>{{ issuedLabel }}</span>
          </div>
          <p
            class="px-6 pt-2 text-center text-xs font-medium uppercase tracking-widest text-text-muted"
          >
            {{ stubCaption }}
          </p>
          <p v-if="failHint" class="px-6 pt-1 text-center text-xs text-danger">{{ failHint }}</p>
          <div class="px-6 pt-3">
            <ReceiptBarcode :code="ticketCode" />
          </div>

          <div class="pointer-events-none absolute inset-x-0 top-10 flex justify-center">
            <Transition
              enter-active-class="transition duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none motion-reduce:duration-0"
              enter-from-class="scale-150 -rotate-[28deg] opacity-0"
              enter-to-class="scale-100 -rotate-12 opacity-85"
            >
              <AuthTicketStamp v-if="showStamp" :tone="stampTone" />
            </Transition>
          </div>

          <ReceiptEdge />
        </div>
      </div>
    </div>
  </div>
</template>
