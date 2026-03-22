import Database from 'better-sqlite3'
import path from 'path'

let db: Database.Database

export function openDb(filepath?: string): Database.Database {
  const dbPath = filepath ?? path.join(process.cwd(), 'data.db')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  return db
}

export function getDb(): Database.Database {
  if (!db) throw new Error('Database not initialized. Call openDb() first.')
  return db
}

export function initDb(filepath?: string): void {
  const database = openDb(filepath)
  database.exec(`
    CREATE TABLE IF NOT EXISTS inspections (
      id             TEXT PRIMARY KEY,
      name           TEXT NOT NULL,
      standard_id    TEXT NOT NULL,
      standard_name  TEXT NOT NULL,
      image_url      TEXT,
      note           TEXT,
      price          REAL,
      sampling_point TEXT,
      sampling_date  TEXT,
      total_sample   INTEGER NOT NULL,
      composition    TEXT NOT NULL,
      defects        TEXT NOT NULL,
      created_at     TEXT NOT NULL,
      updated_at     TEXT NOT NULL
    )
  `)
}
