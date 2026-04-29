import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { SectionHeader } from "@/components/ui/SectionHeader";
import { useAppTheme } from "@/hooks/useAppTheme";
import type { Task } from "@/types";

function TaskItem({
  task,
  onToggle,
  isLast,
}: {
  task: Task;
  onToggle: () => void;
  isLast: boolean;
}) {
  const { colors } = useAppTheme();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle();
  };

  const handleLongPress = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push(`/task/${task.id}` as never);
  };

  const priorityColor =
    task.priority === "high" ? colors.danger : colors.warning;

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

      <View style={{ flex: 1, gap: 2 }}>
        <Text
          style={[
            styles.itemTitle,
            { color: task.done ? colors.textTertiary : colors.text },
            task.done && styles.strikethrough,
          ]}
        >
          {task.title}
        </Text>
        {task.due_time != null && (
          <Text style={[styles.time, { color: colors.textTertiary }]}>
            {task.due_time}
          </Text>
        )}
      </View>

      {task.priority !== "low" && (
        <View
          style={[
            styles.priorityBadge,
            { backgroundColor: priorityColor + "20" },
          ]}
        >
          <Text style={[styles.priorityBadgeText, { color: priorityColor }]}>
            {task.priority === "high" ? "Alta" : "Media"}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function EmptyTasks() {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.emptyState, { backgroundColor: colors.bgSubtle }]}>
      <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
        No tienes tareas para hoy
      </Text>
      <Pressable
        onPress={() => router.push("/task/new" as never)}
        style={[styles.emptyAction, { backgroundColor: colors.indigoSoft }]}
      >
        <Text style={[styles.emptyActionText, { color: colors.primary }]}>
          Agregar tarea
        </Text>
      </Pressable>
    </View>
  );
}

export function TasksSection({
  tasks,
  doneTasks,
  onToggle,
}: {
  tasks: Task[];
  doneTasks: number;
  onToggle: (id: string) => void;
}) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.section}>
      <SectionHeader
        label="Tareas"
        count={tasks.length > 0 ? `${doneTasks}/${tasks.length}` : undefined}
      />
      {tasks.length === 0 ? (
        <EmptyTasks />
      ) : (
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {tasks.map((task, i) => (
            <TaskItem
              key={task.id}
              task={task}
              isLast={i === tasks.length - 1}
              onToggle={() => onToggle(task.id)}
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
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "400",
  },
  strikethrough: {
    textDecorationLine: "line-through",
  },
  time: {
    fontSize: 12,
  },
  priorityBadge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginLeft: 8,
  },
  priorityBadgeText: {
    fontSize: 11,
    fontWeight: "600",
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
