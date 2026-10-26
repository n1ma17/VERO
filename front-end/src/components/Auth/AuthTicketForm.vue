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
  'try-again': []
}>()

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const formError = ref<string | null>(null)

const inputClasses =
  'w-full rounded-2xl border border-primary/20 bg-surface px-3 py-3 text-base text-text outline-none placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-accent/60 disabled:opacity-60'

const tabClasses = {
  active: 'bg-primary text-background',
  idle: 'text-text-muted hover:bg-accent/40',
} as const

const isRegister = computed(() => props.mode === 'register')
const submitLabel = computed(() => (isRegister.value ? 'Create account' : 'Sign in'))

watch(
  () => props.mode,
  () => {
    formError.value = null
    password.value = ''
    confirmPassword.value = ''
  },
)

function setMode(mode: AuthMode) {
  if (props.disabled || mode === props.mode) return
  emit('request-mode', mode)
}

function submit() {
  formError.value = null
  const trimmedName = name.value.trim()
  const trimmedEmail = email.value.trim()

  if (isRegister.value && trimmedName.length < 2) {
    formError.value = 'Enter your name (at least 2 characters).'
    return
  }
  if (!trimmedEmail.includes('@')) {
    formError.value = 'Enter a valid email address.'
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
        :class="mode === 'login' ? tabClasses.active : tabClasses.idle"
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

    <div>
      <label class="mb-1.5 block text-xs text-text-muted">Password</label>
      <input
        v-model="password"
        type="password"
        :autocomplete="isRegister ? 'new-password' : 'current-password'"
        placeholder="At least 8 characters"
        :class="inputClasses"
        :disabled="disabled"
      />
    </div>

    <div v-if="isRegister">
      <label class="mb-1.5 block text-xs text-text-muted">Confirm password</label>
      <input
        v-model="confirmPassword"
        type="password"
        autocomplete="new-password"
        placeholder="Repeat password"
        :class="inputClasses"
        :disabled="disabled"
      />
    </div>

    <p v-if="formError" class="text-sm text-danger" role="alert">{{ formError }}</p>

    <button
      v-if="rejected"
      type="button"
      class="w-full rounded-[16px] bg-primary py-3 text-sm font-semibold text-background transition hover:bg-primary"
      @click="emit('try-again')"
    >
      Try again
    </button>
    <button
      v-else
      type="submit"
      class="w-full rounded-[16px] bg-primary py-3 text-sm font-semibold text-background transition hover:bg-primary disabled:cursor-not-allowed disabled:opacity-50"
      :disabled="disabled"
    >
      {{ busy ? 'Checking…' : submitLabel }}
    </button>
  </form>
</template>
