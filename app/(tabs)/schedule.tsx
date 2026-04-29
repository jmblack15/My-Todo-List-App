import { getDay } from "date-fns";
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

import { BlockCard } from "@/components/schedule/BlockCard";
import { DaySelector } from "@/components/schedule/DaySelector";
import { ScheduleEmptyState } from "@/components/schedule/ScheduleEmptyState";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useScheduleStore } from "@/stores/useScheduleStore";
import { blockDurationMinutes } from "@/utils/scheduleUtils";

const DAY_NAMES = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];

export default function ScheduleScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { blocks, loadBlocks, deleteBlock } = useScheduleStore();
  const [selectedDay, setSelectedDay] = useState(() => getDay(new Date()));
  const [refreshing, setRefreshing] = useState(false);
  const initialized = useRef(false);
  const today = getDay(new Date());

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      loadBlocks();
    }
  }, [loadBlocks]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadBlocks();
    setRefreshing(false);
  }, [loadBlocks]);

  const handleDayChange = (day: number) => {
    Haptics.selectionAsync();
    setSelectedDay(day);
  };

  const handleDelete = (id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    deleteBlock(id);
  };

  const dayBlocks = blocks
    .filter((b) => b.day_of_week === selectedDay)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  const totalMinutes = dayBlocks.reduce(
    (sum, b) => sum + blockDurationMinutes(b),
    0,
  );
  const totalHours = (totalMinutes / 60).toFixed(1);

  const dayName = DAY_NAMES[selectedDay];
  const subtitle =
    dayBlocks.length > 0
      ? `${dayBlocks.length} bloque${dayBlocks.length !== 1 ? "s" : ""} · ${totalHours}h`
      : dayName.charAt(0).toUpperCase() + dayName.slice(1);

  const tabBarHeight = 49;
  const scrollBottomPad = insets.bottom + tabBarHeight + 32;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 20,
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
        <View style={styles.headerPad}>
          <ScreenHeader
            title="Horario"
            subtitle={subtitle}
            onAdd={() => router.push("/schedule/new" as never)}
          />
        </View>

        <View
          style={[
            styles.daySelectorWrapper,
            {
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <DaySelector
            selected={selectedDay}
            today={today}
            onChange={handleDayChange}
          />
        </View>

        <View style={styles.blocksPad}>
          {dayBlocks.length === 0 ? (
            <ScheduleEmptyState dayLabel={dayName} />
          ) : (
            <View style={{ gap: 10 }}>
              {dayBlocks.map((block) => (
                <BlockCard
                  key={block.id}
                  block={block}
                  isToday={selectedDay === today}
                  onDelete={() => handleDelete(block.id)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  headerPad: {
    paddingHorizontal: 20,
  },
  daySelectorWrapper: {
    paddingHorizontal: 12,
    paddingBottom: 2,
  },
  blocksPad: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
});
