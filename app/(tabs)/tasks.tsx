import { format } from "date-fns";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CompletedSection } from "@/components/tasks/CompletedSection";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TasksEmptyState } from "@/components/tasks/TasksEmptyState";
import { FilterChip } from "@/components/ui/FilterChip";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useTaskStore } from "@/stores/useTaskStore";
import { sortTasks } from "@/utils/taskUtils";

type Filter = "all" | "today" | "high";

const FILTER_LABELS: Record<Filter, string> = {
  all: "Todas",
  today: "Hoy",
  high: "Alta prioridad",
};

export default function TasksScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { tasks, loading, loadTasks, toggleDone, deleteTask } = useTaskStore();
  const [filter, setFilter] = useState<Filter>("all");
  const [refreshing, setRefreshing] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      loadTasks();
    }
  }, [loadTasks]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  }, [loadTasks]);

  const handleDelete = (id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    deleteTask(id);
  };

  const handleEdit = (id: string) => {
    router.push(`/task/${id}` as never);
  };

  const today = format(new Date(), "yyyy-MM-dd");

  const pending = tasks.filter((t) => !t.done && !t.skipped);
  const completed = tasks.filter((t) => t.done);

  const filtered = (() => {
    if (filter === "today")
      return sortTasks(pending.filter((t) => t.due_date === today || !t.due_date));
    if (filter === "high")
      return sortTasks(pending.filter((t) => t.priority === "high"));
    return pending;
  })();

  const todayGroup = sortTasks(pending.filter((t) => t.due_date === today));
  const upcomingGroup = sortTasks(
    pending.filter((t) => t.due_date != null && t.due_date > today),
  );
  const undatedGroup = sortTasks(pending.filter((t) => t.due_date == null));

  const tabBarHeight = 49;
  const scrollBottomPad = insets.bottom + tabBarHeight + 32;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingHorizontal: 20,
          paddingBottom: scrollBottomPad,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <ScreenHeader
          title="Tareas"
          subtitle={`${pending.length} pendiente${pending.length !== 1 ? "s" : ""}`}
          onAdd={() => router.push("/task/new" as never)}
        />

        <View style={styles.filterRow}>
          {(["all", "today", "high"] as Filter[]).map((f) => (
            <FilterChip
              key={f}
              label={FILTER_LABELS[f]}
              active={filter === f}
              onPress={() => setFilter(f)}
            />
          ))}
        </View>

        {!loading && tasks.length === 0 ? (
          <View style={{ marginTop: 40 }}>
            <TasksEmptyState message="No tienes tareas aún" />
          </View>
        ) : filter !== "all" ? (
          <View style={{ marginTop: 8 }}>
            {filtered.length === 0 ? (
              <TasksEmptyState
                message={
                  filter === "today"
                    ? "Sin tareas para hoy"
                    : "Sin tareas de alta prioridad"
                }
              />
            ) : (
              <>
                <SectionHeader
                  label={filter === "today" ? "Hoy" : "Alta prioridad"}
                  count={filtered.length}
                />
                <TaskCard
                  tasks={filtered}
                  onToggle={toggleDone}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                />
              </>
            )}
          </View>
        ) : (
          <View style={{ marginTop: 8 }}>
            {todayGroup.length > 0 && (
              <View style={{ marginBottom: 24 }}>
                <SectionHeader label="Hoy" count={todayGroup.length} />
                <TaskCard
                  tasks={todayGroup}
                  onToggle={toggleDone}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                />
              </View>
            )}

            {upcomingGroup.length > 0 && (
              <View style={{ marginBottom: 24 }}>
                <SectionHeader label="Próximas" count={upcomingGroup.length} />
                <TaskCard
                  tasks={upcomingGroup}
                  onToggle={toggleDone}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                />
              </View>
            )}

            {undatedGroup.length > 0 && (
              <View style={{ marginBottom: 24 }}>
                <SectionHeader label="Sin fecha" count={undatedGroup.length} />
                <TaskCard
                  tasks={undatedGroup}
                  onToggle={toggleDone}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                />
              </View>
            )}

            {pending.length === 0 && completed.length === 0 && (
              <TasksEmptyState message="No tienes tareas aún" />
            )}
          </View>
        )}

        {completed.length > 0 && (
          <CompletedSection
            tasks={completed}
            onToggle={toggleDone}
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
});
