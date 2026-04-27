import * as Haptics from 'expo-haptics'
import { router } from 'expo-router'
import { format, getDay, getHours } from 'date-fns'
import { es } from 'date-fns/locale'
import { useCallback, useEffect, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native'
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'

import { useHabitStore } from '@/store/useHabitStore'
import { useScheduleStore } from '@/store/useScheduleStore'
import { useTaskStore } from '@/store/useTaskStore'
import { useAppTheme } from '@/hooks/useAppTheme'
import type { Habit, ScheduleBlock, Task } from '@/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = getHours(new Date())
  if (h >= 5 && h < 12) return 'Buenos días'
  if (h >= 12 && h < 18) return 'Buenas tardes'
  return 'Buenas noches'
}

function getFormattedDate(): string {
  const raw = format(new Date(), "EEEE, d 'de' MMMM", { locale: es })
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

const PRIORITY_ORDER: Record<Task['priority'], number> = { high: 0, medium: 1, low: 2 }

function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const diff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
    if (diff !== 0) return diff
    if (!a.due_time && !b.due_time) return 0
    if (!a.due_time) return 1
    if (!b.due_time) return -1
    return a.due_time.localeCompare(b.due_time)
  })
}

function currentTime(): string {
  return format(new Date(), 'HH:mm')
}

function isBlockActive(block: ScheduleBlock): boolean {
  const t = currentTime()
  return block.start_time <= t && t < block.end_time
}

function isBlockPast(block: ScheduleBlock): boolean {
  return block.end_time <= currentTime()
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRect({
  height = 16,
  width = '100%',
}: {
  height?: number
  width?: number | string
}) {
  const { colors } = useAppTheme()
  const opacity = useSharedValue(0.3)

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.8, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    )
  }, [])

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }))

  return (
    <Animated.View
      style={[
        animStyle,
        {
          height,
          width: width as number,
          borderRadius: 8,
          backgroundColor: colors.border,
        },
      ]}
    />
  )
}

function SkeletonSection({ itemCount }: { itemCount: number }) {
  return (
    <View className="mb-6">
      <SkeletonRect height={11} width="32%" />
      {Array.from({ length: itemCount }).map((_, i) => (
        <View key={i} className="mt-3">
          <SkeletonRect height={56} />
        </View>
      ))}
    </View>
  )
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  const { colors } = useAppTheme()
  return (
    <Text
      className="text-[11px] font-semibold uppercase tracking-widest mb-3"
      style={{ color: colors.textSecondary }}
    >
      {label}
    </Text>
  )
}

// ─── Schedule block ───────────────────────────────────────────────────────────

function ScheduleItem({ block }: { block: ScheduleBlock }) {
  const { colors } = useAppTheme()
  const active = isBlockActive(block)
  const past = isBlockPast(block)

  return (
    <View
      className="flex-row items-center rounded-xl px-4 py-3 mb-2"
      style={{
        opacity: past && !active ? 0.5 : 1,
        backgroundColor: active ? block.color + '18' : colors.card,
        borderLeftWidth: active ? 3 : 0,
        borderLeftColor: block.color,
      }}
    >
      <View className="flex-1">
        <Text className="text-base font-medium" style={{ color: colors.text }}>
          {block.title}
        </Text>
        <Text className="text-[13px] mt-0.5" style={{ color: colors.textSecondary }}>
          {block.start_time} – {block.end_time}
        </Text>
      </View>
      {active && (
        <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: block.color }}>
          <Text className="text-xs font-semibold text-white">Ahora</Text>
        </View>
      )}
    </View>
  )
}

// ─── Habit item ───────────────────────────────────────────────────────────────

function HabitItem({ habit, onToggle }: { habit: Habit; onToggle: () => void }) {
  const { colors } = useAppTheme()
  const scale = useSharedValue(1)

  const checkboxAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.72, { duration: 80 }),
      withSpring(1, { damping: 8, stiffness: 200 }),
    )
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onToggle()
  }

  return (
    <Pressable
      onPress={handlePress}
      className="flex-row items-center py-3 border-b"
      style={{ borderBottomColor: colors.border }}
    >
      {/* Animated checkbox */}
      <View className="mr-3">
        <Animated.View style={checkboxAnimStyle}>
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: habit.completed_today ? 0 : 2,
              borderColor: habit.completed_today ? 'transparent' : colors.border,
              backgroundColor: habit.completed_today ? habit.color : 'transparent',
            }}
          >
            {habit.completed_today && (
              <Ionicons name="checkmark" size={14} color="white" />
            )}
          </View>
        </Animated.View>
      </View>

      <Text className="text-xl mr-2">{habit.icon}</Text>

      <Text className="flex-1 text-base" style={{ color: colors.text }}>
        {habit.title}
      </Text>

      {habit.streak >= 3 && (
        <Text className="text-[13px]" style={{ color: colors.textSecondary }}>
          🔥 {habit.streak}
        </Text>
      )}
    </Pressable>
  )
}

// ─── Task item ────────────────────────────────────────────────────────────────

function TaskItem({ task, onToggle }: { task: Task; onToggle: () => void }) {
  const { colors } = useAppTheme()

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onToggle()
  }

  const handleLongPress = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    router.push(`/task/${task.id}`)
  }

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={handleLongPress}
      className="flex-row items-center py-3 border-b"
      style={{ borderBottomColor: colors.border }}
    >
      <View
        className="mr-3"
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: task.done ? 0 : 2,
          borderColor: task.done ? 'transparent' : colors.border,
          backgroundColor: task.done ? colors.primary : 'transparent',
        }}
      >
        {task.done && <Ionicons name="checkmark" size={14} color="white" />}
      </View>

      <View className="flex-1 gap-0.5">
        <Text
          className={task.done ? 'text-base line-through' : 'text-base'}
          style={{ color: task.done ? colors.textSecondary : colors.text }}
        >
          {task.title}
        </Text>
        {task.due_time != null && (
          <Text className="text-[13px]" style={{ color: colors.textSecondary }}>
            {task.due_time}
          </Text>
        )}
      </View>

      {task.priority !== 'low' && (
        <View
          className="rounded px-1.5 py-0.5 ml-2"
          style={{
            backgroundColor:
              task.priority === 'high' ? colors.danger + '28' : colors.warning + '28',
          }}
        >
          <Text
            className="text-xs font-medium"
            style={{
              color: task.priority === 'high' ? colors.danger : colors.warning,
            }}
          >
            {task.priority === 'high' ? 'Alta' : 'Media'}
          </Text>
        </View>
      )}
    </Pressable>
  )
}

// ─── FAB ──────────────────────────────────────────────────────────────────────

function FAB() {
  const { colors } = useAppTheme()
  const [open, setOpen] = useState(false)
  const progress = useSharedValue(0)

  const toggle = () => {
    const next = open ? 0 : 1
    progress.value = withTiming(next, { duration: 200 })
    if (!open) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setOpen((v) => !v)
  }

  const close = () => {
    progress.value = withTiming(0, { duration: 200 })
    setOpen(false)
  }

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(progress.value, [0, 1], [0, 45])}deg` }],
  }))

  const opt1Style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: interpolate(progress.value, [0, 1], [24, 0]) }],
  }))

  const opt2Style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: interpolate(progress.value, [0, 1], [48, 0]) }],
  }))

  const handleNewTask = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    close()
    router.push('/task/new')
  }

  const handleNewHabit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    close()
    router.push('/habit/new')
  }

  return (
    <>
      {open && (
        <Pressable className="absolute inset-0" onPress={close} />
      )}

      <View className="absolute bottom-6 right-6 items-end gap-3">
        {/* Option: Nuevo hábito */}
        <Animated.View style={opt2Style} pointerEvents={open ? 'auto' : 'none'}>
          <View className="flex-row items-center gap-2">
            <View
              className="rounded-xl px-3 py-1.5 shadow"
              style={{ backgroundColor: colors.card }}
            >
              <Text className="text-sm font-medium" style={{ color: colors.text }}>
                Nuevo hábito
              </Text>
            </View>
            <Pressable
              onPress={handleNewHabit}
              className="w-12 h-12 rounded-full items-center justify-center shadow"
              style={{ backgroundColor: colors.card }}
            >
              <Ionicons name="leaf-outline" size={20} color={colors.primary} />
            </Pressable>
          </View>
        </Animated.View>

        {/* Option: Nueva tarea */}
        <Animated.View style={opt1Style} pointerEvents={open ? 'auto' : 'none'}>
          <View className="flex-row items-center gap-2">
            <View
              className="rounded-xl px-3 py-1.5 shadow"
              style={{ backgroundColor: colors.card }}
            >
              <Text className="text-sm font-medium" style={{ color: colors.text }}>
                Nueva tarea
              </Text>
            </View>
            <Pressable
              onPress={handleNewTask}
              className="w-12 h-12 rounded-full items-center justify-center shadow"
              style={{ backgroundColor: colors.card }}
            >
              <Ionicons name="checkbox-outline" size={20} color={colors.primary} />
            </Pressable>
          </View>
        </Animated.View>

        {/* Main button */}
        <Pressable
          onPress={toggle}
          className="w-14 h-14 rounded-full items-center justify-center shadow-lg"
          style={{ backgroundColor: colors.primary }}
        >
          <Animated.View style={iconStyle}>
            <Ionicons name="add" size={28} color="white" />
          </Animated.View>
        </Pressable>
      </View>
    </>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function TodayScreen() {
  const { colors } = useAppTheme()
  const { todayTasks, loadTodayTasks, toggleDone } = useTaskStore()
  const { todayHabits, loadTodayHabits, toggleToday } = useHabitStore()
  const { todayBlocks, loadTodayBlocks } = useScheduleStore()

  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadData = useCallback(async () => {
    const today = format(new Date(), 'yyyy-MM-dd')
    const dayOfWeek = getDay(new Date())
    await Promise.all([
      loadTodayTasks(today),
      loadTodayHabits(today),
      loadTodayBlocks(dayOfWeek),
    ])
  }, [loadTodayTasks, loadTodayHabits, loadTodayBlocks])

  useEffect(() => {
    loadData().finally(() => setIsLoading(false))
  }, [loadData])

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await loadData()
    setIsRefreshing(false)
  }, [loadData])

  const completedHabits = todayHabits.filter((h) => h.completed_today).length
  const habitProgress = todayHabits.length > 0 ? completedHabits / todayHabits.length : 0
  const sortedTasks = sortTasks(todayTasks)
  const sortedBlocks = [...todayBlocks].sort((a, b) =>
    a.start_time.localeCompare(b.start_time),
  )

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* ── Header ── */}
        <View className="mb-6">
          <Text className="text-2xl font-bold" style={{ color: colors.text }}>
            {getGreeting()}
          </Text>
          <Text className="text-[13px] mt-1" style={{ color: colors.textSecondary }}>
            {getFormattedDate()}
          </Text>
          <View
            className="self-start mt-3 rounded-full px-3 py-1"
            style={{ backgroundColor: colors.card }}
          >
            <Text className="text-[13px] font-medium" style={{ color: colors.textSecondary }}>
              {sortedTasks.length} tareas · {completedHabits}/{todayHabits.length} hábitos
            </Text>
          </View>
        </View>

        {isLoading ? (
          <>
            <SkeletonSection itemCount={1} />
            <SkeletonSection itemCount={3} />
            <SkeletonSection itemCount={3} />
          </>
        ) : (
          <>
            {/* ── Horario ── */}
            <View className="mb-6">
              <SectionHeader label="Horario" />
              {sortedBlocks.length === 0 ? (
                <Text className="text-[13px]" style={{ color: colors.textSecondary }}>
                  Sin bloques hoy
                </Text>
              ) : (
                sortedBlocks.map((block) => (
                  <ScheduleItem key={block.id} block={block} />
                ))
              )}
            </View>

            {/* ── Hábitos ── */}
            <View className="mb-6">
              <SectionHeader label="Hábitos" />
              {todayHabits.length === 0 ? (
                <View className="items-center py-6">
                  <Text className="text-[13px] mb-3" style={{ color: colors.textSecondary }}>
                    No tienes hábitos activos
                  </Text>
                  <Pressable
                    onPress={() => router.push('/habit/new')}
                    className="rounded-full px-4 py-2"
                    style={{ backgroundColor: colors.primary }}
                  >
                    <Text className="text-sm font-semibold text-white">Agregar hábito</Text>
                  </Pressable>
                </View>
              ) : (
                <View
                  className="rounded-xl px-4 pt-4 pb-1"
                  style={{ backgroundColor: colors.card }}
                >
                  {/* Progress bar */}
                  <View
                    className="h-1 rounded-full mb-1"
                    style={{ backgroundColor: colors.border }}
                  >
                    <View
                      className="h-1 rounded-full"
                      style={{
                        width: `${habitProgress * 100}%`,
                        backgroundColor: colors.primary,
                      }}
                    />
                  </View>
                  <Text className="text-[13px] mb-3" style={{ color: colors.textSecondary }}>
                    {completedHabits} de {todayHabits.length} completados
                  </Text>
                  {todayHabits.map((habit) => (
                    <HabitItem
                      key={habit.id}
                      habit={habit}
                      onToggle={() => toggleToday(habit.id)}
                    />
                  ))}
                </View>
              )}
            </View>

            {/* ── Tareas ── */}
            <View className="mb-6">
              <SectionHeader label="Tareas" />
              {sortedTasks.length === 0 ? (
                <View className="items-center py-6">
                  <Text className="text-[13px] mb-3" style={{ color: colors.textSecondary }}>
                    No tienes tareas para hoy
                  </Text>
                  <Pressable
                    onPress={() => router.push('/task/new')}
                    className="rounded-full px-4 py-2"
                    style={{ backgroundColor: colors.primary }}
                  >
                    <Text className="text-sm font-semibold text-white">Agregar tarea</Text>
                  </Pressable>
                </View>
              ) : (
                <View
                  className="rounded-xl px-4 pt-2"
                  style={{ backgroundColor: colors.card }}
                >
                  {sortedTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggle={() => toggleDone(task.id)}
                    />
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      <FAB />
    </View>
  )
}
