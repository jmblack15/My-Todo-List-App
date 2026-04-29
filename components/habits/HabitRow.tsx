import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { useAppTheme } from "@/hooks/useAppTheme";
import type { Habit } from "@/types";

export function HabitRow({
  habit,
  onToggle,
  onDelete,
  isLast,
  showToggle,
}: {
  habit: Habit;
  onToggle?: () => void;
  onDelete: () => void;
  isLast: boolean;
  showToggle: boolean;
}) {
  const { colors } = useAppTheme();
  const scale = useSharedValue(1);

  const checkboxStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleToggle = () => {
    if (!onToggle) return;
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
      { text: "Eliminar", style: "destructive", onPress: onDelete },
    ]);
  };

  return (
    <Pressable
      onPress={showToggle ? handleToggle : undefined}
      onLongPress={handleLongPress}
      style={[
        styles.row,
        !isLast && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View style={[styles.iconWrapper, { backgroundColor: habit.color + "20" }]}>
        <Text style={styles.emoji}>{habit.icon}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={[
            styles.title,
            {
              color:
                showToggle && habit.completed_today
                  ? colors.textTertiary
                  : colors.text,
            },
            showToggle && habit.completed_today && styles.strikethrough,
          ]}
          numberOfLines={1}
        >
          {habit.title}
        </Text>
        <View style={styles.meta}>
          <Text style={[styles.metaText, { color: colors.textTertiary }]}>
            {habit.frequency === "daily" ? "Diario" : "Semanal"}
          </Text>
          {habit.streak > 0 && (
            <>
              <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                ·
              </Text>
              <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                🔥 {habit.streak}
              </Text>
            </>
          )}
        </View>
      </View>

      {showToggle && (
        <Animated.View style={checkboxStyle}>
          <View
            style={{
              width: 26,
              height: 26,
              borderRadius: 13,
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
              <Ionicons name="checkmark" size={14} color="white" />
            )}
          </View>
        </Animated.View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
    fontSize: 20,
  },
  title: {
    fontSize: 15,
    fontWeight: "500",
  },
  strikethrough: {
    textDecorationLine: "line-through",
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  metaText: {
    fontSize: 12,
  },
});
