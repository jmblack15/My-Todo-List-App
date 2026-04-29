import { format, getDay } from "date-fns";
import { useCallback, useEffect, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FAB } from "@/components/today/FAB";
import { HabitsSection } from "@/components/today/HabitsSection";
import { ScheduleSection } from "@/components/today/ScheduleSection";
import { TasksSection } from "@/components/today/TasksSection";
import { TodayHeader } from "@/components/today/TodayHeader";
import { SkeletonSection } from "@/components/ui/SkeletonLoader";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useHabitStore } from "@/stores/useHabitStore";
import { useScheduleStore } from "@/stores/useScheduleStore";
import { useTaskStore } from "@/stores/useTaskStore";
import { sortTasks } from "@/utils/taskUtils";

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
        <TodayHeader
          doneTasks={doneTasks}
          totalTasks={sortedTasks.length}
          completedHabits={completedHabits}
          totalHabits={todayHabits.length}
        />

        {isLoading ? (
          <>
            <SkeletonSection itemCount={1} />
            <SkeletonSection itemCount={3} />
            <SkeletonSection itemCount={3} />
          </>
        ) : (
          <>
            <ScheduleSection blocks={sortedBlocks} />
            <HabitsSection
              habits={todayHabits}
              completedHabits={completedHabits}
              habitProgress={habitProgress}
              today={today}
              onToggle={toggleToday}
            />
            <TasksSection
              tasks={sortedTasks}
              doneTasks={doneTasks}
              onToggle={toggleDone}
            />
          </>
        )}
      </ScrollView>

      <FAB bottomInset={insets.bottom + tabBarHeight} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
});
