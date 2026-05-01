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

import { HabitCard } from "@/components/habits/HabitCard";
import { HabitsEmptyState } from "@/components/habits/HabitsEmptyState";
import { InactiveSection } from "@/components/habits/InactiveSection";
import { ProgressCard } from "@/components/habits/ProgressCard";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useHabitStore } from "@/stores/useHabitStore";
import type { Habit } from "@/types";

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

  const handleEdit = (id: string) => {
    router.push(`/habit/${id}` as never);
  };

  const activeToday = todayHabits.filter((h) => h.active);
  const inactive = habits.filter((h) => !h.active);

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
        <ScreenHeader
          title="Hábitos"
          subtitle={`${activeToday.length} activo${activeToday.length !== 1 ? "s" : ""}`}
          onAdd={() => router.push("/habit/new" as never)}
        />

        {activeToday.length > 0 && (
          <View style={{ marginBottom: 28 }}>
            <ProgressCard completed={completedCount} total={activeToday.length} />
          </View>
        )}

        {activeToday.length === 0 ? (
          <View style={{ marginTop: 8 }}>
            <HabitsEmptyState />
          </View>
        ) : (
          areas.map((area) => (
            <View key={area} style={{ marginBottom: 24 }}>
              {areas.length > 1 && (
                <SectionHeader label={area} count={grouped[area].length} />
              )}
              <HabitCard
                habits={grouped[area]}
                showToggle
                onToggle={(id) => toggleToday(id, today)}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            </View>
          ))
        )}

        {inactive.length > 0 && (
          <InactiveSection habits={inactive} onDelete={handleDelete} onEdit={handleEdit} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
});
