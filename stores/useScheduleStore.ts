import { create } from 'zustand'
import { scheduleRepository } from '@/repositories/scheduleRepository'
import type { ScheduleBlock } from '@/types'

type ScheduleStore = {
  blocks: ScheduleBlock[]
  todayBlocks: ScheduleBlock[]
  loading: boolean
  error: string | null
  loadBlocks(): Promise<void>
  loadTodayBlocks(dayOfWeek: number): Promise<void>
  createBlock(data: Omit<ScheduleBlock, 'id'>): Promise<void>
  updateBlock(id: string, data: Partial<ScheduleBlock>): Promise<void>
  deleteBlock(id: string): Promise<void>
}

export const useScheduleStore = create<ScheduleStore>()((set) => ({
  blocks: [],
  todayBlocks: [],
  loading: false,
  error: null,

  async loadBlocks() {
    set({ loading: true, error: null })
    try {
      const blocks = await scheduleRepository.getAll()
      set({ blocks, loading: false })
    } catch (e) {
      set({ error: (e as Error).message, loading: false })
    }
  },

  async loadTodayBlocks(dayOfWeek: number) {
    set({ loading: true, error: null })
    try {
      const todayBlocks = await scheduleRepository.getByDayOfWeek(dayOfWeek)
      set({ todayBlocks, loading: false })
    } catch (e) {
      set({ error: (e as Error).message, loading: false })
    }
  },

  async createBlock(data) {
    try {
      const block = await scheduleRepository.create(data)
      set(state => ({ blocks: [...state.blocks, block] }))
    } catch (e) {
      set({ error: (e as Error).message })
    }
  },

  async updateBlock(id: string, data: Partial<ScheduleBlock>) {
    try {
      await scheduleRepository.update(id, data)
      const apply = (list: ScheduleBlock[]) =>
        list.map(b => (b.id === id ? { ...b, ...data } : b))
      set(state => ({ blocks: apply(state.blocks), todayBlocks: apply(state.todayBlocks) }))
    } catch (e) {
      set({ error: (e as Error).message })
    }
  },

  async deleteBlock(id: string) {
    try {
      await scheduleRepository.delete(id)
      set(state => ({
        blocks: state.blocks.filter(b => b.id !== id),
        todayBlocks: state.todayBlocks.filter(b => b.id !== id),
      }))
    } catch (e) {
      set({ error: (e as Error).message })
    }
  },
}))
