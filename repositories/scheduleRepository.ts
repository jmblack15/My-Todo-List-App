import { db } from '@/lib/db'
import * as Crypto from 'expo-crypto'
import type { ScheduleBlock } from '@/types'

type RawScheduleBlock = ScheduleBlock & { created_at: string }

function mapBlock(row: RawScheduleBlock): ScheduleBlock {
  return {
    id: row.id,
    title: row.title,
    start_time: row.start_time,
    end_time: row.end_time,
    day_of_week: row.day_of_week,
    color: row.color,
    recurrence: row.recurrence,
  }
}

export const scheduleRepository = {
  async getByDayOfWeek(dayOfWeek: number): Promise<ScheduleBlock[]> {
    try {
      const rows = await db.getAllAsync<RawScheduleBlock>(
        'SELECT * FROM schedule_blocks WHERE day_of_week = ? ORDER BY start_time ASC',
        [dayOfWeek]
      )
      return rows.map(mapBlock)
    } catch (error) {
      throw new Error(`scheduleRepository.getByDayOfWeek failed: ${error}`)
    }
  },

  async getAll(): Promise<ScheduleBlock[]> {
    try {
      const rows = await db.getAllAsync<RawScheduleBlock>(
        'SELECT * FROM schedule_blocks ORDER BY day_of_week ASC, start_time ASC'
      )
      return rows.map(mapBlock)
    } catch (error) {
      throw new Error(`scheduleRepository.getAll failed: ${error}`)
    }
  },

  async create(data: Omit<ScheduleBlock, 'id'>): Promise<ScheduleBlock> {
    try {
      const id = Crypto.randomUUID()
      const now = new Date().toISOString()
      await db.runAsync(
        `INSERT INTO schedule_blocks (id, title, start_time, end_time, day_of_week, color, recurrence, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          data.title,
          data.start_time,
          data.end_time,
          data.day_of_week,
          data.color,
          data.recurrence,
          now,
        ]
      )
      const row = await db.getFirstAsync<RawScheduleBlock>(
        'SELECT * FROM schedule_blocks WHERE id = ?',
        [id]
      )
      if (!row) throw new Error('ScheduleBlock not found after insert')
      return mapBlock(row)
    } catch (error) {
      throw new Error(`scheduleRepository.create failed: ${error}`)
    }
  },

  async update(id: string, data: Partial<ScheduleBlock>): Promise<void> {
    try {
      const fields: string[] = []
      const values: (string | number | null)[] = []

      if (data.title !== undefined)       { fields.push('title = ?');       values.push(data.title) }
      if (data.start_time !== undefined)  { fields.push('start_time = ?');  values.push(data.start_time) }
      if (data.end_time !== undefined)    { fields.push('end_time = ?');    values.push(data.end_time) }
      if (data.day_of_week !== undefined) { fields.push('day_of_week = ?'); values.push(data.day_of_week) }
      if (data.color !== undefined)       { fields.push('color = ?');       values.push(data.color) }
      if (data.recurrence !== undefined)  { fields.push('recurrence = ?');  values.push(data.recurrence) }

      if (fields.length === 0) return

      values.push(id)
      await db.runAsync(`UPDATE schedule_blocks SET ${fields.join(', ')} WHERE id = ?`, values)
    } catch (error) {
      throw new Error(`scheduleRepository.update failed: ${error}`)
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await db.runAsync('DELETE FROM schedule_blocks WHERE id = ?', [id])
    } catch (error) {
      throw new Error(`scheduleRepository.delete failed: ${error}`)
    }
  },
}
