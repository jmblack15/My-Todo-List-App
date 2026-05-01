import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite'

export const db: SQLiteDatabase = openDatabaseSync('productivity.db')

export async function initDB(): Promise<void> {
  // WAL must be set outside any transaction
  await db.execAsync('PRAGMA journal_mode = WAL;')

  // Add reminder_time column to existing habits tables (no-op if already present)
  try {
    await db.execAsync('ALTER TABLE habits ADD COLUMN reminder_time TEXT')
  } catch {
    // column already exists
  }

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS tasks (
      id          TEXT    PRIMARY KEY,
      title       TEXT    NOT NULL,
      notes       TEXT,
      due_date    TEXT,
      due_time    TEXT,
      priority    TEXT    NOT NULL DEFAULT 'medium',
      done        INTEGER NOT NULL DEFAULT 0,
      done_at     TEXT,
      skipped     INTEGER NOT NULL DEFAULT 0,
      block_id    TEXT,
      created_at  TEXT    NOT NULL,
      updated_at  TEXT    NOT NULL
    );

    CREATE TABLE IF NOT EXISTS habits (
      id          TEXT    PRIMARY KEY,
      title       TEXT    NOT NULL,
      icon        TEXT    NOT NULL,
      color       TEXT    NOT NULL,
      frequency   TEXT    NOT NULL DEFAULT 'daily',
      target_days INTEGER NOT NULL DEFAULT 7,
      area        TEXT,
      active      INTEGER NOT NULL DEFAULT 1,
      created_at  TEXT    NOT NULL
    );

    CREATE TABLE IF NOT EXISTS habit_logs (
      id          TEXT    PRIMARY KEY,
      habit_id    TEXT    NOT NULL,
      date        TEXT    NOT NULL,
      completed   INTEGER NOT NULL DEFAULT 0,
      note        TEXT,
      checked_at  TEXT,
      FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
      UNIQUE (habit_id, date)
    );

    CREATE TABLE IF NOT EXISTS schedule_blocks (
      id          TEXT    PRIMARY KEY,
      title       TEXT    NOT NULL,
      start_time  TEXT    NOT NULL,
      end_time    TEXT    NOT NULL,
      day_of_week INTEGER,
      color       TEXT    NOT NULL,
      recurrence  TEXT    NOT NULL DEFAULT 'weekly',
      created_at  TEXT    NOT NULL
    );

    CREATE TABLE IF NOT EXISTS task_occurrences (
      id       TEXT    PRIMARY KEY,
      task_id  TEXT    NOT NULL,
      date     TEXT    NOT NULL,
      done     INTEGER NOT NULL DEFAULT 0,
      done_at  TEXT,
      skipped  INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      UNIQUE (task_id, date)
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_due_date     ON tasks(due_date);
    CREATE INDEX IF NOT EXISTS idx_habit_logs_date    ON habit_logs(date);
    CREATE INDEX IF NOT EXISTS idx_habit_logs_habit   ON habit_logs(habit_id);
    CREATE INDEX IF NOT EXISTS idx_occurrences_date   ON task_occurrences(date);
    CREATE INDEX IF NOT EXISTS idx_occurrences_task   ON task_occurrences(task_id);
  `)
}
