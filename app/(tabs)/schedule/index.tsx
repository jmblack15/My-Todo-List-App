import * as Haptics from 'expo-haptics'
import { router } from 'expo-router'
import { format, getDay } from 'date-fns'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'

import { useScheduleStore } from '@/stores/useScheduleStore'
import { useAppTheme } from '@/hooks/useAppTheme'
import type { ScheduleBlock } from '@/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAYS: { label: string; value: number }[] = [
  { label: 'L', value: 1 },
  { label: 'M', value: 2 },
  { label: 'X', value: 3 },
  { label: 'J', value: 4 },
  { label: 'V', value: 5 },
  { label: 'S', value: 6 },
  { label: 'D', value: 0 },
]

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

function formatTimeRange(start: string, end: string): string {
  return `${start} – ${end}`
}

function blockDurationMinutes(block: ScheduleBlock): number {
  const [sh, sm] = block.start_time.split(':').map(Number)
  const [eh, em] = block.end_time.split(':').map(Number)
  return (eh * 60 + em) - (sh * 60 + sm)
}

// ─── Day selector ─────────────────────────────────────────────────────────────

function DaySelector({
  selected,
  today,
  onChange,
}: {
  selected: number
  today: number
  onChange: (day: number) => void
}) {
  const { colors } = useAppTheme()
  return (
    <View style={styles.dayRow}>
      {DAYS.map((d) => {
        const isSelected = d.value === selected
        const isToday = d.value === today
        return (
          <Pressable
            key={d.value}
            onPress={() => onChange(d.value)}
            style={[
              styles.dayChip,
              {
                backgroundColor: isSelected ? colors.primary : 'transparent',
              },
            ]}
          >
            <Text
              style={[
                styles.dayLabel,
                {
                  color: isSelected
                    ? '#FFFFFF'
                    : isToday
                    ? colors.primary
                    : colors.textTertiary,
                  fontWeight: isSelected || isToday ? '700' : '500',
                },
              ]}
            >
              {d.label}
            </Text>
            {isToday && !isSelected && (
              <View
                style={[styles.todayDot, { backgroundColor: colors.primary }]}
              />
            )}
          </Pressable>
        )
      })}
    </View>
  )
}

// ─── Block card ───────────────────────────────────────────────────────────────

function BlockCard({
  block,
  isToday,
  onDelete,
}: {
  block: ScheduleBlock
  isToday: boolean
  onDelete: () => void
}) {
  const { colors } = useAppTheme()
  const active = isToday && isBlockActive(block)
  const past = isToday && isBlockPast(block) && !active
  const duration = blockDurationMinutes(block)

  const handleLongPress = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
    Alert.alert(block.title, formatTimeRange(block.start_time, block.end_time), [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: onDelete },
    ])
  }

  return (
    <Pressable
      onLongPress={handleLongPress}
      style={[
        styles.blockCard,
        {
          backgroundColor: active ? block.color + '14' : colors.card,
          borderColor: active ? block.color + '40' : colors.border,
          opacity: past ? 0.45 : 1,
        },
      ]}
    >
      {/* Color strip */}
      <View
        style={[styles.blockStrip, { backgroundColor: block.color }]}
      />

      {/* Content */}
      <View style={{ flex: 1 }}>
        <Text
          style={[styles.blockTitle, { color: active ? block.color : colors.text }]}
          numberOfLines={1}
        >
          {block.title}
        </Text>
        <View style={styles.blockMeta}>
          <Text style={[styles.blockTime, { color: colors.textTertiary }]}>
            {formatTimeRange(block.start_time, block.end_time)}
          </Text>
          <Text style={[styles.blockDot, { color: colors.textTertiary }]}>·</Text>
          <Text style={[styles.blockTime, { color: colors.textTertiary }]}>
            {duration} min
          </Text>
          {block.recurrence === 'weekly' && (
            <>
              <Text style={[styles.blockDot, { color: colors.textTertiary }]}>·</Text>
              <Ionicons name="repeat" size={11} color={colors.textTertiary} />
            </>
          )}
        </View>
      </View>

      {/* Active badge */}
      {active && (
        <View style={[styles.nowBadge, { backgroundColor: block.color }]}>
          <Text style={styles.nowBadgeText}>Ahora</Text>
        </View>
      )}
    </Pressable>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ dayLabel }: { dayLabel: string }) {
  const { colors } = useAppTheme()
  return (
    <View style={[styles.emptyState, { backgroundColor: colors.bgSubtle }]}>
      <Ionicons name="calendar-outline" size={28} color={colors.textTertiary} />
      <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
        Sin bloques el {dayLabel}
      </Text>
      <Pressable
        onPress={() => router.push('/schedule/new' as never)}
        style={[styles.emptyAction, { backgroundColor: colors.indigoSoft }]}
      >
        <Text style={[styles.emptyActionText, { color: colors.primary }]}>
          Agregar bloque
        </Text>
      </Pressable>
    </View>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

export default function ScheduleScreen() {
  const { colors } = useAppTheme()
  const insets = useSafeAreaInsets()
  const { blocks, loadBlocks, deleteBlock } = useScheduleStore()
  const [selectedDay, setSelectedDay] = useState(() => getDay(new Date()))
  const [refreshing, setRefreshing] = useState(false)
  const initialized = useRef(false)
  const today = getDay(new Date())

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      loadBlocks()
    }
  }, [loadBlocks])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadBlocks()
    setRefreshing(false)
  }, [loadBlocks])

  const handleDayChange = (day: number) => {
    Haptics.selectionAsync()
    setSelectedDay(day)
  }

  const handleDelete = (id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
    deleteBlock(id)
  }

  const dayBlocks = blocks
    .filter((b) => b.day_of_week === selectedDay)
    .sort((a, b) => a.start_time.localeCompare(b.start_time))

  const totalMinutes = dayBlocks.reduce((sum, b) => sum + blockDurationMinutes(b), 0)
  const totalHours = (totalMinutes / 60).toFixed(1)

  const tabBarHeight = 49
  const scrollBottomPad = insets.bottom + tabBarHeight + 32

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingBottom: scrollBottomPad,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* ── Header ── */}
        <View style={[styles.header, { paddingHorizontal: 20 }]}>
          <View>
            <Text style={[styles.screenTitle, { color: colors.text }]}>Horario</Text>
            <Text style={[styles.screenSubtitle, { color: colors.textTertiary }]}>
              {dayBlocks.length > 0
                ? `${dayBlocks.length} bloque${dayBlocks.length !== 1 ? 's' : ''} · ${totalHours}h`
                : DAY_NAMES[selectedDay].charAt(0).toUpperCase() + DAY_NAMES[selectedDay].slice(1)}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/schedule/new' as never)}
            style={[styles.addButton, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="add" size={22} color="white" />
          </Pressable>
        </View>

        {/* ── Day selector ── */}
        <View
          style={[
            styles.daySelectorWrapper,
            {
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <DaySelector
            selected={selectedDay}
            today={today}
            onChange={handleDayChange}
          />
        </View>

        {/* ── Blocks ── */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
          {dayBlocks.length === 0 ? (
            <EmptyState dayLabel={DAY_NAMES[selectedDay]} />
          ) : (
            <View style={{ gap: 10 }}>
              {dayBlocks.map((block) => (
                <BlockCard
                  key={block.id}
                  block={block}
                  isToday={selectedDay === today}
                  onDelete={() => handleDelete(block.id)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontSize: 13,
    marginTop: 3,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySelectorWrapper: {
    paddingHorizontal: 12,
    paddingBottom: 2,
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  dayLabel: {
    fontSize: 13,
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  blockCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    paddingRight: 14,
    paddingVertical: 14,
    gap: 14,
  },
  blockStrip: {
    width: 4,
    alignSelf: 'stretch',
    borderRadius: 2,
    marginLeft: 0,
  },
  blockTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 3,
  },
  blockMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  blockTime: {
    fontSize: 12,
  },
  blockDot: {
    fontSize: 12,
  },
  nowBadge: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  nowBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'white',
  },
  emptyState: {
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '500',
  },
  emptyAction: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 4,
  },
  emptyActionText: {
    fontSize: 13,
    fontWeight: '600',
  },
})
