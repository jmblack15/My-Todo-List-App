import { db } from '@/lib/db'
import * as Crypto from 'expo-crypto'
import { format } from 'date-fns'
import type { Task } from '@/types'

type RawTask = Omit<Task, 'done' | 'skipped'> & {
  done: number
  skipped: number
}

function mapTask(row: RawTask): Task {
  return {
    ...row,
    done: row.done === 1,
    skipped: row.skipped === 1,
    notes: row.notes ?? undefined,
    due_date: row.due_date ?? undefined,
    due_time: row.due_time ?? undefined,
    done_at: row.done_at ?? undefined,
    block_id: row.block_id ?? undefined,
  }
}

export const taskRepository = {
  async getAll(): Promise<Task[]> {
    try {
      const rows = await db.getAllAsync<RawTask>(
        'SELECT * FROM tasks ORDER BY created_at DESC'
      )
      return rows.map(mapTask)
    } catch (error) {
      throw new Error(`taskRepository.getAll failed: ${error}`)
    }
  },

  async getByDate(date: string): Promise<Task[]> {
    try {
      const rows = await db.getAllAsync<RawTask>(
        'SELECT * FROM tasks WHERE due_date = ? OR due_date IS NULL ORDER BY due_time ASC',
        [date]
      )
      return rows.map(mapTask)
    } catch (error) {
      throw new Error(`taskRepository.getByDate failed: ${error}`)
    }
  },

  async getOverdue(): Promise<Task[]> {
    try {
      const today = format(new Date(), 'yyyy-MM-dd')
      const rows = await db.getAllAsync<RawTask>(
        'SELECT * FROM tasks WHERE done = 0 AND due_date IS NOT NULL AND due_date < ? ORDER BY due_date ASC',
        [today]
      )
      return rows.map(mapTask)
    } catch (error) {
      throw new Error(`taskRepository.getOverdue failed: ${error}`)
    }
  },

  async create(data: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> {
    try {
      const id = Crypto.randomUUID()
      const now = new Date().toISOString()
      await db.runAsync(
        `INSERT INTO tasks
           (id, title, notes, due_date, due_time, priority, done, done_at, skipped, block_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          data.title,
          data.notes ?? null,
          data.due_date ?? null,
          data.due_time ?? null,
          data.priority,
          data.done ? 1 : 0,
          data.done_at ?? null,
          data.skipped ? 1 : 0,
          data.block_id ?? null,
          now,
          now,
        ]
      )
      const row = await db.getFirstAsync<RawTask>('SELECT * FROM tasks WHERE id = ?', [id])
      if (!row) throw new Error('Task not found after insert')
      return mapTask(row)
    } catch (error) {
      throw new Error(`taskRepository.create failed: ${error}`)
    }
  },

  async update(id: string, data: Partial<Task>): Promise<void> {
    try {
      const fields: string[] = []
      const values: (string | number | null)[] = []

      if (data.title !== undefined)    { fields.push('title = ?');    values.push(data.title) }
      if (data.notes !== undefined)    { fields.push('notes = ?');    values.push(data.notes ?? null) }
      if (data.due_date !== undefined) { fields.push('due_date = ?'); values.push(data.due_date ?? null) }
      if (data.due_time !== undefined) { fields.push('due_time = ?'); values.push(data.due_time ?? null) }
      if (data.priority !== undefined) { fields.push('priority = ?'); values.push(data.priority) }
      if (data.done !== undefined)     { fields.push('done = ?');     values.push(data.done ? 1 : 0) }
      if (data.done_at !== undefined)  { fields.push('done_at = ?');  values.push(data.done_at ?? null) }
      if (data.skipped !== undefined)  { fields.push('skipped = ?');  values.push(data.skipped ? 1 : 0) }
      if (data.block_id !== undefined) { fields.push('block_id = ?'); values.push(data.block_id ?? null) }

      if (fields.length === 0) return

      fields.push('updated_at = ?')
      values.push(new Date().toISOString())
      values.push(id)

      await db.runAsync(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`, values)
    } catch (error) {
      throw new Error(`taskRepository.update failed: ${error}`)
    }
  },

  async toggleDone(id: string, done: boolean): Promise<void> {
    try {
      const now = new Date().toISOString()
      await db.runAsync(
        'UPDATE tasks SET done = ?, done_at = ?, updated_at = ? WHERE id = ?',
        [done ? 1 : 0, done ? now : null, now, id]
      )
    } catch (error) {
      throw new Error(`taskRepository.toggleDone failed: ${error}`)
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await db.runAsync('DELETE FROM tasks WHERE id = ?', [id])
    } catch (error) {
      throw new Error(`taskRepository.delete failed: ${error}`)
    }
  },
}
