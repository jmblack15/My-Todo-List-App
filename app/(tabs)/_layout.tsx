import { Icons } from "@/constants/icons";
import { useAppTheme } from "@/hooks/useAppTheme";
import { Tabs } from "expo-router";

export default function TabsLayout() {
  const { colors, isDark } = useAppTheme();

  const tabBarBg = isDark ? "rgba(10,10,11,0.92)" : "rgba(250,250,250,0.92)";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: tabBarBg,
          borderTopWidth: 0.5,
          borderTopColor: colors.border,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Hoy",
          tabBarIcon: ({ color, size, focused }) => (
            <Icons.Home size={size} color={color} stroke={focused ? 2 : 1.6} />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: "Tareas",
          tabBarIcon: ({ color, size, focused }) => (
            <Icons.ListTodo
              size={size}
              color={color}
              stroke={focused ? 2 : 1.6}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="habits"
        options={{
          title: "Hábitos",
          tabBarIcon: ({ color, size, focused }) => (
            <Icons.Repeat
              size={size}
              color={color}
              stroke={focused ? 2 : 1.6}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: "Horario",
          tabBarIcon: ({ color, size, focused }) => (
            <Icons.CalGrid
              size={size}
              color={color}
              stroke={focused ? 2 : 1.6}
            />
          ),
        }}
      />
    </Tabs>
  );
}
