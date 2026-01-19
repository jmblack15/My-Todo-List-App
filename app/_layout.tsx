import { Colors } from "@/constants/theme";
import { useThemeStore } from "@/store/useThemeStore";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const { theme } = useThemeStore();

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
      <Stack>
        {/* <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} /> */}
      </Stack>
    </ThemeProvider>
  );
}
