import { Colors } from "@/constants/theme";
import { useThemeStore } from "@/store/useThemeStore";
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
  const { theme } = useThemeStore();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (navigationState?.key) {
      SplashScreen.hideAsync();
    }
  }, [navigationState?.key]);

  const customTheme = {
    ...(theme === "dark" ? DarkTheme : DefaultTheme),
    colors: {
      ...(theme === "dark" ? DarkTheme.colors : DefaultTheme.colors),
      primary: Colors[theme].tint,
      background: Colors[theme].background,
      card: Colors[theme].card,
      text: Colors[theme].text,
      border: Colors[theme].border,
    },
  };

  return (
    <ThemeProvider value={customTheme}>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </ThemeProvider>
  );
}
