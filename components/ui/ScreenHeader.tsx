import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/hooks/useAppTheme";

export function ScreenHeader({
  title,
  subtitle,
  onAdd,
}: {
  title: string;
  subtitle: string;
  onAdd: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.container}>
      <View>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: colors.textTertiary }]}>
          {subtitle}
        </Text>
      </View>
      <Pressable
        onPress={onAdd}
        style={[styles.addButton, { backgroundColor: colors.primary }]}
      >
        <Ionicons name="add" size={22} color="white" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  subtitle: {
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
});
