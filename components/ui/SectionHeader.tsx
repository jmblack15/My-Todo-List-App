import { StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/hooks/useAppTheme";

export function SectionHeader({
  label,
  count,
}: {
  label: string;
  count?: string | number;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: colors.textTertiary }]}>{label}</Text>
      {count != null && (
        <Text style={[styles.count, { color: colors.textTertiary }]}>{count}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  count: {
    fontSize: 11,
    fontWeight: "500",
  },
});
