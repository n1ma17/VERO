<script setup lang="ts">
import { ref } from 'vue'
import BaseButton from '@/components/shared/BaseButton.vue'
import { readImageAsDataUrl } from '@/utils/readImageFile'

const logoUrl = defineModel<string | null>({ default: null })

const error = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

function openPicker() {
  fileInput.value?.click()
}

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  error.value = ''
  try {
    logoUrl.value = await readImageAsDataUrl(file)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Upload failed.'
  }
}

function clearLogo() {
  logoUrl.value = null
  error.value = ''
}
</script>

<template>
  <div>
    <label class="mb-1.5 block text-xs text-text-muted">
      Institution logo <span class="text-text-muted/80">(optional)</span>
    </label>

    <div class="flex items-center gap-3 rounded-2xl border border-primary/20 bg-surface p-3">
      <div
        class="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-primary/20 bg-primary/15"
      >
        <img v-if="logoUrl" :src="logoUrl" alt="" class="size-full object-contain p-1" />
        <span v-else class="text-xs text-text-muted">Logo</span>
      </div>

      <div class="min-w-0 flex-1 space-y-2">
        <input
          ref="fileInput"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
          class="hidden"
          @change="onFileChange"
        />
        <div class="flex flex-wrap gap-2">
          <BaseButton type="button" @click="openPicker">
            {{ logoUrl ? 'Change logo' : 'Upload logo' }}
          </BaseButton>
          <BaseButton v-if="logoUrl" type="button" variant="ghost" @click="clearLogo">
            Remove
          </BaseButton>
        </div>
        <p class="text-xs text-text-muted">
          Stored on this device only. Max 128 KB.
        </p>
      </div>
    </div>

    <p v-if="error" class="mt-1.5 text-xs text-danger">{{ error }}</p>
  </div>
</template>
