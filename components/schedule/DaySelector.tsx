import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/hooks/useAppTheme";

const DAYS: { label: string; value: number }[] = [
  { label: "L", value: 1 },
  { label: "M", value: 2 },
  { label: "X", value: 3 },
  { label: "J", value: 4 },
  { label: "V", value: 5 },
  { label: "S", value: 6 },
  { label: "D", value: 0 },
];

export function DaySelector({
  selected,
  today,
  onChange,
}: {
  selected: number;
  today: number;
  onChange: (day: number) => void;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.row}>
      {DAYS.map((d) => {
        const isSelected = d.value === selected;
        const isToday = d.value === today;
        return (
          <Pressable
            key={d.value}
            onPress={() => onChange(d.value)}
            style={[
              styles.chip,
              { backgroundColor: isSelected ? colors.primary : "transparent" },
            ]}
          >
            <Text
              style={[
                styles.label,
                {
                  color: isSelected
                    ? "#FFFFFF"
                    : isToday
                      ? colors.primary
                      : colors.textTertiary,
                  fontWeight: isSelected || isToday ? "700" : "500",
                },
              ]}
            >
              {d.label}
            </Text>
            {isToday && !isSelected && (
              <View
                style={[styles.dot, { backgroundColor: colors.primary }]}
              />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  chip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  label: {
    fontSize: 13,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
