import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { useAppTheme } from "@/hooks/useAppTheme";

export function FAB({ bottomInset }: { bottomInset: number }) {
  const { colors } = useAppTheme();
  const [open, setOpen] = useState(false);
  const progress = useSharedValue(0);

  const toggle = () => {
    const next = open ? 0 : 1;
    progress.value = withTiming(next, { duration: 200 });
    if (!open) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setOpen((v) => !v);
  };

  const close = () => {
    progress.value = withTiming(0, { duration: 200 });
    setOpen(false);
  };

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${interpolate(progress.value, [0, 1], [0, 45])}deg` },
    ],
  }));

  const opt1Style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: interpolate(progress.value, [0, 1], [24, 0]) }],
  }));

  const opt2Style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: interpolate(progress.value, [0, 1], [48, 0]) }],
  }));

  const handleNewTask = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    close();
    router.push("/task/new" as never);
  };

  const handleNewHabit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    close();
    router.push("/habit/new" as never);
  };

  return (
    <>
      {open && (
        <Pressable style={StyleSheet.absoluteFillObject} onPress={close} />
      )}

      <View style={[styles.container, { bottom: bottomInset + 16 }]}>
        <Animated.View style={opt2Style} pointerEvents={open ? "auto" : "none"}>
          <View style={styles.option}>
            <View
              style={[
                styles.optionLabel,
                {
                  backgroundColor: colors.card,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.optionText, { color: colors.text }]}>
                Nuevo hábito
              </Text>
            </View>
            <Pressable
              onPress={handleNewHabit}
              style={[
                styles.mini,
                {
                  backgroundColor: colors.card,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons name="leaf-outline" size={20} color={colors.primary} />
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View style={opt1Style} pointerEvents={open ? "auto" : "none"}>
          <View style={styles.option}>
            <View
              style={[
                styles.optionLabel,
                {
                  backgroundColor: colors.card,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.optionText, { color: colors.text }]}>
                Nueva tarea
              </Text>
            </View>
            <Pressable
              onPress={handleNewTask}
              style={[
                styles.mini,
                {
                  backgroundColor: colors.card,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons
                name="checkbox-outline"
                size={20}
                color={colors.primary}
              />
            </Pressable>
          </View>
        </Animated.View>

        <Pressable
          onPress={toggle}
          style={[styles.main, { backgroundColor: colors.primary }]}
        >
          <Animated.View style={iconStyle}>
            <Ionicons name="add" size={28} color="white" />
          </Animated.View>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 20,
    alignItems: "flex-end",
    gap: 12,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  optionLabel: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  optionText: {
    fontSize: 14,
    fontWeight: "500",
  },
  mini: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  main: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
