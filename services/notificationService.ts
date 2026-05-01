import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import type { Task, Habit } from '@/types'

const CHANNEL_ID = 'reminders'

// App day convention: 0=Sun, 1=Mon … 6=Sat
// expo-notifications WEEKLY trigger: 1=Sun, 2=Mon … 7=Sat
function toNotifWeekday(appDay: number): number {
  return appDay === 0 ? 1 : appDay + 1
}

export async function setupNotifications(): Promise<void> {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  })

  if (Platform.OS === 'android') {
    // Delete and recreate so updated audio settings always take effect
    await Notifications.deleteNotificationChannelAsync(CHANNEL_ID)
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Recordatorios',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 300, 200, 300],
      enableVibrate: true,
      showBadge: true,
      // ALARM stream: plays even when phone is on silent/vibrate (uses alarm volume)
      audioAttributes: {
        usage: Notifications.AndroidAudioUsage.ALARM,
        contentType: Notifications.AndroidAudioContentType.SONIFICATION,
        flags: { enforceAudibility: true, requestHardwareAudioVideoSynchronization: false },
      },
    })
  }

  const { status: existing } = await Notifications.getPermissionsAsync()
  if (existing !== 'granted') {
    await Notifications.requestPermissionsAsync()
  }
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export async function scheduleTaskNotification(task: Task): Promise<void> {
  if (!task.due_date) return

  const [year, month, day] = task.due_date.split('-').map(Number)
  const hour = task.due_time ? Number(task.due_time.split(':')[0]) : 9
  const minute = task.due_time ? Number(task.due_time.split(':')[1]) : 0

  const triggerDate = new Date(year, month - 1, day, hour, minute, 0)
  if (triggerDate <= new Date()) return

  await Notifications.scheduleNotificationAsync({
    identifier: `task-${task.id}`,
    content: {
      title: task.title,
      body: task.due_time
        ? `Vence hoy a las ${task.due_time}`
        : 'Tienes una tarea pendiente hoy',
      sound: true,
      data: { type: 'task', id: task.id },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
      channelId: CHANNEL_ID,
    },
  })
}

export async function cancelTaskNotification(taskId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(`task-${taskId}`)
}

// ─── Habits ───────────────────────────────────────────────────────────────────

export async function scheduleHabitNotifications(habit: Habit): Promise<void> {
  if (!habit.reminder_time) return

  const [hour, minute] = habit.reminder_time.split(':').map(Number)
  const content: Notifications.NotificationContentInput = {
    title: `${habit.icon} ${habit.title}`,
    body: '¡Es hora de mantener tu racha!',
    sound: true,
    data: { type: 'habit', id: habit.id },
  }

  await cancelHabitNotifications(habit.id)

  if (habit.frequency === 'daily') {
    await Notifications.scheduleNotificationAsync({
      identifier: `habit-${habit.id}-daily`,
      content,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: CHANNEL_ID,
      },
    })
    return
  }

  const days = habit.frequency.split(',').map(Number)
  for (const appDay of days) {
    await Notifications.scheduleNotificationAsync({
      identifier: `habit-${habit.id}-${appDay}`,
      content,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: toNotifWeekday(appDay),
        hour,
        minute,
        channelId: CHANNEL_ID,
      },
    })
  }
}

export async function cancelHabitNotifications(habitId: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync()
  await Promise.all(
    scheduled
      .filter(n => n.identifier.startsWith(`habit-${habitId}`))
      .map(n => Notifications.cancelScheduledNotificationAsync(n.identifier))
  )
}
