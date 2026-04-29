import { getHours } from "date-fns";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/hooks/useAppTheme";

function getGreeting(): string {
  const h = getHours(new Date());
  if (h >= 5 && h < 12) return "Buenos días";
  if (h >= 12 && h < 18) return "Buenas tardes";
  return "Buenas noches";
}

function getFormattedDate(): string {
  const raw = format(new Date(), "EEEE, d 'de' MMMM", { locale: es });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function TodayHeader({
  doneTasks,
  totalTasks,
  completedHabits,
  totalHabits,
}: {
  doneTasks: number;
  totalTasks: number;
  completedHabits: number;
  totalHabits: number;
}) {
  const { colors } = useAppTheme();

  const statLabel = [
    totalTasks > 0 ? `${doneTasks}/${totalTasks} tareas` : "Sin tareas hoy",
    totalHabits > 0 ? `${completedHabits}/${totalHabits} hábitos` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <View style={styles.container}>
      <Text style={[styles.greeting, { color: colors.text }]}>
        {getGreeting()}
      </Text>
      <Text style={[styles.date, { color: colors.textSecondary }]}>
        {getFormattedDate()}
      </Text>
      <View style={[styles.pill, { backgroundColor: colors.bgSubtle }]}>
        <Text style={[styles.pillText, { color: colors.textSecondary }]}>
          {statLabel}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 28,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  date: {
    fontSize: 13,
    marginTop: 4,
  },
  pill: {
    alignSelf: "flex-start",
    marginTop: 12,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  pillText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
