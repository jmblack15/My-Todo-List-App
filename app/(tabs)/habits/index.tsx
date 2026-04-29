import { Text, View } from 'react-native'
import { useAppTheme } from '@/hooks/useAppTheme'

export default function HabitsScreen() {
  const { colors } = useAppTheme()
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: colors.text }}>Hábitos</Text>
    </View>
  )
}
