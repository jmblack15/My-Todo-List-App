import { create } from 'zustand'
import { MMKV } from 'react-native-mmkv'
import type { AppTheme, Language } from '@/types'

const storage = new MMKV({ id: 'ui-preferences' })

type UIStore = {
  theme: AppTheme
  language: Language
  setTheme(theme: AppTheme): void
  setLanguage(language: Language): void
  loadTheme(): void
  loadLanguage(): void
}

export const useUIStore = create<UIStore>()((set) => ({
  theme: 'dark',
  language: 'es',

  setTheme(theme: AppTheme) {
    storage.set('theme', theme)
    set({ theme })
  },

  setLanguage(language: Language) {
    storage.set('language', language)
    set({ language })
  },

  loadTheme() {
    const stored = storage.getString('theme') as AppTheme | undefined
    if (stored) set({ theme: stored })
  },

  loadLanguage() {
    const stored = storage.getString('language') as Language | undefined
    if (stored) set({ language: stored })
  },
}))
