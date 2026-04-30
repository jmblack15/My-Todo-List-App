import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppTheme } from "@/hooks/useAppTheme";
import { useHabitStore } from "@/stores/useHabitStore";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);
const ITEM_H = 44;

const ICONS = ["🔥", "📚", "🏃", "💧", "🎯", "🏋️", "🧘", "✍️", "🍎", "💊"];

const COLORS = [
  "#8B5CF6",
  "#F59E0B",
  "#10B981",
  "#0EA5E9",
  "#F43F5E",
  "#6366F1",
];

const DAYS: { key: number; label: string }[] = [
  { key: 1, label: "L" },
  { key: 2, label: "M" },
  { key: 3, label: "X" },
  { key: 4, label: "J" },
  { key: 5, label: "V" },
  { key: 6, label: "S" },
  { key: 0, label: "D" },
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function NewHabitScreen() {
  const { colors } = useAppTheme();
  const { bottom } = useSafeAreaInsets();
  const createHabit = useHabitStore((s) => s.createHabit);

  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState(ICONS[0]);
  const [color, setColor] = useState(COLORS[2]);
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [reminderHour, setReminderHour] = useState(18);
  const [reminderMinute, setReminderMinute] = useState(0);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [hasGoal, setHasGoal] = useState(true);
  const [targetDays, setTargetDays] = useState("21");
  const [saving, setSaving] = useState(false);

  const translateY = useSharedValue(600);

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 26, stiffness: 220 });
  }, []);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const dismiss = () => {
    translateY.value = withTiming(600, { duration: 220 });
    setTimeout(() => router.back(), 230);
  };

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const frequencyString =
    selectedDays.length === 7
      ? "daily"
      : selectedDays
          .slice()
          .sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
          .join(",");

  const reminderLabel = `Cada día a las ${pad(reminderHour)}:${pad(reminderMinute)}`;

  const handleCreate = async () => {
    if (!title.trim() || saving) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSaving(true);
    const days = parseInt(targetDays, 10);
    await createHabit({
      title: title.trim(),
      icon,
      color,
      frequency: frequencyString,
      target_days: hasGoal && !isNaN(days) && days > 0 ? days : 0,
      active: true,
    });
    dismiss();
  };

  return (
    <View style={styles.root}>
      <Pressable style={styles.backdrop} onPress={dismiss} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Animated.View
          style={[
            styles.sheet,
            { backgroundColor: colors.card, paddingBottom: bottom + 16 },
            sheetStyle,
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.borderStrong }]} />

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Pressable onPress={dismiss} hitSlop={8}>
              <Text style={[styles.headerAction, { color: colors.textSecondary }]}>
                Cancelar
              </Text>
            </Pressable>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Nuevo hábito
            </Text>
            <Pressable
              onPress={handleCreate}
              disabled={!title.trim() || saving}
              hitSlop={8}
            >
              <Text
                style={[
                  styles.headerAction,
                  {
                    color:
                      title.trim() && !saving
                        ? colors.primary
                        : colors.textQuaternary,
                    fontWeight: "600",
                  },
                ]}
              >
                Crear
              </Text>
            </Pressable>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.body}
          >
            {/* Title with icon preview */}
            <View style={styles.titleRow}>
              <View style={[styles.iconPreview, { backgroundColor: `${color}22` }]}>
                <Text style={styles.iconPreviewEmoji}>{icon}</Text>
              </View>
              <TextInput
                style={[styles.titleInput, { color: colors.text }]}
                placeholder="Nombre del hábito"
                placeholderTextColor={colors.textQuaternary}
                value={title}
                onChangeText={setTitle}
                returnKeyType="done"
              />
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Icon selector */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
                ICONO
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.iconRow}
              >
                {ICONS.map((emoji) => (
                  <Pressable
                    key={emoji}
                    onPress={() => setIcon(emoji)}
                    style={[
                      styles.iconOption,
                      icon === emoji
                        ? { backgroundColor: `${color}22`, borderColor: color }
                        : { backgroundColor: colors.bgSubtle, borderColor: "transparent" },
                    ]}
                  >
                    <Text style={styles.iconEmoji}>{emoji}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Color selector */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
                COLOR
              </Text>
              <View style={styles.colorRow}>
                {COLORS.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setColor(c)}
                    style={[
                      styles.colorOption,
                      { backgroundColor: c },
                      color === c && styles.colorOptionSelected,
                    ]}
                  >
                    {color === c && (
                      <Ionicons name="checkmark" size={14} color="white" />
                    )}
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Frequency */}
            <View
              style={[
                styles.fieldRow,
                {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <View style={styles.fieldLeft}>
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={colors.textTertiary}
                  style={{ marginRight: 8 }}
                />
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  Frecuencia
                </Text>
              </View>
              <View style={styles.dayRow}>
                {DAYS.map((d) => (
                  <Pressable
                    key={d.key}
                    onPress={() => toggleDay(d.key)}
                    style={[
                      styles.dayBtn,
                      selectedDays.includes(d.key)
                        ? { backgroundColor: color }
                        : { backgroundColor: colors.bgSubtle },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayLabel,
                        {
                          color: selectedDays.includes(d.key)
                            ? "white"
                            : colors.textTertiary,
                        },
                      ]}
                    >
                      {d.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Reminder */}
            <Pressable
              onPress={() => setShowTimePicker((v) => !v)}
              style={[
                styles.fieldRow,
                {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <View style={styles.fieldLeft}>
                <Ionicons
                  name="notifications-outline"
                  size={16}
                  color={colors.textTertiary}
                  style={{ marginRight: 8 }}
                />
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  Recordatorio
                </Text>
              </View>
              <View style={styles.fieldRight}>
                <Text style={[styles.fieldValue, { color: colors.text }]}>
                  {reminderLabel}
                </Text>
                <Ionicons
                  name={showTimePicker ? "chevron-up" : "chevron-down"}
                  size={14}
                  color={colors.textTertiary}
                  style={{ marginLeft: 4 }}
                />
              </View>
            </Pressable>

            {showTimePicker && (
              <View
                style={[
                  styles.timePicker,
                  {
                    backgroundColor: colors.bgSubtle,
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <TimeColumn
                  items={HOURS}
                  selected={reminderHour}
                  onChange={setReminderHour}
                  colors={colors}
                />
                <Text style={[styles.timeColon, { color: colors.text }]}>:</Text>
                <TimeColumn
                  items={MINUTES}
                  selected={reminderMinute}
                  onChange={setReminderMinute}
                  colors={colors}
                />
              </View>
            )}

            {/* Goal toggle */}
            <View
              style={[
                styles.fieldRow,
                {
                  borderBottomWidth: hasGoal ? StyleSheet.hairlineWidth : 0,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <View style={styles.fieldLeft}>
                <Ionicons
                  name="trophy-outline"
                  size={16}
                  color={colors.textTertiary}
                  style={{ marginRight: 8 }}
                />
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  Objetivo
                </Text>
              </View>
              <Switch
                value={hasGoal}
                onValueChange={setHasGoal}
                trackColor={{ false: colors.bgSubtle, true: `${color}88` }}
                thumbColor={hasGoal ? color : colors.textTertiary}
              />
            </View>

            {hasGoal && (
              <View
                style={[
                  styles.fieldRow,
                  { paddingLeft: 40 },
                ]}
              >
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  Completar durante
                </Text>
                <View style={styles.goalRow}>
                  <TextInput
                    style={[
                      styles.goalInput,
                      { color: colors.text, borderColor: colors.border },
                    ]}
                    value={targetDays}
                    onChangeText={setTargetDays}
                    keyboardType="number-pad"
                    maxLength={3}
                  />
                  <Text style={[styles.fieldValue, { color: colors.textSecondary }]}>
                    {" días seguidos"}
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

function TimeColumn({
  items,
  selected,
  onChange,
  colors,
}: {
  items: number[];
  selected: number;
  onChange: (v: number) => void;
  colors: any;
}) {
  const ref = useRef<ScrollView>(null);

  const scrollTo = (idx: number) => {
    ref.current?.scrollTo({ y: idx * ITEM_H, animated: true });
  };

  useEffect(() => {
    const idx = items.indexOf(selected);
    if (idx >= 0) setTimeout(() => scrollTo(idx), 80);
  }, []);

  const increase = () => {
    const idx = (items.indexOf(selected) + 1) % items.length;
    scrollTo(idx);
    onChange(items[idx]);
  };

  const decrease = () => {
    const idx = (items.indexOf(selected) - 1 + items.length) % items.length;
    scrollTo(idx);
    onChange(items[idx]);
  };

  return (
    <View style={styles.timeColumn}>
      <Pressable onPress={decrease} hitSlop={8} style={styles.timeArrow}>
        <Ionicons name="chevron-up" size={18} color={colors.textSecondary} />
      </Pressable>
      <ScrollView
        ref={ref}
        style={styles.timeScroll}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        nestedScrollEnabled
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
          const clamped = Math.min(Math.max(idx, 0), items.length - 1);
          onChange(items[clamped]);
        }}
        contentContainerStyle={{ paddingVertical: ITEM_H }}
      >
        {items.map((item) => (
          <Pressable
            key={item}
            onPress={() => {
              const idx = items.indexOf(item);
              scrollTo(idx);
              onChange(item);
            }}
            style={styles.timeItem}
          >
            <Text
              style={[
                styles.timeValue,
                {
                  color: item === selected ? colors.text : colors.textQuaternary,
                  fontWeight: item === selected ? "400" : "300",
                },
              ]}
            >
              {pad(item)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <Pressable onPress={increase} hitSlop={8} style={styles.timeArrow}>
        <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 16, fontWeight: "600" },
  headerAction: { fontSize: 16 },
  body: { paddingBottom: 8 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  iconPreview: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  iconPreviewEmoji: { fontSize: 26 },
  titleInput: { flex: 1, fontSize: 20, fontWeight: "600" },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 20,
    marginVertical: 4,
  },
  section: { paddingHorizontal: 20, paddingVertical: 14, gap: 12 },
  sectionLabel: { fontSize: 11, fontWeight: "600", letterSpacing: 0.8 },
  iconRow: { gap: 8 },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  iconEmoji: { fontSize: 24 },
  colorRow: { flexDirection: "row", gap: 10 },
  colorOption: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  colorOptionSelected: {
    transform: [{ scale: 1.15 }],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  fieldLeft: { flexDirection: "row", alignItems: "center" },
  fieldRight: { flexDirection: "row", alignItems: "center" },
  fieldLabel: { fontSize: 15 },
  fieldValue: { fontSize: 14 },
  dayRow: { flexDirection: "row", gap: 5 },
  dayBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  dayLabel: { fontSize: 11, fontWeight: "600" },
  timePicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  timeColumn: { alignItems: "center", gap: 4 },
  timeArrow: { padding: 4 },
  timeScroll: { height: ITEM_H * 3, width: 64 },
  timeItem: { height: ITEM_H, alignItems: "center", justifyContent: "center" },
  timeValue: { fontSize: 32, fontWeight: "300", minWidth: 56, textAlign: "center" },
  timeColon: { fontSize: 32, fontWeight: "300", marginBottom: 8 },
  goalRow: { flexDirection: "row", alignItems: "center" },
  goalInput: {
    fontSize: 15,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 44,
    textAlign: "center",
  },
});
