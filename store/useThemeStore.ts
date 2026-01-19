import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "react-native";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface ThemeState {
  theme: "light" | "dark";
  toggleTheme: () => void;
  setTheme: (theme: "light" | "dark") => void;
}

const systemTheme = useColorScheme();

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: systemTheme || "dark",
      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === "light" ? "dark" : "light",
        })),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "theme-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
