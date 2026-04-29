import { Ionicons } from "@expo/vector-icons";
import { format, isThisWeek, isToday, isTomorrow } from "date-fns";
import { es } from "date-fns/locale";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppTheme } from "@/hooks/useAppTheme";
import { useTaskStore } from "@/stores/useTaskStore";
import type { Task } from "@/types";
import { sortTasks } from "@/utils/taskUtils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

type Filter = "all" | "today" | "high";

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

// ─── Filter chip ──────────────────────────────────────────────────────────────

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? colors.primary : colors.bgSubtle,
          borderColor: active ? colors.primary : "transparent",
        },
      ]}
    >
      <Text
        style={[
          styles.chipText,
          { color: active ? "#FFFFFF" : colors.textSecondary },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ label, count }: { label: string; count?: number }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.sectionHeaderRow}>
      <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
        {label}
      </Text>
      {count != null && (
        <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
          {count}
        </Text>
      )}
    </View>
  );
}

// ─── Task row ─────────────────────────────────────────────────────────────────

function TaskRow({
  task,
  onToggle,
  onDelete,
  isLast,
}: {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
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
      {
        text: "Eliminar",
        style: "destructive",
        onPress: onDelete,
      },
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
        styles.taskRow,
        !isLast && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
      ]}
    >
      {/* Checkbox */}
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

      {/* Content */}
      <View style={{ flex: 1, gap: 3 }}>
        <Text
          style={[
            styles.taskTitle,
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
                  style={[
                    styles.dateBadge,
                    { backgroundColor: colors.bgSubtle },
                  ]}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={10}
                    color={colors.textTertiary}
                  />
                  <Text
                    style={[styles.metaText, { color: colors.textTertiary }]}
                  >
                    {formatDueDate(task.due_date)}
                  </Text>
                </View>
              )}
            {task.due_time != null && (
              <View
                style={[styles.dateBadge, { backgroundColor: colors.bgSubtle }]}
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

      {/* Priority badge */}
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

// ─── Task card (grouped section) ──────────────────────────────────────────────

function TaskCard({
  tasks,
  onToggle,
  onDelete,
}: {
  tasks: Task[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
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
        />
      ))}
    </View>
  );
}

// ─── Completed section (collapsible) ─────────────────────────────────────────

function CompletedSection({
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
    <View style={{ marginBottom: 28 }}>
      <Pressable onPress={toggle} style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
          Completadas
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
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

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.emptyState, { backgroundColor: colors.bgSubtle }]}>
      <Ionicons name="checkbox-outline" size={28} color={colors.textTertiary} />
      <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
        {message}
      </Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

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

  const today = format(new Date(), "yyyy-MM-dd");

  const pending = tasks.filter((t) => !t.done && !t.skipped);
  const completed = tasks.filter((t) => t.done);

  // Apply filter
  const filtered = (() => {
    if (filter === "today")
      return sortTasks(
        pending.filter((t) => t.due_date === today || !t.due_date),
      );
    if (filter === "high")
      return sortTasks(pending.filter((t) => t.priority === "high"));
    return pending;
  })();

  // Group for "all" view
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
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.screenTitle, { color: colors.text }]}>
              Tareas
            </Text>
            <Text
              style={[styles.screenSubtitle, { color: colors.textTertiary }]}
            >
              {pending.length} pendiente{pending.length !== 1 ? "s" : ""}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/task/new" as never)}
            style={[styles.addButton, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="add" size={22} color="white" />
          </Pressable>
        </View>

        {/* ── Filters ── */}
        <View style={styles.filterRow}>
          {(["all", "today", "high"] as Filter[]).map((f) => (
            <FilterChip
              key={f}
              label={
                f === "all" ? "Todas" : f === "today" ? "Hoy" : "Alta prioridad"
              }
              active={filter === f}
              onPress={() => setFilter(f)}
            />
          ))}
        </View>

        {/* ── Content ── */}
        {!loading && tasks.length === 0 ? (
          <View style={{ marginTop: 40 }}>
            <EmptyState message="No tienes tareas aún" />
          </View>
        ) : filter !== "all" ? (
          /* Flat list for filtered views */
          <View style={{ marginTop: 8 }}>
            {filtered.length === 0 ? (
              <EmptyState
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
                />
              </>
            )}
          </View>
        ) : (
          /* Grouped view */
          <View style={{ marginTop: 8 }}>
            {todayGroup.length > 0 && (
              <View style={{ marginBottom: 24 }}>
                <SectionHeader label="Hoy" count={todayGroup.length} />
                <TaskCard
                  tasks={todayGroup}
                  onToggle={toggleDone}
                  onDelete={handleDelete}
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
                />
              </View>
            )}

            {pending.length === 0 && completed.length === 0 && (
              <EmptyState message="No tienes tareas aún" />
            )}
          </View>
        )}

        {/* ── Completed ── */}
        {completed.length > 0 && (
          <CompletedSection
            tasks={completed}
            onToggle={toggleDone}
            onDelete={handleDelete}
          />
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontSize: 13,
    marginTop: 3,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "500",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    overflow: "hidden",
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
  },
  taskTitle: {
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
  dateBadge: {
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
  emptyState: {
    borderRadius: 16,
    alignItems: "center",
    paddingVertical: 36,
    gap: 10,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: "500",
  },
});
