<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { AuthMode } from '@/types/auth'

const props = defineProps<{
  mode: AuthMode
  disabled?: boolean
  busy?: boolean
  rejected?: boolean
}>()

const emit = defineEmits<{
  'request-mode': [mode: AuthMode]
  submit: [payload: { name: string; email: string; password: string }]
  forgot: [email: string]
  'try-again': []
}>()

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const formError = ref<string | null>(null)
const passwordVisible = ref(false)

const inputClasses =
  'w-full rounded-2xl border border-primary/25 bg-paper px-3 py-3 text-base text-on-paper outline-none placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/50 disabled:opacity-60'
const passwordInputClasses =
  'w-full rounded-2xl border border-primary/25 bg-paper py-3 pl-3 pr-24 text-base text-on-paper outline-none placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/50 disabled:opacity-60'

const passwordInputType = computed(() => (passwordVisible.value ? 'text' : 'password'))
const passwordToggleLabel = computed(() => (passwordVisible.value ? 'Hide' : 'Show'))

const tabClasses = {
  active: 'bg-on-paper text-paper',
  idle: 'text-text-muted hover:bg-primary/10',
} as const

const isRegister = computed(() => props.mode === 'register')
const isForgot = computed(() => props.mode === 'forgot')
const submitLabel = computed(() => {
  if (isForgot.value) return 'Send new password'
  if (isRegister.value) return 'Create account'
  return 'Sign in'
})

watch(
  () => props.mode,
  () => {
    formError.value = null
    password.value = ''
    confirmPassword.value = ''
    passwordVisible.value = false
  },
)

function togglePasswordVisible() {
  passwordVisible.value = !passwordVisible.value
}

function setMode(mode: AuthMode) {
  if (props.disabled || mode === props.mode) return
  emit('request-mode', mode)
}

function submit() {
  formError.value = null
  const trimmedName = name.value.trim()
  const trimmedEmail = email.value.trim()

  if (!trimmedEmail.includes('@')) {
    formError.value = 'Enter a valid email address.'
    return
  }

  if (isForgot.value) {
    emit('forgot', trimmedEmail)
    return
  }

  if (isRegister.value && trimmedName.length < 2) {
    formError.value = 'Enter your name (at least 2 characters).'
    return
  }
  if (password.value.length < 8) {
    formError.value = 'Password must be at least 8 characters.'
    return
  }
  if (isRegister.value && password.value !== confirmPassword.value) {
    formError.value = 'Passwords do not match.'
    return
  }

  emit('submit', {
    name: trimmedName,
    email: trimmedEmail,
    password: password.value,
  })
}
</script>

<template>
  <form class="space-y-4 px-4 py-4 sm:px-6 sm:py-5" @submit.prevent="submit">
    <div class="flex gap-1 rounded-full border border-primary/20 p-1">
      <button
        type="button"
        class="flex-1 rounded-full px-3 py-2.5 text-xs font-semibold uppercase tracking-wider transition"
        :class="mode === 'login' || mode === 'forgot' ? tabClasses.active : tabClasses.idle"
        :disabled="disabled"
        @click="setMode('login')"
      >
        Login
      </button>
      <button
        type="button"
        class="flex-1 rounded-full px-3 py-2.5 text-xs font-semibold uppercase tracking-wider transition"
        :class="mode === 'register' ? tabClasses.active : tabClasses.idle"
        :disabled="disabled"
        @click="setMode('register')"
      >
        Register
      </button>
    </div>

    <div v-if="isRegister">
      <label class="mb-1.5 block text-xs text-text-muted">Name</label>
      <input
        v-model="name"
        type="text"
        autocomplete="name"
        placeholder="Your name"
        :class="inputClasses"
        :disabled="disabled"
      />
    </div>

    <div>
      <label class="mb-1.5 block text-xs text-text-muted">Email</label>
      <input
        v-model="email"
        type="email"
        autocomplete="email"
        placeholder="you@example.com"
        :class="inputClasses"
        :disabled="disabled"
      />
    </div>

    <div v-if="!isForgot">
      <label class="mb-1.5 block text-xs text-text-muted">Password</label>
      <div class="relative">
        <input
          v-model="password"
          :type="passwordInputType"
          :autocomplete="isRegister ? 'new-password' : 'current-password'"
          placeholder="At least 8 characters"
          :class="passwordInputClasses"
          :disabled="disabled"
        />
        <button
          type="button"
          class="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold uppercase tracking-wide text-text-muted transition hover:text-text disabled:opacity-50"
          :aria-pressed="passwordVisible"
          :aria-label="passwordVisible ? 'Hide password' : 'Show password'"
          :disabled="disabled"
          @click="togglePasswordVisible"
        >
          {{ passwordToggleLabel }}
        </button>
      </div>
    </div>

    <div v-if="isRegister">
      <label class="mb-1.5 block text-xs text-text-muted">Confirm password</label>
      <div class="relative">
        <input
          v-model="confirmPassword"
          :type="passwordInputType"
          autocomplete="new-password"
          placeholder="Repeat password"
          :class="passwordInputClasses"
          :disabled="disabled"
        />
        <button
          type="button"
          class="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold uppercase tracking-wide text-text-muted transition hover:text-text disabled:opacity-50"
          :aria-pressed="passwordVisible"
          :aria-label="passwordVisible ? 'Hide password' : 'Show password'"
          :disabled="disabled"
          @click="togglePasswordVisible"
        >
          {{ passwordToggleLabel }}
        </button>
      </div>
    </div>

    <p v-if="formError" class="text-sm text-danger" role="alert">{{ formError }}</p>

    <button
      v-if="rejected"
      type="button"
      class="w-full rounded-[16px] bg-accent py-3 text-sm font-semibold text-on-accent transition hover:bg-accent/90"
      @click="emit('try-again')"
    >
      Try again
    </button>
    <button
      v-else
      type="submit"
      class="w-full rounded-[16px] bg-accent py-3 text-sm font-semibold text-on-accent transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
      :disabled="disabled"
    >
      {{ busy ? 'Checking…' : submitLabel }}
    </button>

    <button
      v-if="mode === 'login' && !rejected"
      type="button"
      class="w-full text-center text-xs font-medium text-text-muted transition hover:text-text disabled:opacity-50"
      :disabled="disabled"
      @click="setMode('forgot')"
    >
      Forgot password?
    </button>
    <button
      v-if="isForgot && !rejected"
      type="button"
      class="w-full text-center text-xs font-medium text-text-muted transition hover:text-text disabled:opacity-50"
      :disabled="disabled"
      @click="setMode('login')"
    >
      Back to sign in
    </button>
  </form>
</template>
