import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
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
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppTheme } from "@/hooks/useAppTheme";
import { useHabitStore } from "@/stores/useHabitStore";
import type { Habit } from "@/types";

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressCard({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) {
  const { colors } = useAppTheme();
  const progress = total > 0 ? completed / total : 0;
  const allDone = total > 0 && completed === total;

  return (
    <View
      style={[
        styles.progressCard,
        {
          backgroundColor: allDone ? colors.primary + "14" : colors.card,
          borderColor: allDone ? colors.primary + "30" : colors.border,
        },
      ]}
    >
      <View style={styles.progressCardHeader}>
        <Text
          style={[
            styles.progressLabel,
            { color: allDone ? colors.primary : colors.textSecondary },
          ]}
        >
          {allDone
            ? "¡Todo completado hoy!"
            : `${completed} de ${total} completados hoy`}
        </Text>
        <Text
          style={[
            styles.progressFraction,
            { color: allDone ? colors.primary : colors.textTertiary },
          ]}
        >
          {completed}/{total}
        </Text>
      </View>
      <View
        style={[styles.progressTrack, { backgroundColor: colors.bgSubtle }]}
      >
        <View
          style={[
            styles.progressFill,
            {
              width: `${progress * 100}%`,
              backgroundColor: allDone ? colors.primary : colors.primary,
            },
          ]}
        />
      </View>
    </View>
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

// ─── Habit row ────────────────────────────────────────────────────────────────

function HabitRow({
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
        styles.habitRow,
        !isLast && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
      ]}
    >
      {/* Icon */}
      <View style={[styles.habitIcon, { backgroundColor: habit.color + "20" }]}>
        <Text style={styles.habitEmoji}>{habit.icon}</Text>
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        <Text
          style={[
            styles.habitTitle,
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
        <View style={styles.habitMeta}>
          <Text style={[styles.habitMetaText, { color: colors.textTertiary }]}>
            {habit.frequency === "daily" ? "Diario" : "Semanal"}
          </Text>
          {habit.streak > 0 && (
            <>
              <Text
                style={[styles.habitMetaText, { color: colors.textTertiary }]}
              >
                ·
              </Text>
              <Text
                style={[styles.habitMetaText, { color: colors.textTertiary }]}
              >
                🔥 {habit.streak}
              </Text>
            </>
          )}
        </View>
      </View>

      {/* Checkbox */}
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

// ─── Collapsible inactive section ─────────────────────────────────────────────

function InactiveSection({
  habits,
  onDelete,
}: {
  habits: Habit[];
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
          Inactivos
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
            {habits.length}
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
              showToggle={false}
              onDelete={() => onDelete(habit.id)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.emptyState, { backgroundColor: colors.bgSubtle }]}>
      <Ionicons name="leaf-outline" size={28} color={colors.textTertiary} />
      <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
        No tienes hábitos activos
      </Text>
      <Pressable
        onPress={() => router.push("/habit/new" as never)}
        style={[styles.emptyAction, { backgroundColor: colors.indigoSoft }]}
      >
        <Text style={[styles.emptyActionText, { color: colors.primary }]}>
          Crear hábito
        </Text>
      </Pressable>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HabitsScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const {
    habits,
    todayHabits,
    loadHabits,
    loadTodayHabits,
    toggleToday,
    deleteHabit,
  } = useHabitStore();
  const [refreshing, setRefreshing] = useState(false);
  const initialized = useRef(false);

  const today = format(new Date(), "yyyy-MM-dd");

  const load = useCallback(async () => {
    await Promise.all([loadHabits(), loadTodayHabits(today)]);
  }, [loadHabits, loadTodayHabits, today]);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      load();
    }
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const handleDelete = (id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    deleteHabit(id);
  };

  // Active habits (for today's view with completion toggle)
  const activeToday = todayHabits.filter((h) => h.active);

  // Inactive habits (from full list)
  const inactive = habits.filter((h) => !h.active);

  // Group active habits by area
  const grouped = activeToday.reduce<Record<string, Habit[]>>((acc, habit) => {
    const area = habit.area ?? "General";
    if (!acc[area]) acc[area] = [];
    acc[area].push(habit);
    return acc;
  }, {});

  const areas = Object.keys(grouped).sort((a, b) =>
    a === "General" ? 1 : b === "General" ? -1 : a.localeCompare(b),
  );

  const completedCount = activeToday.filter((h) => h.completed_today).length;
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
              Hábitos
            </Text>
            <Text
              style={[styles.screenSubtitle, { color: colors.textTertiary }]}
            >
              {activeToday.length} activo{activeToday.length !== 1 ? "s" : ""}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/habit/new" as never)}
            style={[styles.addButton, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="add" size={22} color="white" />
          </Pressable>
        </View>

        {/* ── Progress ── */}
        {activeToday.length > 0 && (
          <View style={{ marginBottom: 28 }}>
            <ProgressCard
              completed={completedCount}
              total={activeToday.length}
            />
          </View>
        )}

        {/* ── Habit list ── */}
        {activeToday.length === 0 ? (
          <View style={{ marginTop: 8 }}>
            <EmptyState />
          </View>
        ) : (
          areas.map((area) => (
            <View key={area} style={{ marginBottom: 24 }}>
              {areas.length > 1 && (
                <SectionHeader label={area} count={grouped[area].length} />
              )}
              <View
                style={[
                  styles.card,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                {grouped[area].map((habit, i) => (
                  <HabitRow
                    key={habit.id}
                    habit={habit}
                    isLast={i === grouped[area].length - 1}
                    showToggle
                    onToggle={() => toggleToday(habit.id, today)}
                    onDelete={() => handleDelete(habit.id)}
                  />
                ))}
              </View>
            </View>
          ))
        )}

        {/* ── Inactive ── */}
        {inactive.length > 0 && (
          <InactiveSection habits={inactive} onDelete={handleDelete} />
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
  progressCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  progressCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  progressFraction: {
    fontSize: 13,
    fontWeight: "600",
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
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
  habitRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  habitIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  habitEmoji: {
    fontSize: 20,
  },
  habitTitle: {
    fontSize: 15,
    fontWeight: "500",
  },
  strikethrough: {
    textDecorationLine: "line-through",
  },
  habitMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  habitMetaText: {
    fontSize: 12,
  },
  emptyState: {
    borderRadius: 16,
    alignItems: "center",
    paddingVertical: 40,
    gap: 10,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: "500",
  },
  emptyAction: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 4,
  },
  emptyActionText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
