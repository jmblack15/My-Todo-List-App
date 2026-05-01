import { useAppTheme } from "@/hooks/useAppTheme";
import { initDB } from "@/lib/db";
import { setupNotifications } from "@/services/notificationService";
import { useUIStore } from "@/stores/useUIStore";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRootNavigationState } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { loadTheme, loadLanguage } = useUIStore();
  const { colors, isDark } = useAppTheme();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    initDB();
    setupNotifications();
    loadTheme();
    loadLanguage();
  }, []);

  useEffect(() => {
    if (navigationState?.key) {
      SplashScreen.hideAsync();
    }
  }, [navigationState?.key]);

  const customTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.primary,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
    },
  };

  return (
    <ThemeProvider value={customTheme}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="task/new"
          options={{ presentation: "transparentModal", headerShown: false, animation: "none" }}
        />
        <Stack.Screen
          name="habit/new"
          options={{ presentation: "transparentModal", headerShown: false, animation: "none" }}
        />
      </Stack>
    </ThemeProvider>
  );
}
