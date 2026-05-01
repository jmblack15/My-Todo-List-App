import { StyleSheet, View } from "react-native";

import { useAppTheme } from "@/hooks/useAppTheme";
import type { Task } from "@/types";

import { TaskRow } from "./TaskRow";

export function TaskCard({
  tasks,
  onToggle,
  onDelete,
  onEdit,
}: {
  tasks: Task[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}) {
  const { colors } = useAppTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      {tasks.map((task, i) => (
        <TaskRow
          key={task.id}
          task={task}
          isLast={i === tasks.length - 1}
          onToggle={() => onToggle(task.id)}
          onDelete={() => onDelete(task.id)}
          onEdit={() => onEdit(task.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    overflow: "hidden",
  },
});
