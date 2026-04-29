import { useUIStore } from '@/stores/useUIStore'
import { darkColors, lightColors } from '@/constants/colors'
import type { AppColors, AppTheme } from '@/types'

type AppThemeResult = {
  colors: AppColors
  isDark: boolean
  theme: AppTheme
}

export function useAppTheme(): AppThemeResult {
  const theme = useUIStore(state => state.theme)
  const isDark = theme === 'dark'
  const colors = isDark ? darkColors : lightColors
  return { colors, isDark, theme }
}
