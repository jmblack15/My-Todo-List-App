import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/hooks/useAppTheme";

export function HabitsEmptyState() {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.bgSubtle }]}>
      <Ionicons name="leaf-outline" size={28} color={colors.textTertiary} />
      <Text style={[styles.text, { color: colors.textTertiary }]}>
        No tienes hábitos activos
      </Text>
      <Pressable
        onPress={() => router.push("/habit/new" as never)}
        style={[styles.action, { backgroundColor: colors.indigoSoft }]}
      >
        <Text style={[styles.actionText, { color: colors.primary }]}>
          Crear hábito
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    alignItems: "center",
    paddingVertical: 40,
    gap: 10,
  },
  text: {
    fontSize: 13,
    fontWeight: "500",
  },
  action: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 4,
  },
  actionText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
