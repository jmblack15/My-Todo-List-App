import { create } from 'zustand'
import { taskRepository } from '@/repositories/taskRepository'
import type { Task } from '@/types'

type TaskStore = {
  tasks: Task[]
  todayTasks: Task[]
  loading: boolean
  error: string | null
  todayDate: string | null
  loadTasks(): Promise<void>
  loadTodayTasks(date: string): Promise<void>
  toggleDone(id: string): Promise<void>
  createTask(data: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<void>
  updateTask(id: string, data: Partial<Task>): Promise<void>
  deleteTask(id: string): Promise<void>
}

export const useTaskStore = create<TaskStore>()((set, get) => ({
  tasks: [],
  todayTasks: [],
  loading: false,
  error: null,
  todayDate: null,

  async loadTasks() {
    set({ loading: true, error: null })
    try {
      const tasks = await taskRepository.getAll()
      set({ tasks, loading: false })
    } catch (e) {
      set({ error: (e as Error).message, loading: false })
    }
  },

  async loadTodayTasks(date: string) {
    set({ loading: true, error: null })
    try {
      const todayTasks = await taskRepository.getByDate(date)
      set({ todayTasks, loading: false, todayDate: date })
    } catch (e) {
      set({ error: (e as Error).message, loading: false })
    }
  },

  async toggleDone(id: string) {
    const task =
      get().todayTasks.find(t => t.id === id) ?? get().tasks.find(t => t.id === id)
    if (!task) return
    const newDone = !task.done
    try {
      await taskRepository.toggleDone(id, newDone)
      const now = new Date().toISOString()
      const patch: Partial<Task> = { done: newDone, done_at: newDone ? now : undefined }
      const apply = (list: Task[]) => list.map(t => (t.id === id ? { ...t, ...patch } : t))
      set(state => ({ tasks: apply(state.tasks), todayTasks: apply(state.todayTasks) }))
    } catch (e) {
      set({ error: (e as Error).message })
    }
  },

  async createTask(data) {
    try {
      const task = await taskRepository.create(data)
      set(state => {
        const belongsToToday = !task.due_date || task.due_date === state.todayDate
        return {
          tasks: [task, ...state.tasks],
          todayTasks: belongsToToday ? [task, ...state.todayTasks] : state.todayTasks,
        }
      })
    } catch (e) {
      set({ error: (e as Error).message })
    }
  },

  async updateTask(id: string, data: Partial<Task>) {
    try {
      await taskRepository.update(id, data)
      const apply = (list: Task[]) => list.map(t => (t.id === id ? { ...t, ...data } : t))
      set(state => ({ tasks: apply(state.tasks), todayTasks: apply(state.todayTasks) }))
    } catch (e) {
      set({ error: (e as Error).message })
    }
  },

  async deleteTask(id: string) {
    try {
      await taskRepository.delete(id)
      set(state => ({
        tasks: state.tasks.filter(t => t.id !== id),
        todayTasks: state.todayTasks.filter(t => t.id !== id),
      }))
    } catch (e) {
      set({ error: (e as Error).message })
    }
  },
}))
