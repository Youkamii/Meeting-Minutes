# Research: Business Management & Weekly Meeting Ops

**Date**: 2026-03-18
**Feature Branch**: `feat/001-biz-meeting-ops`

## Technology Stack Decisions

### Frontend Framework

- **Decision**: React 19 with TypeScript (via Next.js)
- **Rationale**: Best ecosystem for complex table UIs with inline editing
  and drag-and-drop. TanStack Table (headless) provides Excel-like table
  features (column pinning, horizontal scroll, virtual scrolling). shadcn/ui
  + Tailwind CSS for consistent, accessible components with dark mode.
  React 19 brings improved performance with the React Compiler, `use()`
  hook, and Server Components support.
- **Alternatives considered**:
  - Vue 3: Smaller ecosystem for enterprise table components
  - Angular: Overkill for ~50-user internal tool
  - Svelte: Fewer mature table/DnD libraries

### Build Tool

- **Decision**: Next.js (App Router) with Turbopack
- **Rationale**: Integrated build system with fast dev server (Turbopack),
  instant HMR, and optimized production bundles. Eliminates the need for a
  separate build tool since Next.js handles both frontend and API routes.
- **Alternatives considered**: Vite + separate backend (splits codebase),
  Webpack (slower)

### UI Libraries

- **Decision**: TanStack Table + shadcn/ui + Tailwind CSS v4 + dnd-kit
- **Rationale**:
  - TanStack Table: headless, supports column pinning, sorting, filtering,
    virtual scrolling — ideal for the Excel-like Business Management table
  - shadcn/ui: composable components built on Radix UI, accessible, themeable
  - Tailwind CSS: utility-first, excellent dark mode support, responsive
  - dnd-kit: modern drag-and-drop for progress block reordering/moving
- **Alternatives considered**:
  - AG Grid: powerful but expensive license ($2-5k/yr), overkill
  - React Beautiful DnD: mature but less actively maintained than dnd-kit

### State Management

- **Decision**: Zustand (UI state) + TanStack Query (server state)
- **Rationale**: Zustand is minimal (~30KB) for local state (dark mode,
  filters, Meeting Mode). TanStack Query handles server sync, caching,
  optimistic updates, and conflict detection callbacks.
- **Alternatives considered**: Redux (too much boilerplate for this scale)

### Backend Framework

- **Decision**: Next.js API Routes (App Router) with TypeScript
- **Rationale**: Unified TypeScript codebase (frontend + backend), shared
  types, simpler deployment. API routes handle REST endpoints. For ~50
  concurrent users, this is more than sufficient.
- **Alternatives considered**:
  - FastAPI (Python): Strong for data manipulation but splits the codebase
    into two languages
  - Express/Nest.js: Additional setup; Next.js API routes are simpler for
    a monorepo

**Revised decision**: Use Next.js as a fullstack framework (React frontend +
API routes) to keep a single TypeScript codebase. This simplifies type
sharing between client and server.

### ORM

- **Decision**: Prisma with PostgreSQL
- **Rationale**: Type-safe queries, auto-generated client, migration
  management, excellent TypeScript integration. Simpler than raw SQL for
  CRUD-heavy operations.
- **Alternatives considered**:
  - Drizzle ORM: lighter but less mature ecosystem
  - Knex.js: query builder, not full ORM — more manual work

### Database

- **Decision**: PostgreSQL 15+
- **Rationale**: JSONB for audit log changes and version snapshots, array
  types for company aliases, full-text search for global search, strong
  transaction support for merges and carryovers, excellent datetime/timezone
  handling for ISO 8601 weeks.
- **Alternatives considered**:
  - SQLite: no concurrent write support
  - MySQL: weaker JSONB and array support

### Excel Generation

- **Decision**: ExcelJS (Node.js)
- **Rationale**: Full .xlsx generation with styling, merged cells,
  conditional formatting. Works in Node.js (Next.js API routes).
- **Alternatives considered**:
  - SheetJS: community edition lacks styling
  - pandas (Python): would require a separate service

### Authentication (Future)

- **Decision**: NextAuth.js (Auth.js) with Google OAuth provider
- **Rationale**: Drop-in integration with Next.js. Supports Google OAuth,
  session management, and custom callbacks for admin approval flow
  (pending → approved). Can be added later without data model changes.
- **Alternatives considered**:
  - Clerk: third-party dependency, cost
  - Custom OAuth: unnecessary complexity

## Data Model Pattern Decisions

### Audit Logging

- **Decision**: Dedicated `audit_log` table, logged in application code
- **Rationale**: Simple, testable, no database-level magic (triggers).
  JSONB `changes` column stores before/after for updates. Immutable —
  no UPDATE or DELETE allowed on this table.
- **Alternatives considered**:
  - Event sourcing: overkill for ~50 users
  - Database triggers: hard to test, fragile, bypasses app logic

### Version History

- **Decision**: Separate version tables with JSONB snapshots
  (e.g., `business_version`, `weekly_action_version`)
- **Rationale**: Full snapshot per version enables trivial restore-as-new
  (copy snapshot into new version). JSON diff libraries handle comparison.
  No complex temporal table setup needed.
- **Alternatives considered**:
  - Temporal tables: complex schema, harder ad-hoc queries
  - Single `version` table for all types: works but less type-safe

### Conflict Detection

- **Decision**: Optimistic locking via integer `lock_version` column
- **Rationale**: Fast, unambiguous, lightweight. On save, compare
  submitted lock_version with current DB value. If mismatch → conflict
  response with latest data for diff display.
- **Alternatives considered**:
  - Timestamp-only: vulnerable to same-second edits
  - Pessimistic locking: blocks other users, poor UX

### Polymorphic Internal Notes

- **Decision**: Single `internal_note` table with `owner_type` + `owner_id`
- **Rationale**: Clean polymorphic association. Single query per owner.
  CHECK constraint ensures valid owner_type values.
- **Alternatives considered**:
  - Nullable FKs (3 columns): messy, hard to enforce exactly-one constraint
  - Separate join tables: multiplies tables and queries

### Weekly Carryover

- **Decision**: Copy semantics with `carried_from_id` FK + denormalized
  `carryover_count`
- **Rationale**: Original stays in source week (preserves history). New
  copy links back via carried_from_id. Denormalized count avoids recursive
  chain traversal. UNIQUE constraint on (carried_from_id, week_year,
  week_number) prevents duplicate carryovers.
- **Alternatives considered**:
  - Move semantics: loses weekly history
  - Separate lineage table: unnecessary for simple chains

## Final Technology Summary

| Layer        | Choice                                    |
|--------------|-------------------------------------------|
| Frontend     | React 19 + TypeScript + Next.js            |
| UI           | TanStack Table + shadcn/ui + Tailwind v4  |
| DnD          | dnd-kit                                   |
| State        | Zustand + TanStack Query                  |
| Fullstack    | Next.js (App Router)                      |
| ORM          | Prisma                                    |
| Database     | PostgreSQL 15+                            |
| Excel        | ExcelJS                                   |
| Auth (future)| NextAuth.js (Auth.js) + Google OAuth      |
| Dark Mode    | next-themes + Tailwind dark: variant      |
| Forms        | React Hook Form + Zod                     |
