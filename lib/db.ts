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
      league_id    INTEGER NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
      display_name TEXT    NOT NULL,
      joined_at    TEXT    NOT NULL DEFAULT (datetime('now')),
      UNIQUE(league_id, display_name)
    );

    CREATE TABLE IF NOT EXISTS beer_entries (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id        INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      league_id        INTEGER NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
      logged_at        TEXT    NOT NULL,
      timezone_offset  INTEGER NOT NULL DEFAULT 0,
      venue            TEXT,
      notes            TEXT
    );

    CREATE TABLE IF NOT EXISTS scoring_rules (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      league_id   INTEGER NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
      rule_type   TEXT    NOT NULL,
      points      INTEGER NOT NULL DEFAULT 1,
      config_json TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_players_league_id
      ON players(league_id);

    CREATE INDEX IF NOT EXISTS idx_beer_entries_player_id
      ON beer_entries(player_id);

    CREATE INDEX IF NOT EXISTS idx_beer_entries_league_logged
      ON beer_entries(league_id, logged_at);

    CREATE INDEX IF NOT EXISTS idx_scoring_rules_league_id
      ON scoring_rules(league_id);
  `)
}

// --- Query Helpers ---

export function createLeague(
  name: string,
  joinCode: string,
  seasonStart?: string,
  seasonEnd?: string,
): League {
  const db = getDb()
  const result = db
    .prepare('INSERT INTO leagues (name, join_code, season_start, season_end) VALUES (?, ?, ?, ?)')
    .run(name, joinCode, seasonStart ?? null, seasonEnd ?? null)
  db
    .prepare('INSERT INTO scoring_rules (league_id, rule_type, points) VALUES (?, ?, ?)')
    .run(result.lastInsertRowid, 'per_entry', 1)
  return db
    .prepare('SELECT * FROM leagues WHERE id = ?')
    .get(result.lastInsertRowid) as League
}

export function getLeagueByCode(joinCode: string): League | undefined {
  return getDb()
    .prepare('SELECT * FROM leagues WHERE join_code = ?')
    .get(joinCode) as League | undefined
}

export function getAllLeagues(): League[] {
  return getDb()
    .prepare('SELECT * FROM leagues ORDER BY created_at DESC')
    .all() as League[]
}

export function getOrCreatePlayer(leagueId: number, displayName: string): Player {
  const db = getDb()
  const existing = db
    .prepare('SELECT * FROM players WHERE league_id = ? AND display_name = ?')
    .get(leagueId, displayName) as Player | undefined
  if (existing) return existing
  const result = db
    .prepare('INSERT INTO players (league_id, display_name) VALUES (?, ?)')
    .run(leagueId, displayName)
  return db
    .prepare('SELECT * FROM players WHERE id = ?')
    .get(result.lastInsertRowid) as Player
}

export function getPlayersByLeague(leagueId: number): Player[] {
  return getDb()
    .prepare('SELECT * FROM players WHERE league_id = ?')
    .all(leagueId) as Player[]
}

export function getPlayerByName(leagueId: number, displayName: string): Player | undefined {
  return getDb()
    .prepare('SELECT * FROM players WHERE league_id = ? AND display_name = ?')
    .get(leagueId, displayName) as Player | undefined
}

export function createEntry(
  playerId: number,
  leagueId: number,
  timezoneOffset: number,
  venue?: string,
  notes?: string,
): BeerEntry {
  const db = getDb()
  const loggedAt = new Date().toISOString()
  const result = db
    .prepare('INSERT INTO beer_entries (player_id, league_id, logged_at, timezone_offset, venue, notes) VALUES (?, ?, ?, ?, ?, ?)')
    .run(playerId, leagueId, loggedAt, timezoneOffset, venue ?? null, notes ?? null)
  return db
    .prepare('SELECT * FROM beer_entries WHERE id = ?')
    .get(result.lastInsertRowid) as BeerEntry
}

export function getEntriesByPlayer(playerId: number): BeerEntry[] {
  return getDb()
    .prepare('SELECT * FROM beer_entries WHERE player_id = ? ORDER BY logged_at DESC')
    .all(playerId) as BeerEntry[]
}

export function getEntriesByLeague(leagueId: number): BeerEntry[] {
  return getDb()
    .prepare('SELECT * FROM beer_entries WHERE league_id = ? ORDER BY logged_at DESC')
    .all(leagueId) as BeerEntry[]
}

export function getRecentEntryByPlayer(playerId: number): BeerEntry | undefined {
  return getDb()
    .prepare('SELECT * FROM beer_entries WHERE player_id = ? ORDER BY logged_at DESC LIMIT 1')
    .get(playerId) as BeerEntry | undefined
}

export function getScoringRules(leagueId: number): ScoringRule[] {
  return getDb()
    .prepare('SELECT * FROM scoring_rules WHERE league_id = ?')
    .all(leagueId) as ScoringRule[]
}

export type EntryWithContext = BeerEntry & {
  display_name: string
  league_name: string
}

export function getAllEntriesWithContext(): EntryWithContext[] {
  return getDb()
    .prepare(`
      SELECT be.*, p.display_name, l.name AS league_name
      FROM beer_entries be
      JOIN players p ON be.player_id = p.id
      JOIN leagues l ON be.league_id = l.id
      ORDER BY be.logged_at DESC
    `)
    .all() as EntryWithContext[]
}
