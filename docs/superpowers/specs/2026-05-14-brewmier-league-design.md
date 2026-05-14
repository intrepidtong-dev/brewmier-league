# Brewmier League — Design Spec

**Date:** 2026-05-14  
**Status:** Approved

---

## Overview

Brewmier League is a lightweight social game inspired by the Premier League. Friends log beers they consume in real time, competing on a shared leaderboard. No accounts, no passwords — just a join code and a display name.

---

## Brand Identity

**Source:** `brand design.rtf` (in project root)

### Colors
| Token | Hex | Tailwind class | Usage |
|-------|-----|----------------|-------|
| League Red | `#9B1C31` | `league-red` | Hero backgrounds, CTAs, danger states |
| Navy | `#112240` | `navy` | Primary dark surface, table headers, nav |
| Cream | `#F5E9D4` | `cream` | Main page background, alternating rows |
| Beer Gold | `#D8A031` | `beer-gold` | Accent, highlights, headlines on dark |
| Foam White | `#FFF8EE` | `foam` | Card surfaces, input backgrounds |

### Typography
- **Headlines:** Bebas Neue via `next/font/google` — `font-headline`, all-caps, football-program energy
- **Body:** Inter via `next/font/google` — `font-body`, clean UI labels and descriptions

### Logo
Crown lion holding a pint — solid purple silhouette on white. Source: `brewmier-league-logo.png` → served from `public/logo.png`. Used in NavBar (32px, foam circle) and join page hero (80px, foam circle with beer-gold ring).

### Tone
Football banter throughout. Key phrases: "SIGN ON", "LOG PINT", "ABSOLUTE SCENES", "STEADY ON", "MATCH LOG", "Top of the table."

### UI Rules
- Flat, block-based layouts — no glassmorphism
- Sharp corners (`rounded-none`) — 2px navy borders
- Strong typography carries the brand — minimal decoration
- Retro football annual aesthetic: Panini sticker book, matchday program
- "Does this feel like football culture turned into a pint-tracking game?" — if yes, keep it

### Deferred to v2
- Badges system (Hat-Trick Hero, Weekend Warrior, etc.)
- Beer type field on log entries
- Activity feed (match update style)

---

## Architecture

**Stack:** Next.js 14 (App Router) + SQLite via `better-sqlite3` + Tailwind CSS

**Folder structure:**
```
brewmier-league/
├── app/
│   ├── page.tsx                  # Landing / join page
│   ├── league/[code]/page.tsx    # League leaderboard
│   ├── log/page.tsx              # Beer log entry
│   ├── player/[name]/page.tsx    # Personal entry log + stats
│   ├── rules/page.tsx            # Rulebook (renders rulebook.md)
│   ├── admin/page.tsx            # Admin panel (env-var protected)
│   └── api/                      # API routes
│       ├── leagues/route.ts
│       ├── players/route.ts
│       ├── entries/route.ts
│       └── leaderboard/route.ts
├── lib/
│   ├── db.ts                     # SQLite connection + query helpers
│   └── scoring.ts                # Extensible scoring engine
├── components/                   # Shared UI components
├── data/
│   └── brewmier.db               # SQLite database file (gitignored)
└── docs/
    ├── rulebook.md               # Official rulebook (version-controlled)
    └── superpowers/specs/        # Design specs
```

---

## Data Model

### `leagues`
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| name | TEXT | Display name of the league |
| join_code | TEXT UNIQUE | Short alphanumeric, used to join |
| season_start | TEXT | ISO date |
| season_end | TEXT | ISO date, nullable (open season) |
| created_at | TEXT | UTC ISO timestamp |

### `players`
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| league_id | INTEGER FK | |
| display_name | TEXT | Unique within a league |
| joined_at | TEXT | UTC ISO timestamp |

Identity is display_name + join_code. Stored in a browser cookie (7-day expiry). No passwords.

### `beer_entries`
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| player_id | INTEGER FK | |
| league_id | INTEGER FK | |
| logged_at | TEXT | UTC ISO timestamp, set by server at submission |
| timezone_offset | INTEGER | Minutes from UTC (client-sent) |
| notes | TEXT | Optional: beer name, location, etc. |

The server sets `logged_at` — clients cannot backdate entries.

### `scoring_rules`
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| league_id | INTEGER FK | |
| rule_type | TEXT | e.g. `per_entry`, `streak_bonus` |
| points | INTEGER | Points awarded by this rule |
| config_json | TEXT | JSON blob for rule-specific config |

Default rule: `per_entry = 1 point`. Additional rules (streaks, bonuses, multipliers) can be added without schema changes.

---

## Pages & Features

### 1. Join Page (`/`)
- Enter league join code + display name
- Name saved in a browser cookie (7-day expiry)
- If already joined, redirect straight to the league leaderboard
- Validates: join code exists
- If display name already exists in that league → re-links the cookie to that player (cookie-loss recovery)
- If display name is new → creates a new player record

### 2. League Leaderboard (`/league/[code]`)
- Lists all players ranked by current-season points (default view)
- Toggle to all-time stats tab
- Shows: rank, display name, points, beer count, last active
- Polls every 30 seconds for updates (no websockets)
- Premier League table aesthetic

### 3. Log a Beer (`/log`)
- One-tap submission form
- Optional notes field (beer name, location, emoji, etc.)
- Server timestamps the entry at submission (UTC)
- Client sends timezone offset so display in local time is accurate
- Rule enforcement: warn if second entry within 5 minutes (configurable threshold)

### 4. Player Profile (`/player/[name]`)
- Full personal entry log, newest first
- Entry times displayed in player's local timezone
- Personal stats: total beers, current season rank, all-time rank, longest streak

### 5. Rulebook (`/rules`)
- Static page that renders `docs/rulebook.md`
- Version-controlled alongside code — rule changes are tracked in git

### 6. Admin Panel (`/admin`)
- Protected by `ADMIN_SECRET` environment variable (not a login system)
- Create/manage leagues and seasons
- View all entries across all players
- Set season start/end dates

---

## Scoring Engine (`lib/scoring.ts`)

The scoring engine is rule-driven and extensible:

```typescript
type ScoringRule = {
  type: 'per_entry' | 'streak_bonus' | 'weekend_multiplier' // extensible
  points: number
  config?: Record<string, unknown>
}

function computeScore(entries: BeerEntry[], rules: ScoringRule[]): number
```

Starts with `per_entry = 1` (one point per beer). Adding a new rule type only requires adding a new case to the engine — no schema migrations.

---

## Identity & Security

- No passwords, no OAuth
- Identity = `display_name` + `join_code` stored in a signed browser cookie
- Admin routes protected by `ADMIN_SECRET` env var checked server-side
- All timestamps are server-set — clients cannot fake entry times
- No PII collected

---

## Rulebook (initial draft — `docs/rulebook.md`)

Key rules to document:
1. A beer must be logged **immediately before drinking** — real-time only
2. Timestamps are server-generated and cannot be edited after submission
3. One league per friend group (join code keeps groups separate)
4. Seasons run from `season_start` to `season_end` — results are archived
5. Disputes go to the league admin

---

## Verification

End-to-end test checklist:
1. `npm run dev` starts the app on localhost:3000
2. Visit `/` → enter join code + name → cookie is set → redirected to leaderboard
3. Visit `/log` → submit entry → appears on leaderboard within 30s
4. Visit `/player/[name]` → entry shows in local timezone
5. Visit `/rules` → rulebook renders correctly
6. Visit `/admin` with wrong secret → rejected; with correct secret → admin panel loads
7. Submit two entries within 5 minutes → warning displayed
8. Toggle current season / all-time on leaderboard → both views show correct data
