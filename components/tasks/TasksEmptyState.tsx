import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/hooks/useAppTheme";

export function TasksEmptyState({ message }: { message: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.bgSubtle }]}>
      <Ionicons name="checkbox-outline" size={28} color={colors.textTertiary} />
      <Text style={[styles.text, { color: colors.textTertiary }]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    alignItems: "center",
    paddingVertical: 36,
    gap: 10,
  },
  text: {
    fontSize: 13,
    fontWeight: "500",
  },
});
