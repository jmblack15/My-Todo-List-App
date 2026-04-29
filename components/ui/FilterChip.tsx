import { Pressable, StyleSheet, Text } from "react-native";

import { useAppTheme } from "@/hooks/useAppTheme";

export function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? colors.primary : colors.bgSubtle,
          borderColor: active ? colors.primary : "transparent",
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: active ? "#FFFFFF" : colors.textSecondary },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  text: {
    fontSize: 13,
    fontWeight: "500",
  },
});
