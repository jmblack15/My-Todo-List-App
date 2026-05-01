import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { SectionHeader } from "@/components/ui/SectionHeader";
import { useAppTheme } from "@/hooks/useAppTheme";
import type { Habit } from "@/types";

function HabitItem({
  habit,
  onToggle,
  onDelete,
  isLast,
}: {
  habit: Habit;
  onToggle: () => void;
  onDelete: () => void;
  isLast: boolean;
}) {
  const { colors } = useAppTheme();
  const scale = useSharedValue(1);

  const checkboxStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.72, { duration: 80 }),
      withSpring(1, { damping: 8, stiffness: 200 }),
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle();
  };

  const handleLongPress = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(habit.title, undefined, [
      { text: "Cancelar", style: "cancel" },
      { text: "Editar", onPress: () => router.push(`/habit/${habit.id}` as never) },
      { text: "Eliminar", style: "destructive", onPress: onDelete },
    ]);
  };

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={handleLongPress}
      style={[
        styles.listItem,
        !isLast && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View style={{ marginRight: 12 }}>
        <Animated.View style={checkboxStyle}>
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: habit.completed_today ? 0 : 1.5,
              borderColor: habit.completed_today
                ? "transparent"
                : colors.borderStrong,
              backgroundColor: habit.completed_today
                ? habit.color
                : "transparent",
            }}
          >
            {habit.completed_today && (
              <Ionicons name="checkmark" size={13} color="white" />
            )}
          </View>
        </Animated.View>
      </View>

      <Text style={styles.habitIcon}>{habit.icon}</Text>

      <Text
        style={[
          styles.itemTitle,
          { color: habit.completed_today ? colors.textTertiary : colors.text },
          habit.completed_today && styles.strikethrough,
        ]}
      >
        {habit.title}
      </Text>

      {habit.streak >= 3 && (
        <Text style={[styles.streak, { color: colors.textSecondary }]}>
          🔥 {habit.streak}
        </Text>
      )}
    </Pressable>
  );
}

function EmptyHabits() {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.emptyState, { backgroundColor: colors.bgSubtle }]}>
      <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
        No tienes hábitos activos
      </Text>
      <Pressable
        onPress={() => router.push("/habit/new" as never)}
        style={[styles.emptyAction, { backgroundColor: colors.indigoSoft }]}
      >
        <Text style={[styles.emptyActionText, { color: colors.primary }]}>
          Agregar hábito
        </Text>
      </Pressable>
    </View>
  );
}

export function HabitsSection({
  habits,
  completedHabits,
  habitProgress,
  today,
  onToggle,
  onDelete,
}: {
  habits: Habit[];
  completedHabits: number;
  habitProgress: number;
  today: string;
  onToggle: (id: string, date: string) => void;
  onDelete: (id: string) => void;
}) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.section}>
      <SectionHeader
        label="Hábitos"
        count={
          habits.length > 0
            ? `${completedHabits}/${habits.length}`
            : undefined
        }
      />
      {habits.length === 0 ? (
        <EmptyHabits />
      ) : (
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View
            style={[styles.progressTrack, { backgroundColor: colors.bgSubtle }]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  width: `${habitProgress * 100}%`,
                  backgroundColor: colors.primary,
                },
              ]}
            />
          </View>
          <Text style={[styles.progressLabel, { color: colors.textTertiary }]}>
            {completedHabits} de {habits.length} completados
          </Text>
          {habits.map((habit, i) => (
            <HabitItem
              key={habit.id}
              habit={habit}
              isLast={i === habits.length - 1}
              onToggle={() => onToggle(habit.id, today)}
              onDelete={() => onDelete(habit.id)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 28,
  },
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
    overflow: "hidden",
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    marginBottom: 6,
    overflow: "hidden",
  },
  progressFill: {
    height: 3,
    borderRadius: 2,
  },
  progressLabel: {
    fontSize: 12,
    marginBottom: 10,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "400",
    flex: 1,
  },
  strikethrough: {
    textDecorationLine: "line-through",
  },
  habitIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  streak: {
    fontSize: 12,
  },
  emptyState: {
    borderRadius: 16,
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 16,
    gap: 12,
  },
  emptyText: {
    fontSize: 13,
  },
  emptyAction: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  emptyActionText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
