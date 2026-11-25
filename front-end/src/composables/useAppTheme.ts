import { readonly, ref } from 'vue'
import { APP_THEMES, type AppThemeId, appThemeById } from '@/constants/appThemes'
import { applyAppTheme, initAppTheme } from '@/utils/applyAppTheme'

const activeId = ref<AppThemeId>(initAppTheme())

export function useAppTheme() {
  function setTheme(id: AppThemeId): void {
    if (id === activeId.value) return
    applyAppTheme(id)
    activeId.value = id
  }

  function activeTheme() {
    return appThemeById(activeId.value)
  }

  return {
    themes: APP_THEMES,
    themeId: readonly(activeId),
    activeTheme,
    setTheme,
  }
}