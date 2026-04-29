import { StyleSheet, Text, View } from "react-native";

import { SectionHeader } from "@/components/ui/SectionHeader";
import { useAppTheme } from "@/hooks/useAppTheme";
import type { ScheduleBlock } from "@/types";
import { isBlockActive, isBlockPast } from "@/utils/scheduleUtils";

function ScheduleItem({ block }: { block: ScheduleBlock }) {
  const { colors } = useAppTheme();
  const active = isBlockActive(block);
  const past = isBlockPast(block);

  return (
    <View
      style={[
        styles.item,
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
        <Text style={[styles.title, { color: colors.text }]}>{block.title}</Text>
        <Text style={[styles.time, { color: colors.textSecondary }]}>
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

export function ScheduleSection({ blocks }: { blocks: ScheduleBlock[] }) {
  if (blocks.length === 0) return null;

  return (
    <View style={styles.section}>
      <SectionHeader label="Horario" count={String(blocks.length)} />
      {blocks.map((block) => (
        <ScheduleItem key={block.id} block={block} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 28,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: "500",
  },
  time: {
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
});
