# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npx expo start --tunnel   # start dev server (tunnel is the default)
npx expo start --android  # open on Android emulator/device
npx expo start --ios      # open on iOS simulator/device
npx expo start --web      # open in browser
npx expo lint             # run ESLint
```

There is no test suite configured yet.

## Architecture

React Native app built with **Expo SDK 54** and **expo-router v6** for file-based routing. State is managed with **Zustand v5**. TypeScript throughout.

### Routing (`app/`)

expo-router uses the filesystem as the route tree:

- `_layout.tsx` — root layout; wraps the whole app in React Navigation's `ThemeProvider` driven by `useThemeStore`.
- `(tabs)/` — tab group: the main app screens.
- `modal.tsx` — modal overlay accessible from within tabs.

### State (`store/`)

| Store | Persistence | Purpose |
|---|---|---|
| `useThemeStore` | AsyncStorage (Zustand `persist`) | `"light"` / `"dark"` theme; defaults to system scheme |
| `useTaskStore` | none yet (refactor in progress) | task list: `addTask`, `toggleTask` |

The current branch (`refactor/data-source-local-storage`) is adding AsyncStorage persistence to `useTaskStore`.

### Theming

`constants/theme.ts` exports `Colors` (light/dark palettes) and `Fonts` (platform-aware font stacks). Components consume theme via `useThemeStore` — use `ThemedText` and `ThemedView` from `components/` instead of raw `Text`/`View` when you need theme-aware colors. The root layout passes a customised React Navigation theme built from `Colors[theme]` so navigation chrome (headers, tab bar) matches the app palette.

### Types

`types/task.ts` defines `Task` (`id`, `title`, `category`, `time`, `completed`, `priority: "Low"|"Medium"|"High"`) and `TaskState`.

### `api/` directory

Empty placeholder — no backend or API layer exists yet.
