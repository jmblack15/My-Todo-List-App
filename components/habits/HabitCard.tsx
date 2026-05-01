import { StyleSheet, View } from "react-native";

import { useAppTheme } from "@/hooks/useAppTheme";
import type { Habit } from "@/types";

import { HabitRow } from "./HabitRow";

export function HabitCard({
  habits,
  showToggle,
  onToggle,
  onDelete,
  onEdit,
}: {
  habits: Habit[];
  showToggle: boolean;
  onToggle?: (id: string) => void;
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
      {habits.map((habit, i) => (
        <HabitRow
          key={habit.id}
          habit={habit}
          isLast={i === habits.length - 1}
          showToggle={showToggle}
          onToggle={onToggle ? () => onToggle(habit.id) : undefined}
          onDelete={() => onDelete(habit.id)}
          onEdit={() => onEdit(habit.id)}
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
