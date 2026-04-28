import { db } from '@/lib/db'
import * as Crypto from 'expo-crypto'
import { format, parseISO, subDays } from 'date-fns'
import type { Habit } from '@/types'

type RawHabit = {
  id: string
  title: string
  icon: string
  color: string
  frequency: 'daily' | 'weekly'
  target_days: number
  area: string | null
  active: number
  created_at: string
}

type RawHabitWithLog = RawHabit & { completed_today: number | null }

function mapHabit(row: RawHabit, streak: number, completed_today: boolean): Habit {
  return {
    id: row.id,
    title: row.title,
    icon: row.icon,
    color: row.color,
    frequency: row.frequency,
    target_days: row.target_days,
    area: row.area ?? undefined,
    active: row.active === 1,
    created_at: row.created_at,
    streak,
    completed_today,
  }
}

async function computeStreak(habitId: string): Promise<number> {
  const rows = await db.getAllAsync<{ date: string }>(
    'SELECT date FROM habit_logs WHERE habit_id = ? AND completed = 1 ORDER BY date DESC',
    [habitId]
  )
  if (rows.length === 0) return 0

  let streak = 0
  let cursor = parseISO(rows[0].date)

  for (const row of rows) {
    const d = parseISO(row.date)
    if (format(d, 'yyyy-MM-dd') === format(cursor, 'yyyy-MM-dd')) {
      streak++
      cursor = subDays(cursor, 1)
    } else {
      break
    }
  }
  return streak
}

export const habitRepository = {
  async getAll(): Promise<Habit[]> {
    try {
      const today = format(new Date(), 'yyyy-MM-dd')
      const rows = await db.getAllAsync<RawHabitWithLog>(
        `SELECT h.*, hl.completed AS completed_today
         FROM habits h
         LEFT JOIN habit_logs hl ON hl.habit_id = h.id AND hl.date = ?
         WHERE h.active = 1
         ORDER BY h.created_at ASC`,
        [today]
      )
      return Promise.all(
        rows.map(async (row) => {
          const streak = await computeStreak(row.id)
          return mapHabit(row, streak, row.completed_today === 1)
        })
      )
    } catch (error) {
      throw new Error(`habitRepository.getAll failed: ${error}`)
    }
  },

  async getByDate(date: string): Promise<Habit[]> {
    try {
      const rows = await db.getAllAsync<RawHabitWithLog>(
        `SELECT h.*, hl.completed AS completed_today
         FROM habits h
         LEFT JOIN habit_logs hl ON hl.habit_id = h.id AND hl.date = ?
         WHERE h.active = 1
         ORDER BY h.created_at ASC`,
        [date]
      )
      return Promise.all(
        rows.map(async (row) => {
          const streak = await computeStreak(row.id)
          return mapHabit(row, streak, row.completed_today === 1)
        })
      )
    } catch (error) {
      throw new Error(`habitRepository.getByDate failed: ${error}`)
    }
  },

  async create(
    data: Omit<Habit, 'id' | 'created_at' | 'streak' | 'completed_today'>
  ): Promise<Habit> {
    try {
      const id = Crypto.randomUUID()
      const now = new Date().toISOString()
      await db.runAsync(
        `INSERT INTO habits (id, title, icon, color, frequency, target_days, area, active, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          data.title,
          data.icon,
          data.color,
          data.frequency,
          data.target_days,
          data.area ?? null,
          data.active ? 1 : 0,
          now,
        ]
      )
      const row = await db.getFirstAsync<RawHabitWithLog>(
        `SELECT h.*, NULL AS completed_today FROM habits h WHERE h.id = ?`,
        [id]
      )
      if (!row) throw new Error('Habit not found after insert')
      return mapHabit(row, 0, false)
    } catch (error) {
      throw new Error(`habitRepository.create failed: ${error}`)
    }
  },

  async update(id: string, data: Partial<Habit>): Promise<void> {
    try {
      const fields: string[] = []
      const values: (string | number | null)[] = []

      if (data.title !== undefined)       { fields.push('title = ?');       values.push(data.title) }
      if (data.icon !== undefined)        { fields.push('icon = ?');        values.push(data.icon) }
      if (data.color !== undefined)       { fields.push('color = ?');       values.push(data.color) }
      if (data.frequency !== undefined)   { fields.push('frequency = ?');   values.push(data.frequency) }
      if (data.target_days !== undefined) { fields.push('target_days = ?'); values.push(data.target_days) }
      if (data.area !== undefined)        { fields.push('area = ?');        values.push(data.area ?? null) }
      if (data.active !== undefined)      { fields.push('active = ?');      values.push(data.active ? 1 : 0) }

      if (fields.length === 0) return

      values.push(id)
      await db.runAsync(`UPDATE habits SET ${fields.join(', ')} WHERE id = ?`, values)
    } catch (error) {
      throw new Error(`habitRepository.update failed: ${error}`)
    }
  },

  async toggleLog(habitId: string, date: string, completed: boolean): Promise<void> {
    try {
      const existing = await db.getFirstAsync<{ id: string }>(
        'SELECT id FROM habit_logs WHERE habit_id = ? AND date = ?',
        [habitId, date]
      )
      const now = new Date().toISOString()
      if (existing) {
        await db.runAsync(
          'UPDATE habit_logs SET completed = ?, checked_at = ? WHERE id = ?',
          [completed ? 1 : 0, now, existing.id]
        )
      } else {
        const id = Crypto.randomUUID()
        await db.runAsync(
          'INSERT INTO habit_logs (id, habit_id, date, completed, checked_at) VALUES (?, ?, ?, ?, ?)',
          [id, habitId, date, completed ? 1 : 0, now]
        )
      }
    } catch (error) {
      throw new Error(`habitRepository.toggleLog failed: ${error}`)
    }
  },

  async getStreak(habitId: string): Promise<number> {
    try {
      return await computeStreak(habitId)
    } catch (error) {
      throw new Error(`habitRepository.getStreak failed: ${error}`)
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await db.runAsync('DELETE FROM habits WHERE id = ?', [id])
    } catch (error) {
      throw new Error(`habitRepository.delete failed: ${error}`)
    }
  },
}
