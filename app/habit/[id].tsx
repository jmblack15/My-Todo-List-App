import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
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

function buildReminderDate(hour: number, minute: number) {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

function parseFrequency(freq: string): number[] {
  if (freq === "daily") return [0, 1, 2, 3, 4, 5, 6];
  return freq.split(",").map(Number).filter((n) => !isNaN(n));
}

function parseReminderTime(time?: string): Date {
  if (!time) return buildReminderDate(18, 0);
  const [h, m] = time.split(":").map(Number);
  return buildReminderDate(isNaN(h) ? 18 : h, isNaN(m) ? 0 : m);
}

export default function EditHabitScreen() {
  const { colors } = useAppTheme();
  const { bottom } = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { habits, todayHabits, updateHabit, deleteHabit } = useHabitStore();

  const habit =
    habits.find((h) => h.id === id) ?? todayHabits.find((h) => h.id === id);

  const [title, setTitle] = useState(habit?.title ?? "");
  const [icon, setIcon] = useState(habit?.icon ?? ICONS[0]);
  const [color, setColor] = useState(habit?.color ?? COLORS[2]);
  const [selectedDays, setSelectedDays] = useState<number[]>(() =>
    parseFrequency(habit?.frequency ?? "1,2,3,4,5"),
  );
  const [reminderTime, setReminderTime] = useState(() =>
    parseReminderTime(habit?.reminder_time),
  );
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showAndroidTime, setShowAndroidTime] = useState(false);
  const [hasGoal, setHasGoal] = useState((habit?.target_days ?? 0) > 0);
  const [targetDays, setTargetDays] = useState(
    habit?.target_days ? String(habit.target_days) : "21",
  );
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
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const frequencyString =
    selectedDays.length === 7
      ? "daily"
      : selectedDays
          .slice()
          .sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
          .join(",");

  const reminderLabel = `Cada día a las ${pad(reminderTime.getHours())}:${pad(reminderTime.getMinutes())}`;

  const onPressReminder = () => {
    Haptics.selectionAsync();
    if (Platform.OS === "ios") setShowTimeModal(true);
    else setShowAndroidTime(true);
  };

  const onAndroidTimeChange = (e: DateTimePickerEvent, date?: Date) => {
    setShowAndroidTime(false);
    if (e.type === "set" && date) setReminderTime(date);
  };

  const handleDelete = () => {
    Alert.alert("Eliminar hábito", "Esta acción no se puede deshacer.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          await deleteHabit(id);
          dismiss();
        },
      },
    ]);
  };

  const handleSave = async () => {
    if (!title.trim() || saving) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSaving(true);
    const days = parseInt(targetDays, 10);
    await updateHabit(id, {
      title: title.trim(),
      icon,
      color,
      frequency: frequencyString,
      target_days: hasGoal && !isNaN(days) && days > 0 ? days : 0,
      reminder_time: `${pad(reminderTime.getHours())}:${pad(reminderTime.getMinutes())}`,
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

          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Pressable onPress={dismiss} hitSlop={8}>
              <Text style={[styles.headerAction, { color: colors.textSecondary }]}>
                Cancelar
              </Text>
            </Pressable>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Editar hábito
            </Text>
            <Pressable
              onPress={handleSave}
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
                Guardar
              </Text>
            </Pressable>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.body}
          >
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

            <Pressable
              onPress={onPressReminder}
              style={({ pressed }) => [
                styles.fieldRow,
                {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: colors.border,
                },
                pressed && { opacity: 0.6 },
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
                  name="chevron-forward"
                  size={14}
                  color={colors.textTertiary}
                  style={{ marginLeft: 4 }}
                />
              </View>
            </Pressable>

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
              <View style={[styles.fieldRow, { paddingLeft: 40 }]}>
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

            <View style={[styles.divider, { backgroundColor: colors.border, marginTop: 12 }]} />

            <Pressable
              onPress={handleDelete}
              style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.6 }]}
            >
              <Text style={[styles.deleteBtnText, { color: colors.danger }]}>
                Eliminar hábito
              </Text>
            </Pressable>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>

      {showAndroidTime && (
        <DateTimePicker
          mode="time"
          value={reminderTime}
          onChange={onAndroidTimeChange}
          is24Hour
        />
      )}

      <Modal
        visible={showTimeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTimeModal(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowTimeModal(false)}
        />
        <View style={[styles.pickerModal, { backgroundColor: colors.card }]}>
          <View style={[styles.pickerHeader, { borderBottomColor: colors.border }]}>
            <Pressable onPress={() => setShowTimeModal(false)} hitSlop={8}>
              <Text style={[styles.pickerAction, { color: colors.textSecondary }]}>
                Cancelar
              </Text>
            </Pressable>
            <Text style={[styles.pickerTitle, { color: colors.text }]}>
              Hora del recordatorio
            </Text>
            <Pressable onPress={() => setShowTimeModal(false)} hitSlop={8}>
              <Text style={[styles.pickerAction, { color: colors.primary, fontWeight: "600" }]}>
                Listo
              </Text>
            </Pressable>
          </View>
          <DateTimePicker
            mode="time"
            value={reminderTime}
            display="spinner"
            is24Hour
            onChange={(_e, date) => { if (date) setReminderTime(date); }}
            style={styles.iosPicker}
            textColor={colors.text}
          />
        </View>
      </Modal>
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  pickerModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
  },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pickerTitle: { fontSize: 16, fontWeight: "600" },
  pickerAction: { fontSize: 16 },
  iosPicker: { height: 216 },
  deleteBtn: {
    alignItems: "center",
    paddingVertical: 16,
  },
  deleteBtnText: {
    fontSize: 15,
    fontWeight: "500",
  },
});
