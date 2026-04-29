import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/hooks/useAppTheme";
import type { ScheduleBlock } from "@/types";
import {
  blockDurationMinutes,
  isBlockActive,
  isBlockPast,
} from "@/utils/scheduleUtils";

function formatTimeRange(start: string, end: string): string {
  return `${start} – ${end}`;
}

export function BlockCard({
  block,
  isToday,
  onDelete,
}: {
  block: ScheduleBlock;
  isToday: boolean;
  onDelete: () => void;
}) {
  const { colors } = useAppTheme();
  const active = isToday && isBlockActive(block);
  const past = isToday && isBlockPast(block) && !active;
  const duration = blockDurationMinutes(block);

  const handleLongPress = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      block.title,
      formatTimeRange(block.start_time, block.end_time),
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: onDelete },
      ],
    );
  };

  return (
    <Pressable
      onLongPress={handleLongPress}
      style={[
        styles.card,
        {
          backgroundColor: active ? block.color + "14" : colors.card,
          borderColor: active ? block.color + "40" : colors.border,
          opacity: past ? 0.45 : 1,
        },
      ]}
    >
      <View style={[styles.strip, { backgroundColor: block.color }]} />

      <View style={{ flex: 1 }}>
        <Text
          style={[
            styles.title,
            { color: active ? block.color : colors.text },
          ]}
          numberOfLines={1}
        >
          {block.title}
        </Text>
        <View style={styles.meta}>
          <Text style={[styles.time, { color: colors.textTertiary }]}>
            {formatTimeRange(block.start_time, block.end_time)}
          </Text>
          <Text style={[styles.dot, { color: colors.textTertiary }]}>·</Text>
          <Text style={[styles.time, { color: colors.textTertiary }]}>
            {duration} min
          </Text>
          {block.recurrence === "weekly" && (
            <>
              <Text style={[styles.dot, { color: colors.textTertiary }]}>·</Text>
              <Ionicons name="repeat" size={11} color={colors.textTertiary} />
            </>
          )}
        </View>
      </View>

      {active && (
        <View style={[styles.nowBadge, { backgroundColor: block.color }]}>
          <Text style={styles.nowBadgeText}>Ahora</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    paddingRight: 14,
    paddingVertical: 14,
    gap: 14,
  },
  strip: {
    width: 4,
    alignSelf: "stretch",
    borderRadius: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 3,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  time: {
    fontSize: 12,
  },
  dot: {
    fontSize: 12,
  },
  nowBadge: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  nowBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "white",
  },
});
