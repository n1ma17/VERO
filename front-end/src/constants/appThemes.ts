import blackBoxPreview from '@/assets/images/black-box.png'
import cherryPreview from '@/assets/images/cherry.png'
import desertPreview from '@/assets/images/desert.jpg'
import lightPreview from '@/assets/images/light.jpg'
import naturePreview from '@/assets/images/nature.jpg'
import oceanPreview from '@/assets/images/ocion.jpg'

export const THEME_STORAGE_KEY = 'money-managment:theme'

export type AppThemeId =
  | 'black-box'
  | 'cherry-noir'
  | 'nature-perfume'
  | 'desert'
  | 'ocean'
  | 'light'

export interface AppTheme {
  id: AppThemeId
  name: string
  description: string
  previewSrc: string
  background: string
  text: string
  accent: string
  onAccent: string
}

export const APP_THEMES: readonly AppTheme[] = [
  {
    id: 'black-box',
    name: 'Black Box',
    description: 'Dark ink, steel text, orange accent on primary actions.',
    previewSrc: blackBoxPreview,
    background: '#19191b',
    text: '#8c8e92',
    accent: '#ff5410',
    onAccent: '#19191b',
  },
  {
    id: 'cherry-noir',
    name: 'Cherry Noir',
    description: 'Warm parchment field, wine type, cherry accent.',
    previewSrc: cherryPreview,
    background: '#f6eedb',
    text: '#35151a',
    accent: '#b4182d',
    onAccent: '#f6eedb',
  },
  {
    id: 'nature-perfume',
    name: 'Nature Perfume',
    description: 'Forest canopy, sage paper type, coral accent.',
    previewSrc: naturePreview,
    background: '#0b2b2a',
    text: '#e6e5c8',
    accent: '#ef4923',
    onAccent: '#0b2b2a',
  },
  {
    id: 'desert',
    name: 'Desert',
    description: 'Dune parchment, cocoa type, burnt orange accent.',
    previewSrc: desertPreview,
    background: '#eaddc5',
    text: '#563a2e',
    accent: '#d8682f',
    onAccent: '#eaddc5',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Night water field, bright tide type, sea-glass accent.',
    previewSrc: oceanPreview,
    background: '#090e1b',
    text: '#2b73a9',
    accent: '#8eb69b',
    onAccent: '#090e1b',
  },
  {
    id: 'light',
    name: 'Light',
    description: 'Warm paper, midnight type, amber accent.',
    previewSrc: lightPreview,
    background: '#f1ece3',
    text: '#14213d',
    accent: '#ffb020',
    onAccent: '#14213d',
  },
] as const

export const DEFAULT_THEME_ID: AppThemeId = 'black-box'

const themeIds = new Set<string>(APP_THEMES.map((t) => t.id))

export function isAppThemeId(value: string | null | undefined): value is AppThemeId {
  return value != null && themeIds.has(value)
}

export function appThemeById(id: AppThemeId): AppTheme {
  const found = APP_THEMES.find((t) => t.id === id)
  return found ?? APP_THEMES[0]
}