import {
  DEFAULT_THEME_ID,
  THEME_STORAGE_KEY,
  appThemeById,
  isAppThemeId,
  type AppThemeId,
} from '@/constants/appThemes'

function readStoredThemeId(): AppThemeId {
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  return isAppThemeId(stored) ? stored : DEFAULT_THEME_ID
}

/** Sync DOM + storage; call on boot and when user picks a theme. */
export function applyAppTheme(id: AppThemeId): void {
  const theme = appThemeById(id)
  const root = document.documentElement

  root.dataset.theme = theme.id
  root.style.setProperty('--color-background', theme.background)
  root.style.setProperty('--color-text', theme.text)
  root.style.setProperty('--color-accent', theme.accent)
  root.style.setProperty('--color-on-accent', theme.onAccent)

  localStorage.setItem(THEME_STORAGE_KEY, theme.id)
}

export function initAppTheme(): AppThemeId {
  const id = readStoredThemeId()
  applyAppTheme(id)
  return id
}