# Data Model: Business Management & Weekly Meeting Ops

**Date**: 2026-03-18
**Feature Branch**: `feat/001-biz-meeting-ops`

## Entity Relationship Overview

```
User (future-ready)
  ├── created_by/updated_by → all entities
  └── assigned_to → Business, WeeklyAction

Company (shared master)
  ├── has many → Business
  ├── has many → WeeklyAction (direct)
  ├── has many → InternalNote (polymorphic)
  └── has many → CompanyAlias

Business
  ├── belongs to → Company
  ├── has many → ProgressItem
  ├── has many → WeeklyAction (optional link)
  ├── has many → InternalNote (polymorphic)
  └── has many → BusinessVersion

ProgressItem
  ├── belongs to → Business
  └── has many → ProgressItemVersion

WeeklyAction
  ├── belongs to → Company (required)
  ├── belongs to → Business (optional)
  ├── belongs to → WeeklyCycle
  ├── self-reference → carried_from (copy chain)
  ├── has many → InternalNote (polymorphic)
  └── has many → WeeklyActionVersion

InternalNote (polymorphic)
  ├── owner → Company | Business | WeeklyAction
  └── has many → InternalNoteVersion

AuditLog (immutable, append-only)
```

## Entities

### User

Future-ready. Initially seeded with a system user. All FK references
are nullable until authentication is enabled.

| Field        | Type         | Constraints                        |
|--------------|--------------|------------------------------------|
| id           | UUID         | PK                                 |
| email        | VARCHAR(255) | UNIQUE, nullable (future)          |
| name         | VARCHAR(255) | NOT NULL                           |
| role         | ENUM         | 'admin', 'user'; DEFAULT 'user'    |
| status       | ENUM         | 'pending', 'approved', 'rejected'; DEFAULT 'approved' |
| created_at   | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()            |
| updated_at   | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()            |

**Initial seed**: One system user (id=system, name="System",
role=admin, status=approved) for pre-auth operation.

---

### Company

| Field          | Type         | Constraints                      |
|----------------|--------------|----------------------------------|
| id             | UUID         | PK                               |
| canonical_name | VARCHAR(255) | NOT NULL                         |
| is_key         | BOOLEAN      | DEFAULT FALSE                    |
| status         | ENUM         | 'active', 'archived'             |
| is_archived    | BOOLEAN      | DEFAULT FALSE                    |
| archived_at    | TIMESTAMPTZ  | nullable                         |
| sort_order     | INT          | DEFAULT 0                        |
| created_by     | UUID         | FK → User, nullable              |
| updated_by     | UUID         | FK → User, nullable              |
| created_at     | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()          |
| updated_at     | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()          |
| lock_version   | INT          | NOT NULL, DEFAULT 1              |

**Indexes**: canonical_name, is_key, is_archived, sort_order

---

### CompanyAlias

| Field       | Type         | Constraints                        |
|-------------|--------------|------------------------------------|
| id          | UUID         | PK                                 |
| company_id  | UUID         | FK → Company, NOT NULL, ON DELETE CASCADE |
| alias       | VARCHAR(255) | NOT NULL                           |
| created_at  | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()            |

**Indexes**: UNIQUE(company_id, alias), alias (for search)

---

### Business

| Field          | Type         | Constraints                      |
|----------------|--------------|----------------------------------|
| id             | UUID         | PK                               |
| company_id     | UUID         | FK → Company, NOT NULL           |
| name           | VARCHAR(255) | NOT NULL                         |
| visibility     | ENUM         | 'public', 'private'; DEFAULT 'public' |
| scale          | TEXT         | nullable (free text)             |
| timing_text    | TEXT         | nullable (free text, e.g. "2026 상반기") |
| timing_start   | DATE         | nullable (optional date picker)  |
| timing_end     | DATE         | nullable (optional date picker)  |
| current_stage  | ENUM         | see Stage enum; nullable         |
| assigned_to    | UUID         | FK → User, nullable              |
| is_archived    | BOOLEAN      | DEFAULT FALSE                    |
| archived_at    | TIMESTAMPTZ  | nullable                         |
| sort_order     | INT          | DEFAULT 0                        |
| created_by     | UUID         | FK → User, nullable              |
| updated_by     | UUID         | FK → User, nullable              |
| created_at     | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()          |
| updated_at     | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()          |
| lock_version   | INT          | NOT NULL, DEFAULT 1              |

**Stage enum**: `inbound`, `funnel`, `pipeline`, `proposal`, `contract`,
`build`, `maintenance`

**Indexes**: company_id, assigned_to, is_archived, current_stage

---

### ProgressItem

| Field        | Type         | Constraints                       |
|--------------|--------------|-----------------------------------|
| id           | UUID         | PK                                |
| business_id  | UUID         | FK → Business, NOT NULL           |
| stage        | ENUM         | Stage enum, NOT NULL              |
| content      | TEXT         | NOT NULL                          |
| sort_order   | INT          | DEFAULT 0                         |
| created_by   | UUID         | FK → User, nullable               |
| updated_by   | UUID         | FK → User, nullable               |
| created_at   | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()           |
| updated_at   | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()           |
| lock_version | INT          | NOT NULL, DEFAULT 1               |

**Indexes**: (business_id, stage, sort_order)

**Constraints**: Progress items cannot move across business rows
(enforced in application logic).

---

### WeeklyCycle

| Field       | Type | Constraints                              |
|-------------|------|------------------------------------------|
| id          | UUID | PK                                       |
| year        | INT  | NOT NULL (e.g. 2026)                     |
| week_number | INT  | NOT NULL (ISO 8601, 1-53)                |
| start_date  | DATE | NOT NULL                                 |
| end_date    | DATE | NOT NULL                                 |
| created_at  | TIMESTAMPTZ | NOT NULL, DEFAULT NOW()             |

**Indexes**: UNIQUE(year, week_number)

**Note**: Cycles are created on demand or pre-seeded for the current year.

---

### WeeklyAction

| Field            | Type         | Constraints                    |
|------------------|--------------|--------------------------------|
| id               | UUID         | PK                             |
| cycle_id         | UUID         | FK → WeeklyCycle, NOT NULL     |
| company_id       | UUID         | FK → Company, NOT NULL         |
| business_id      | UUID         | FK → Business, nullable        |
| content          | TEXT         | NOT NULL                       |
| assigned_to      | UUID         | FK → User, nullable            |
| status           | ENUM         | 'scheduled', 'in_progress', 'completed', 'on_hold' |
| priority         | ENUM         | 'high', 'medium', 'low'; DEFAULT 'medium' |
| carried_from_id  | UUID         | FK → WeeklyAction, nullable    |
| carryover_count  | INT          | DEFAULT 0                      |
| is_archived      | BOOLEAN      | DEFAULT FALSE                  |
| archived_at      | TIMESTAMPTZ  | nullable                       |
| sort_order       | INT          | DEFAULT 0                      |
| created_by       | UUID         | FK → User, nullable            |
| updated_by       | UUID         | FK → User, nullable            |
| created_at       | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()        |
| updated_at       | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()        |
| lock_version     | INT          | NOT NULL, DEFAULT 1            |

**Indexes**: cycle_id, company_id, business_id, assigned_to, status,
carried_from_id, UNIQUE(carried_from_id, cycle_id) — prevents duplicate
carryover to same week.

**State transitions**:
```
scheduled → in_progress → completed
scheduled → on_hold
in_progress → on_hold
on_hold → scheduled | in_progress
(any non-completed) → carryover (creates new copy)
```

---

### InternalNote

| Field       | Type         | Constraints                        |
|-------------|--------------|------------------------------------|
| id          | UUID         | PK                                 |
| owner_type  | VARCHAR(50)  | NOT NULL; CHECK IN ('company', 'business', 'weekly_action') |
| owner_id    | UUID         | NOT NULL                           |
| title       | VARCHAR(255) | nullable                           |
| body        | TEXT         | NOT NULL                           |
| tag         | ENUM         | 'situation', 'decision', 'risk', 'follow_up'; nullable |
| created_by  | UUID         | FK → User, nullable                |
| updated_by  | UUID         | FK → User, nullable                |
| created_at  | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()            |
| updated_at  | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()            |
| lock_version| INT          | NOT NULL, DEFAULT 1                |

**Indexes**: (owner_type, owner_id, created_at DESC)

---

### AuditLog

Immutable. No UPDATE or DELETE permitted.

| Field        | Type         | Constraints                      |
|--------------|--------------|----------------------------------|
| id           | UUID         | PK                               |
| entity_type  | VARCHAR(50)  | NOT NULL                         |
| entity_id    | UUID         | NOT NULL                         |
| action       | VARCHAR(30)  | NOT NULL (create, update, delete, move, merge, carryover, download, status_change, role_change) |
| actor_id     | UUID         | FK → User, nullable              |
| changes      | JSONB        | nullable (before/after for updates) |
| summary      | TEXT         | nullable (human-readable)        |
| created_at   | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()          |

**Indexes**: (entity_type, entity_id), created_at DESC,
actor_id

**Retention**: Unlimited (no automatic purge).

---

### Version Tables

One version table per versionable entity. All follow the same pattern.

#### BusinessVersion

| Field          | Type         | Constraints                    |
|----------------|--------------|--------------------------------|
| id             | UUID         | PK                             |
| business_id    | UUID         | FK → Business, NOT NULL        |
| version_number | INT          | NOT NULL                       |
| snapshot       | JSONB        | NOT NULL (full entity state)   |
| created_by     | UUID         | FK → User, nullable            |
| created_at     | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()        |

**Indexes**: UNIQUE(business_id, version_number),
(business_id, created_at DESC)

#### ProgressItemVersion

Same structure: `progress_item_id`, `version_number`, `snapshot`,
`created_by`, `created_at`.

#### WeeklyActionVersion

Same structure: `weekly_action_id`, `version_number`, `snapshot`,
`created_by`, `created_at`.

#### InternalNoteVersion

Same structure: `internal_note_id`, `version_number`, `snapshot`,
`created_by`, `created_at`.

**Retention**: Unlimited (no automatic purge). Restore creates a new
version (never overwrites).

---

### RecentView (per-user browsing history)

| Field       | Type         | Constraints                        |
|-------------|--------------|------------------------------------|
| id          | UUID         | PK                                 |
| user_id     | UUID         | FK → User, nullable                |
| session_id  | VARCHAR(255) | nullable (browser-based fallback)  |
| entity_type | VARCHAR(50)  | NOT NULL                           |
| entity_id   | UUID         | NOT NULL                           |
| viewed_at   | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()            |

**Indexes**: (user_id, viewed_at DESC), (session_id, viewed_at DESC)

**Note**: When auth is disabled, session_id (from cookie) tracks views.
When auth is enabled, user_id is used. Old entries can be pruned
periodically (e.g., keep last 100 per user).
