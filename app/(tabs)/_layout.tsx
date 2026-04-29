import { Ionicons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import { useAppTheme } from '@/hooks/useAppTheme'

type IoniconName = React.ComponentProps<typeof Ionicons>['name']

export default function TabsLayout() {
  const { colors, isDark } = useAppTheme()

  const tabBarBg = isDark ? 'rgba(10,10,11,0.92)' : 'rgba(250,250,250,0.92)'

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: tabBarBg,
          borderTopWidth: 0.5,
          borderTopColor: colors.border,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="today"
        options={{
          title: 'Hoy',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={(focused ? 'home' : 'home-outline') as IoniconName}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tareas',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={(focused ? 'checkbox' : 'checkbox-outline') as IoniconName}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="habits"
        options={{
          title: 'Hábitos',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={(focused ? 'leaf' : 'leaf-outline') as IoniconName}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Horario',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={(focused ? 'calendar' : 'calendar-outline') as IoniconName}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  )
}
