import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { es } from "date-fns/locale";
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
import { useTaskStore } from "@/stores/useTaskStore";
import type { Priority } from "@/types";

const PRIORITIES: { key: Priority; label: string; color: string }[] = [
  { key: "high", label: "Alta", color: "#E11D48" },
  { key: "medium", label: "Media", color: "#F59E0B" },
  { key: "low", label: "Baja", color: "#A1A1AA" },
];

export default function EditTaskScreen() {
  const { colors } = useAppTheme();
  const { bottom } = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tasks, todayTasks, updateTask, deleteTask } = useTaskStore();

  const task =
    tasks.find((t) => t.id === id) ?? todayTasks.find((t) => t.id === id);

  const [title, setTitle] = useState(task?.title ?? "");
  const [notes, setNotes] = useState(task?.notes ?? "");
  const [priority, setPriority] = useState<Priority>(task?.priority ?? "medium");
  const [saving, setSaving] = useState(false);

  const [selectedDate, setSelectedDate] = useState(() => {
    if (task?.due_date) return new Date(task.due_date + "T00:00:00");
    return new Date();
  });

  const [selectedTime, setSelectedTime] = useState<Date | null>(() => {
    if (task?.due_time) {
      const [h, m] = task.due_time.split(":").map(Number);
      const d = new Date();
      d.setHours(h, m, 0, 0);
      return d;
    }
    return null;
  });

  const [showDateModal, setShowDateModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showAndroidDate, setShowAndroidDate] = useState(false);
  const [showAndroidTime, setShowAndroidTime] = useState(false);

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

  const isToday =
    format(selectedDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
  const dateLabel = isToday
    ? `Hoy · ${format(selectedDate, "d MMM", { locale: es })}`
    : format(selectedDate, "d MMM yyyy", { locale: es });
  const timeLabel = selectedTime ? format(selectedTime, "HH:mm") : "—";

  const onPressDate = () => {
    Haptics.selectionAsync();
    if (Platform.OS === "ios") setShowDateModal(true);
    else setShowAndroidDate(true);
  };

  const onPressTime = () => {
    Haptics.selectionAsync();
    if (Platform.OS === "ios") setShowTimeModal(true);
    else setShowAndroidTime(true);
  };

  const onAndroidDateChange = (e: DateTimePickerEvent, date?: Date) => {
    setShowAndroidDate(false);
    if (e.type === "set" && date) setSelectedDate(date);
  };

  const onAndroidTimeChange = (e: DateTimePickerEvent, date?: Date) => {
    setShowAndroidTime(false);
    if (e.type === "set" && date) setSelectedTime(date);
  };

  const handleDelete = () => {
    Alert.alert("Eliminar tarea", "Esta acción no se puede deshacer.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          await deleteTask(id);
          dismiss();
        },
      },
    ]);
  };

  const handleSave = async () => {
    if (!title.trim() || saving) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSaving(true);
    await updateTask(id, {
      title: title.trim(),
      notes: notes.trim() || undefined,
      due_date: format(selectedDate, "yyyy-MM-dd"),
      due_time: selectedTime ? format(selectedTime, "HH:mm") : undefined,
      priority,
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
              Editar tarea
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
            <TextInput
              style={[styles.titleInput, { color: colors.text }]}
              placeholder="Título de la tarea"
              placeholderTextColor={colors.textQuaternary}
              value={title}
              onChangeText={setTitle}
              multiline
              returnKeyType="next"
            />
            <TextInput
              style={[styles.notesInput, { color: colors.textSecondary }]}
              placeholder="Añadir notas..."
              placeholderTextColor={colors.textTertiary}
              value={notes}
              onChangeText={setNotes}
              multiline
            />

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <FieldRow
              icon="calendar-outline"
              label="Fecha"
              colors={colors}
              last={false}
              onPress={onPressDate}
            >
              <Text style={[styles.fieldValue, { color: colors.text }]}>
                {dateLabel}
              </Text>
            </FieldRow>

            <FieldRow
              icon="time-outline"
              label="Hora"
              colors={colors}
              last={false}
              onPress={onPressTime}
            >
              <Text
                style={[
                  styles.fieldValue,
                  { color: selectedTime ? colors.text : colors.textTertiary },
                ]}
              >
                {timeLabel}
              </Text>
            </FieldRow>

            <FieldRow icon="flag-outline" label="Prioridad" colors={colors} last={true}>
              <View style={styles.priorityRow}>
                {PRIORITIES.map((p) => (
                  <Pressable
                    key={p.key}
                    onPress={() => setPriority(p.key)}
                    style={[
                      styles.priorityChip,
                      priority === p.key
                        ? { borderColor: p.color, backgroundColor: `${p.color}18` }
                        : { borderColor: colors.border },
                    ]}
                  >
                    <View
                      style={[
                        styles.priorityDot,
                        {
                          backgroundColor:
                            priority === p.key ? p.color : colors.textTertiary,
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.priorityLabel,
                        {
                          color:
                            priority === p.key ? p.color : colors.textSecondary,
                          fontWeight: priority === p.key ? "600" : "400",
                        },
                      ]}
                    >
                      {p.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </FieldRow>

            <View style={[styles.divider, { backgroundColor: colors.border, marginTop: 12 }]} />

            <Pressable
              onPress={handleDelete}
              style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.6 }]}
            >
              <Text style={[styles.deleteBtnText, { color: colors.danger }]}>
                Eliminar tarea
              </Text>
            </Pressable>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>

      {showAndroidDate && (
        <DateTimePicker
          mode="date"
          value={selectedDate}
          onChange={onAndroidDateChange}
        />
      )}
      {showAndroidTime && (
        <DateTimePicker
          mode="time"
          value={selectedTime ?? new Date()}
          onChange={onAndroidTimeChange}
          is24Hour
        />
      )}

      <Modal
        visible={showDateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDateModal(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowDateModal(false)}
        />
        <View style={[styles.pickerModal, { backgroundColor: colors.card }]}>
          <View style={[styles.pickerHeader, { borderBottomColor: colors.border }]}>
            <Pressable onPress={() => setShowDateModal(false)} hitSlop={8}>
              <Text style={[styles.pickerAction, { color: colors.textSecondary }]}>
                Cancelar
              </Text>
            </Pressable>
            <Text style={[styles.pickerTitle, { color: colors.text }]}>Fecha</Text>
            <Pressable onPress={() => setShowDateModal(false)} hitSlop={8}>
              <Text style={[styles.pickerAction, { color: colors.primary, fontWeight: "600" }]}>
                Listo
              </Text>
            </Pressable>
          </View>
          <DateTimePicker
            mode="date"
            value={selectedDate}
            display="spinner"
            locale="es"
            onChange={(_e, date) => { if (date) setSelectedDate(date); }}
            style={styles.iosPicker}
            textColor={colors.text}
          />
        </View>
      </Modal>

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
            <Text style={[styles.pickerTitle, { color: colors.text }]}>Hora</Text>
            <Pressable onPress={() => setShowTimeModal(false)} hitSlop={8}>
              <Text style={[styles.pickerAction, { color: colors.primary, fontWeight: "600" }]}>
                Listo
              </Text>
            </Pressable>
          </View>
          <DateTimePicker
            mode="time"
            value={selectedTime ?? new Date()}
            display="spinner"
            is24Hour
            onChange={(_e, date) => { if (date) setSelectedTime(date); }}
            style={styles.iosPicker}
            textColor={colors.text}
          />
        </View>
      </Modal>
    </View>
  );
}

function FieldRow({
  icon,
  label,
  children,
  colors,
  last,
  onPress,
}: {
  icon: string;
  label: string;
  children: React.ReactNode;
  colors: any;
  last: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.fieldRow,
        !last && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
        onPress && pressed && { opacity: 0.6 },
      ]}
    >
      <View style={styles.fieldLeft}>
        <Ionicons
          name={icon as any}
          size={16}
          color={colors.textTertiary}
          style={{ marginRight: 8 }}
        />
        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
          {label}
        </Text>
      </View>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
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
  body: { paddingHorizontal: 20, paddingBottom: 8 },
  titleInput: {
    fontSize: 24,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 6,
    minHeight: 36,
  },
  notesInput: {
    fontSize: 15,
    marginBottom: 20,
    minHeight: 24,
  },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 4 },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  fieldLeft: { flexDirection: "row", alignItems: "center" },
  fieldLabel: { fontSize: 15 },
  fieldValue: { fontSize: 15 },
  priorityRow: { flexDirection: "row", gap: 6 },
  priorityChip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 5,
  },
  priorityDot: { width: 6, height: 6, borderRadius: 3 },
  priorityLabel: { fontSize: 13 },
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
