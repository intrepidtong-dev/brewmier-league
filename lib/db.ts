import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

// --- Types ---

export type League = {
  id: number
  name: string
  join_code: string
  season_start: string | null
  season_end: string | null
  created_at: string
}

export type Player = {
  id: number
  league_id: number
  display_name: string
  joined_at: string
}

export type BeerEntry = {
  id: number
  player_id: number
  league_id: number
  logged_at: string         // UTC ISO, server-set
  timezone_offset: number   // minutes from UTC
  venue: string | null
  notes: string | null
}

export type ScoringRule = {
  id: number
  league_id: number
  rule_type: string
  points: number
  config_json: string | null
}

// --- Singleton ---

let _db: Database.Database | null = null

export function _resetDb(): void {
  if (_db) { try { _db.close() } catch {} }
  _db = null
}

export function getDb(): Database.Database {
  if (_db) return _db
  const dbPath = process.env.DATABASE_PATH
    ?? path.join(process.cwd(), 'data', 'brewmier.db')
  if (dbPath !== ':memory:') {
    const dir = path.dirname(dbPath)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  }
  _db = new Database(dbPath)
  _db.pragma('journal_mode = WAL')
  _db.pragma('foreign_keys = ON')
  initSchema(_db)
  return _db
}

function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS leagues (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      name         TEXT    NOT NULL,
      join_code    TEXT    NOT NULL UNIQUE,
      season_start TEXT,
      season_end   TEXT,
      created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS players (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      league_id    INTEGER NOT NULL REFERENCES leagues(id),
      display_name TEXT    NOT NULL,
      joined_at    TEXT    NOT NULL DEFAULT (datetime('now')),
      UNIQUE(league_id, display_name)
    );

    CREATE TABLE IF NOT EXISTS beer_entries (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id        INTEGER NOT NULL REFERENCES players(id),
      league_id        INTEGER NOT NULL REFERENCES leagues(id),
      logged_at        TEXT    NOT NULL,
      timezone_offset  INTEGER NOT NULL DEFAULT 0,
      venue            TEXT,
      notes            TEXT
    );

    CREATE TABLE IF NOT EXISTS scoring_rules (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      league_id   INTEGER NOT NULL REFERENCES leagues(id),
      rule_type   TEXT    NOT NULL,
      points      INTEGER NOT NULL DEFAULT 1,
      config_json TEXT
    );
  `)
}
