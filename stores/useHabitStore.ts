import { create } from 'zustand'
import { habitRepository } from '@/repositories/habitRepository'
import type { Habit } from '@/types'

type HabitStore = {
  habits: Habit[]
  todayHabits: Habit[]
  loading: boolean
  error: string | null
  loadHabits(): Promise<void>
  loadTodayHabits(date: string): Promise<void>
  toggleToday(id: string, date: string): Promise<void>
  createHabit(data: Omit<Habit, 'id' | 'created_at' | 'streak' | 'completed_today'>): Promise<void>
  updateHabit(id: string, data: Partial<Habit>): Promise<void>
  deleteHabit(id: string): Promise<void>
}

export const useHabitStore = create<HabitStore>()((set, get) => ({
  habits: [],
  todayHabits: [],
  loading: false,
  error: null,

  async loadHabits() {
    set({ loading: true, error: null })
    try {
      const habits = await habitRepository.getAll()
      set({ habits, loading: false })
    } catch (e) {
      set({ error: (e as Error).message, loading: false })
    }
  },

  async loadTodayHabits(date: string) {
    set({ loading: true, error: null })
    try {
      const todayHabits = await habitRepository.getByDate(date)
      set({ todayHabits, loading: false })
    } catch (e) {
      set({ error: (e as Error).message, loading: false })
    }
  },

  async toggleToday(id: string, date: string) {
    const habit = get().todayHabits.find(h => h.id === id)
    if (!habit) return
    const newCompleted = !habit.completed_today
    try {
      await habitRepository.toggleLog(id, date, newCompleted)
      const streak = await habitRepository.getStreak(id)
      const apply = (list: Habit[]) =>
        list.map(h => (h.id === id ? { ...h, completed_today: newCompleted, streak } : h))
      set(state => ({ habits: apply(state.habits), todayHabits: apply(state.todayHabits) }))
    } catch (e) {
      set({ error: (e as Error).message })
    }
  },

  async createHabit(data) {
    try {
      const habit = await habitRepository.create(data)
      set(state => ({ habits: [...state.habits, habit] }))
    } catch (e) {
      set({ error: (e as Error).message })
    }
  },

  async updateHabit(id: string, data: Partial<Habit>) {
    try {
      await habitRepository.update(id, data)
      const apply = (list: Habit[]) =>
        list.map(h => (h.id === id ? { ...h, ...data } : h))
      set(state => ({ habits: apply(state.habits), todayHabits: apply(state.todayHabits) }))
    } catch (e) {
      set({ error: (e as Error).message })
    }
  },

  async deleteHabit(id: string) {
    try {
      await habitRepository.delete(id)
      set(state => ({
        habits: state.habits.filter(h => h.id !== id),
        todayHabits: state.todayHabits.filter(h => h.id !== id),
      }))
    } catch (e) {
      set({ error: (e as Error).message })
    }
  },
}))
