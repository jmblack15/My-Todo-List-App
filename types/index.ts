export type Priority = 'low' | 'medium' | 'high'

export type Task = {
  id: string
  title: string
  notes?: string
  due_date?: string
  due_time?: string
  priority: Priority
  done: boolean
  done_at?: string
  skipped: boolean
  block_id?: string
  created_at: string
  updated_at: string
}

export type Habit = {
  id: string
  title: string
  icon: string
  color: string
  frequency: string
  target_days: number
  area?: string
  active: boolean
  reminder_time?: string
  created_at: string
  streak: number
  completed_today: boolean
}

export type ScheduleBlock = {
  id: string
  title: string
  start_time: string
  end_time: string
  day_of_week: number
  color: string
  recurrence: 'none' | 'weekly'
}

export type HabitLog = {
  id: string
  habit_id: string
  date: string
  completed: boolean
  note?: string
  checked_at?: string
}

export type TaskOccurrence = {
  id: string
  task_id: string
  date: string
  done: boolean
  done_at?: string
  skipped: boolean
}

export type AppTheme = 'light' | 'dark'

export type Language = 'es' | 'en'

export type AppColors = {
  background: string
  card: string
  bgSubtle: string
  text: string
  textSecondary: string
  textTertiary: string
  textQuaternary: string
  border: string
  borderStrong: string
  primary: string
  indigoSoft: string
  success: string
  warning: string
  danger: string
  accentEmerald: string
  accentAmber: string
  accentRose: string
  accentSky: string
  accentViolet: string
}
