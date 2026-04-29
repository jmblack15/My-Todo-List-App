import { StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/hooks/useAppTheme";

export function ProgressCard({
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
        styles.card,
        {
          backgroundColor: allDone ? colors.primary + "14" : colors.card,
          borderColor: allDone ? colors.primary + "30" : colors.border,
        },
      ]}
    >
      <View style={styles.header}>
        <Text
          style={[
            styles.label,
            { color: allDone ? colors.primary : colors.textSecondary },
          ]}
        >
          {allDone
            ? "¡Todo completado hoy!"
            : `${completed} de ${total} completados hoy`}
        </Text>
        <Text
          style={[
            styles.fraction,
            { color: allDone ? colors.primary : colors.textTertiary },
          ]}
        >
          {completed}/{total}
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.bgSubtle }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${progress * 100}%`,
              backgroundColor: colors.primary,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
  },
  fraction: {
    fontSize: 13,
    fontWeight: "600",
  },
  track: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  fill: {
    height: 4,
    borderRadius: 2,
  },
});
