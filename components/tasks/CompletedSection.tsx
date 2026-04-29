import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { useAppTheme } from "@/hooks/useAppTheme";
import type { Task } from "@/types";

import { TaskCard } from "./TaskCard";

export function CompletedSection({
  tasks,
  onToggle,
  onDelete,
}: {
  tasks: Task[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { colors } = useAppTheme();
  const [expanded, setExpanded] = useState(false);
  const progress = useSharedValue(0);

  const toggle = () => {
    const next = expanded ? 0 : 1;
    progress.value = withTiming(next, { duration: 220 });
    setExpanded((v) => !v);
  };

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${interpolate(progress.value, [0, 1], [0, 180])}deg` },
    ],
  }));

  return (
    <View style={styles.container}>
      <Pressable onPress={toggle} style={styles.header}>
        <Text style={[styles.label, { color: colors.textTertiary }]}>
          Completadas
        </Text>
        <View style={styles.right}>
          <Text style={[styles.label, { color: colors.textTertiary }]}>
            {tasks.length}
          </Text>
          <Animated.View style={chevronStyle}>
            <Ionicons
              name="chevron-down"
              size={14}
              color={colors.textTertiary}
            />
          </Animated.View>
        </View>
      </Pressable>

      {expanded && (
        <TaskCard tasks={tasks} onToggle={onToggle} onDelete={onDelete} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 28,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
});
