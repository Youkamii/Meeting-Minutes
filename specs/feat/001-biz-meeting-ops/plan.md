# Implementation Plan: Business Management & Weekly Meeting Ops

**Branch**: `feat/001-biz-meeting-ops` | **Date**: 2026-03-18 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/feat/001-biz-meeting-ops/spec.md`

## Summary

Replace Excel-based business management and weekly meeting workflows with
a fullstack web application. The service provides an Excel-like table for
pipeline tracking (Business Management), a weekly-cycle-centric action
manager (Weekly Meeting), audit logging, version history, conflict
detection, meeting mode, global search with quick actions, and Excel
download. Built as a Next.js monorepo with React frontend, API routes
backend, PostgreSQL database, and Prisma ORM.

## Technical Context

**Language/Version**: TypeScript 5.x (Node.js 20+)
**Primary Dependencies**: Next.js (App Router), React 18, TanStack Table,
TanStack Query, Zustand, shadcn/ui, Tailwind CSS v4, dnd-kit, Prisma,
ExcelJS, React Hook Form, Zod, next-themes
**Storage**: PostgreSQL 15+
**Testing**: Vitest (unit), Playwright (E2E)
**Target Platform**: Web (desktop, tablet, mobile responsive)
**Project Type**: Fullstack web application (Next.js monorepo)
**Performance Goals**: API p95 ≤ 200ms, page load ≤ 2s, search ≤ 1s
for 10K companies
**Constraints**: ~50 concurrent users, no real-time co-editing, no auth
initially (future Google OAuth)
**Scale/Scope**: ~10K companies, ~50K businesses, ~50 concurrent users

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality | PASS | TypeScript + ESLint + Prettier enforced; Prisma provides type-safe queries; PR review required per constitution |
| II. Testing Standards | PASS | Vitest for unit tests, Playwright for E2E; CI will run tests before merge |
| III. UX Consistency | PASS | shadcn/ui design system; Tailwind for consistent theming; dark mode via next-themes; responsive breakpoints defined in spec |
| IV. Performance Requirements | PASS | TanStack Table virtual scrolling for large tables; PostgreSQL indexes defined in data model; optimistic locking avoids blocking |
| V. Simplicity & YAGNI | PASS | Single Next.js monorepo (no microservices); no Redis, no GraphQL, no containerization initially; auth deferred with nullable FKs |

No violations. All principles satisfied.

## Project Structure

### Documentation (this feature)

```text
specs/feat/001-biz-meeting-ops/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 technology research
├── data-model.md        # Phase 1 entity model
├── quickstart.md        # Phase 1 dev quickstart
├── contracts/
│   └── api-contracts.md # Phase 1 REST API contracts
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
src/
├── app/                    # Next.js App Router
│   ├── page.tsx            # Home / Activity Center
│   ├── business/           # Business Management screens
│   ├── weekly/             # Weekly Meeting screens
│   ├── admin/              # Admin screens
│   ├── api/                # REST API Routes
│   │   ├── companies/
│   │   ├── businesses/
│   │   ├── progress-items/
│   │   ├── weekly-actions/
│   │   ├── weekly-cycles/
│   │   ├── notes/
│   │   ├── search/
│   │   ├── audit-logs/
│   │   ├── versions/
│   │   ├── export/
│   │   ├── bulk/
│   │   ├── recent-views/
│   │   └── admin/
│   └── layout.tsx          # Root layout (nav, dark mode)
├── components/
│   ├── ui/                 # shadcn/ui base components
│   ├── business-table/     # TanStack Table for Business Mgmt
│   ├── progress-blocks/    # dnd-kit progress stage blocks
│   ├── weekly-meeting/     # Weekly Meeting components
│   ├── meeting-mode/       # Meeting Mode view
│   ├── search/             # Global search + quick actions
│   ├── notes/              # Internal notes timeline
│   ├── version-diff/       # Version comparison UI
│   └── conflict-dialog/    # Conflict resolution modal
├── lib/
│   ├── prisma.ts           # Prisma client singleton
│   ├── audit.ts            # Audit logging helper
│   ├── version.ts          # Version snapshot helper
│   ├── conflict.ts         # Optimistic locking helper
│   ├── excel.ts            # ExcelJS export helpers
│   └── weekly-cycle.ts     # ISO 8601 week utilities
├── hooks/                  # React Query hooks
├── stores/                 # Zustand stores
└── types/                  # Shared TypeScript types

prisma/
├── schema.prisma
├── migrations/
└── seed.ts

tests/
├── unit/
├── integration/
└── e2e/
```

**Structure Decision**: Single Next.js monorepo. Frontend and backend
share TypeScript types. API routes in `src/app/api/`. No separate
backend service needed at this scale.

## Complexity Tracking

No constitution violations to justify.

## Phase 0 Output

See [research.md](research.md) for full technology research and decisions.

**Key decisions**:
- Fullstack: Next.js App Router (single TypeScript codebase)
- UI: TanStack Table + shadcn/ui + Tailwind + dnd-kit
- State: Zustand (UI) + TanStack Query (server)
- DB: PostgreSQL + Prisma ORM
- Audit: dedicated table, app-level logging (not triggers)
- Versions: JSONB snapshot tables, restore-as-new
- Conflict: integer lock_version (optimistic locking)
- Notes: polymorphic (owner_type + owner_id)
- Carryover: copy semantics with carried_from_id + denormalized count
- Excel: ExcelJS
- Auth (future): NextAuth.js + Google OAuth

## Phase 1 Output

- [data-model.md](data-model.md) — Full entity model with fields,
  types, constraints, indexes, and state transitions
- [contracts/api-contracts.md](contracts/api-contracts.md) — REST API
  contract for all endpoints
- [quickstart.md](quickstart.md) — Developer setup and verification
  guide
