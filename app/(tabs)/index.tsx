import { Ionicons } from "@expo/vector-icons";
import { format, getDay, getHours } from "date-fns";
import { es } from "date-fns/locale";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppTheme } from "@/hooks/useAppTheme";
import { useHabitStore } from "@/stores/useHabitStore";
import { useScheduleStore } from "@/stores/useScheduleStore";
import { useTaskStore } from "@/stores/useTaskStore";
import type { Habit, ScheduleBlock, Task } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

const PRIORITY_ORDER: Record<Task["priority"], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const diff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (diff !== 0) return diff;
    if (!a.due_time && !b.due_time) return 0;
    if (!a.due_time) return 1;
    if (!b.due_time) return -1;
    return a.due_time.localeCompare(b.due_time);
  });
}

function currentTime(): string {
  return format(new Date(), "HH:mm");
}

function isBlockActive(block: ScheduleBlock): boolean {
  const t = currentTime();
  return block.start_time <= t && t < block.end_time;
}

function isBlockPast(block: ScheduleBlock): boolean {
  return block.end_time <= currentTime();
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRect({
  height = 16,
  width = "100%",
}: {
  height?: number;
  width?: number | string;
}) {
  const { colors } = useAppTheme();
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        animStyle,
        {
          height,
          width: width as number,
          borderRadius: 8,
          backgroundColor: colors.bgSubtle,
        },
      ]}
    />
  );
}

function SkeletonSection({ itemCount }: { itemCount: number }) {
  return (
    <View style={{ marginBottom: 24 }}>
      <SkeletonRect height={11} width="32%" />
      {Array.from({ length: itemCount }).map((_, i) => (
        <View key={i} style={{ marginTop: 12 }}>
          <SkeletonRect height={56} />
        </View>
      ))}
    </View>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ label, count }: { label: string; count?: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.sectionHeaderRow}>
      <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
        {label}
      </Text>
      {count != null && (
        <Text style={[styles.sectionCount, { color: colors.textTertiary }]}>
          {count}
        </Text>
      )}
    </View>
  );
}

// ─── Schedule block ───────────────────────────────────────────────────────────

function ScheduleItem({ block }: { block: ScheduleBlock }) {
  const { colors } = useAppTheme();
  const active = isBlockActive(block);
  const past = isBlockPast(block);

  return (
    <View
      style={[
        styles.scheduleItem,
        {
          opacity: past && !active ? 0.45 : 1,
          backgroundColor: active ? block.color + "18" : colors.card,
          borderLeftWidth: active ? 3 : 0,
          borderLeftColor: active ? block.color : "transparent",
          borderWidth: active ? 0 : StyleSheet.hairlineWidth,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={[styles.scheduleTitle, { color: colors.text }]}>
          {block.title}
        </Text>
        <Text style={[styles.scheduleTime, { color: colors.textSecondary }]}>
          {block.start_time} – {block.end_time}
        </Text>
      </View>
      {active && (
        <View style={[styles.nowBadge, { backgroundColor: block.color }]}>
          <Text style={styles.nowBadgeText}>Ahora</Text>
        </View>
      )}
    </View>
  );
}

// ─── Habit item ───────────────────────────────────────────────────────────────

function HabitItem({
  habit,
  onToggle,
  isLast,
}: {
  habit: Habit;
  onToggle: () => void;
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

  return (
    <Pressable
      onPress={handlePress}
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
          styles.listItemTitle,
          { color: habit.completed_today ? colors.textTertiary : colors.text },
          habit.completed_today && styles.strikethrough,
        ]}
      >
        {habit.title}
      </Text>

      {habit.streak >= 3 && (
        <Text style={[styles.streakText, { color: colors.textSecondary }]}>
          🔥 {habit.streak}
        </Text>
      )}
    </Pressable>
  );
}

// ─── Task item ────────────────────────────────────────────────────────────────

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
            styles.listItemTitle,
            { color: task.done ? colors.textTertiary : colors.text },
            task.done && styles.strikethrough,
          ]}
        >
          {task.title}
        </Text>
        {task.due_time != null && (
          <Text style={[styles.taskTime, { color: colors.textTertiary }]}>
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

// ─── FAB ──────────────────────────────────────────────────────────────────────

function FAB({ bottomInset }: { bottomInset: number }) {
  const { colors } = useAppTheme();
  const [open, setOpen] = useState(false);
  const progress = useSharedValue(0);

  const toggle = () => {
    const next = open ? 0 : 1;
    progress.value = withTiming(next, { duration: 200 });
    if (!open) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setOpen((v) => !v);
  };

  const close = () => {
    progress.value = withTiming(0, { duration: 200 });
    setOpen(false);
  };

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${interpolate(progress.value, [0, 1], [0, 45])}deg` },
    ],
  }));

  const opt1Style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: interpolate(progress.value, [0, 1], [24, 0]) }],
  }));

  const opt2Style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: interpolate(progress.value, [0, 1], [48, 0]) }],
  }));

  const handleNewTask = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    close();
    router.push("/task/new" as never);
  };

  const handleNewHabit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    close();
    router.push("/habit/new" as never);
  };

  return (
    <>
      {open && (
        <Pressable style={StyleSheet.absoluteFillObject} onPress={close} />
      )}

      <View style={[styles.fabContainer, { bottom: bottomInset + 16 }]}>
        <Animated.View style={opt2Style} pointerEvents={open ? "auto" : "none"}>
          <View style={styles.fabOption}>
            <View
              style={[
                styles.fabOptionLabel,
                {
                  backgroundColor: colors.card,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.fabOptionText, { color: colors.text }]}>
                Nuevo hábito
              </Text>
            </View>
            <Pressable
              onPress={handleNewHabit}
              style={[
                styles.fabMini,
                {
                  backgroundColor: colors.card,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons name="leaf-outline" size={20} color={colors.primary} />
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View style={opt1Style} pointerEvents={open ? "auto" : "none"}>
          <View style={styles.fabOption}>
            <View
              style={[
                styles.fabOptionLabel,
                {
                  backgroundColor: colors.card,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.fabOptionText, { color: colors.text }]}>
                Nueva tarea
              </Text>
            </View>
            <Pressable
              onPress={handleNewTask}
              style={[
                styles.fabMini,
                {
                  backgroundColor: colors.card,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons
                name="checkbox-outline"
                size={20}
                color={colors.primary}
              />
            </Pressable>
          </View>
        </Animated.View>

        <Pressable
          onPress={toggle}
          style={[styles.fabMain, { backgroundColor: colors.primary }]}
        >
          <Animated.View style={iconStyle}>
            <Ionicons name="add" size={28} color="white" />
          </Animated.View>
        </Pressable>
      </View>
    </>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  const { todayTasks, loadTodayTasks, toggleDone } = useTaskStore();
  const { todayHabits, loadTodayHabits, toggleToday } = useHabitStore();
  const { todayBlocks, loadTodayBlocks } = useScheduleStore();

  const today = format(new Date(), "yyyy-MM-dd");

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const dayOfWeek = getDay(new Date());
    await Promise.all([
      loadTodayTasks(today),
      loadTodayHabits(today),
      loadTodayBlocks(dayOfWeek),
    ]);
  }, [loadTodayTasks, loadTodayHabits, loadTodayBlocks]);

  useEffect(() => {
    loadData().finally(() => setIsLoading(false));
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  }, [loadData]);

  const completedHabits = todayHabits.filter((h) => h.completed_today).length;
  const habitProgress =
    todayHabits.length > 0 ? completedHabits / todayHabits.length : 0;
  const sortedTasks = sortTasks(todayTasks);
  const sortedBlocks = [...todayBlocks].sort((a, b) =>
    a.start_time.localeCompare(b.start_time),
  );

  const doneTasks = sortedTasks.filter((t) => t.done).length;
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
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* ── Header ── */}
        <View style={{ marginBottom: 28 }}>
          <Text style={[styles.greeting, { color: colors.text }]}>
            {getGreeting()}
          </Text>
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>
            {getFormattedDate()}
          </Text>
          <View style={[styles.statPill, { backgroundColor: colors.bgSubtle }]}>
            <Text
              style={[styles.statPillText, { color: colors.textSecondary }]}
            >
              {sortedTasks.length > 0
                ? `${doneTasks}/${sortedTasks.length} tareas`
                : "Sin tareas hoy"}
              {todayHabits.length > 0 &&
                ` · ${completedHabits}/${todayHabits.length} hábitos`}
            </Text>
          </View>
        </View>

        {isLoading ? (
          <>
            <SkeletonSection itemCount={1} />
            <SkeletonSection itemCount={3} />
            <SkeletonSection itemCount={3} />
          </>
        ) : (
          <>
            {/* ── Horario ── */}
            {sortedBlocks.length > 0 && (
              <View style={{ marginBottom: 28 }}>
                <SectionHeader
                  label="Horario"
                  count={String(sortedBlocks.length)}
                />
                {sortedBlocks.map((block) => (
                  <ScheduleItem key={block.id} block={block} />
                ))}
              </View>
            )}

            {/* ── Hábitos ── */}
            <View style={{ marginBottom: 28 }}>
              <SectionHeader
                label="Hábitos"
                count={
                  todayHabits.length > 0
                    ? `${completedHabits}/${todayHabits.length}`
                    : undefined
                }
              />
              {todayHabits.length === 0 ? (
                <EmptyState
                  message="No tienes hábitos activos"
                  action="Agregar hábito"
                  onPress={() => router.push("/habit/new" as never)}
                />
              ) : (
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  {/* Progress bar */}
                  <View
                    style={[
                      styles.progressTrack,
                      { backgroundColor: colors.bgSubtle },
                    ]}
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
                  <Text
                    style={[
                      styles.progressLabel,
                      { color: colors.textTertiary },
                    ]}
                  >
                    {completedHabits} de {todayHabits.length} completados
                  </Text>
                  {todayHabits.map((habit, i) => (
                    <HabitItem
                      key={habit.id}
                      habit={habit}
                      isLast={i === todayHabits.length - 1}
                      onToggle={() => toggleToday(habit.id, today)}
                    />
                  ))}
                </View>
              )}
            </View>

            {/* ── Tareas ── */}
            <View style={{ marginBottom: 28 }}>
              <SectionHeader
                label="Tareas"
                count={
                  sortedTasks.length > 0
                    ? `${doneTasks}/${sortedTasks.length}`
                    : undefined
                }
              />
              {sortedTasks.length === 0 ? (
                <EmptyState
                  message="No tienes tareas para hoy"
                  action="Agregar tarea"
                  onPress={() => router.push("/task/new" as never)}
                />
              ) : (
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  {sortedTasks.map((task, i) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      isLast={i === sortedTasks.length - 1}
                      onToggle={() => toggleDone(task.id)}
                    />
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      <FAB bottomInset={insets.bottom + tabBarHeight} />
    </View>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({
  message,
  action,
  onPress,
}: {
  message: string;
  action: string;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.emptyState, { backgroundColor: colors.bgSubtle }]}>
      <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
        {message}
      </Text>
      <Pressable
        onPress={onPress}
        style={[styles.emptyAction, { backgroundColor: colors.indigoSoft }]}
      >
        <Text style={[styles.emptyActionText, { color: colors.primary }]}>
          {action}
        </Text>
      </Pressable>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  dateText: {
    fontSize: 13,
    marginTop: 4,
  },
  statPill: {
    alignSelf: "flex-start",
    marginTop: 12,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  statPillText: {
    fontSize: 12,
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
  sectionCount: {
    fontSize: 11,
    fontWeight: "500",
  },
  scheduleItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  scheduleTitle: {
    fontSize: 15,
    fontWeight: "500",
  },
  scheduleTime: {
    fontSize: 12,
    marginTop: 2,
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
  listItemTitle: {
    fontSize: 15,
    fontWeight: "400",
  },
  strikethrough: {
    textDecorationLine: "line-through",
  },
  habitIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  streakText: {
    fontSize: 12,
  },
  taskTime: {
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
  fabContainer: {
    position: "absolute",
    right: 20,
    alignItems: "flex-end",
    gap: 12,
  },
  fabOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  fabOptionLabel: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  fabOptionText: {
    fontSize: 14,
    fontWeight: "500",
  },
  fabMini: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  fabMain: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
