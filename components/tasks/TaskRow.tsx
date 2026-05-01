import { Ionicons } from "@expo/vector-icons";
import { format, isThisWeek, isToday, isTomorrow } from "date-fns";
import { es } from "date-fns/locale";
import * as Haptics from "expo-haptics";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/hooks/useAppTheme";
import type { Task } from "@/types";

function formatDueDate(due_date: string): string {
  const d = new Date(due_date + "T00:00:00");
  if (isToday(d)) return "Hoy";
  if (isTomorrow(d)) return "Mañana";
  if (isThisWeek(d, { weekStartsOn: 1 }))
    return format(d, "EEEE", { locale: es }).replace(/^\w/, (c) =>
      c.toUpperCase(),
    );
  return format(d, "d 'de' MMM", { locale: es });
}

export function TaskRow({
  task,
  onToggle,
  onDelete,
  onEdit,
  isLast,
}: {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
  isLast: boolean;
}) {
  const { colors } = useAppTheme();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle();
  };

  const handleLongPress = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(task.title, undefined, [
      { text: "Cancelar", style: "cancel" },
      { text: "Editar", onPress: onEdit },
      { text: "Eliminar", style: "destructive", onPress: onDelete },
    ]);
  };

  const priorityColor =
    task.priority === "high" ? colors.danger : colors.warning;
  const hasMetadata =
    task.due_time != null ||
    (task.due_date != null && !isToday(new Date(task.due_date + "T00:00:00")));

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={handleLongPress}
      style={[
        styles.row,
        !isLast && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
          borderWidth: task.done ? 0 : 1.5,
          borderColor: task.done ? "transparent" : colors.borderStrong,
          backgroundColor: task.done ? colors.primary : "transparent",
        }}
      >
        {task.done && <Ionicons name="checkmark" size={13} color="white" />}
      </View>

      <View style={{ flex: 1, gap: 3 }}>
        <Text
          style={[
            styles.title,
            { color: task.done ? colors.textTertiary : colors.text },
            task.done && styles.strikethrough,
          ]}
          numberOfLines={2}
        >
          {task.title}
        </Text>
        {hasMetadata && (
          <View style={styles.metaRow}>
            {task.due_date != null &&
              !isToday(new Date(task.due_date + "T00:00:00")) && (
                <View
                  style={[styles.badge, { backgroundColor: colors.bgSubtle }]}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={10}
                    color={colors.textTertiary}
                  />
                  <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                    {formatDueDate(task.due_date)}
                  </Text>
                </View>
              )}
            {task.due_time != null && (
              <View
                style={[styles.badge, { backgroundColor: colors.bgSubtle }]}
              >
                <Ionicons
                  name="time-outline"
                  size={10}
                  color={colors.textTertiary}
                />
                <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                  {task.due_time}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {!task.done && task.priority !== "low" && (
        <View
          style={[
            styles.priorityBadge,
            { backgroundColor: priorityColor + "20" },
          ]}
        >
          <Text style={[styles.priorityText, { color: priorityColor }]}>
            {task.priority === "high" ? "Alta" : "Media"}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
  },
  title: {
    fontSize: 15,
    fontWeight: "400",
    lineHeight: 20,
  },
  strikethrough: {
    textDecorationLine: "line-through",
  },
  metaRow: {
    flexDirection: "row",
    gap: 6,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  metaText: {
    fontSize: 11,
    fontWeight: "500",
  },
  priorityBadge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginLeft: 8,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: "600",
  },
});
