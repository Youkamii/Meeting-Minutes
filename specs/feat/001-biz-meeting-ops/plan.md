# Implementation Plan: Business Management & Weekly Meeting Ops

**Branch**: `feat/001-biz-meeting-ops` → merged to `master` | **Date**: 2026-03-18 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/feat/001-biz-meeting-ops/spec.md`

## Summary

Replace Excel-based business management and weekly meeting workflows with
a fullstack web application. The service provides an Excel-like table for
pipeline tracking (Business Management), a weekly-cycle-centric action
manager (Weekly Meeting), audit logging, version history, conflict
detection, global search, Excel download, Google OAuth + 공유 비밀번호 인증,
주간 체크포인트 시스템. Built as a Next.js monorepo with React frontend,
API routes backend, PostgreSQL database, and Prisma ORM.

## Technical Context

**Language/Version**: TypeScript 5.x (Node.js 20+)
**Primary Dependencies**: Next.js 16 (App Router), React 19, TanStack Table,
TanStack Query, Zustand, Tailwind CSS v4, dnd-kit, Prisma 7, ExcelJS,
React Hook Form, Zod, next-themes, NextAuth 5, Tiptap 3
**Storage**: PostgreSQL 15+
**Testing**: 없음 (테스트 스위트 미구성)
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
│   ├── admin/              # Admin screens (users, logs, settings, checkpoints, merge)
│   ├── login/              # 로그인 페이지
│   ├── pending/            # 승인 대기 페이지
│   ├── privacy/            # 개인정보 처리방침
│   ├── admin-unlock/       # 관리자 언락
│   ├── api/                # REST API Routes
│   │   ├── auth/           # NextAuth 핸들러
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
│   │   ├── admin/
│   │   └── cron/           # 정기 체크포인트 cron
│   └── layout.tsx          # Root layout (nav, dark mode)
├── components/
│   ├── ui/                 # 기본 UI 컴포넌트 (button, empty-state)
│   ├── layout/             # top-nav.tsx
│   ├── business-table/     # TanStack Table for Business Mgmt
│   ├── progress-blocks/    # dnd-kit progress stage blocks
│   ├── weekly-meeting/     # Weekly Meeting components
│   ├── meeting-mode/       # ⚠ 제거됨 (2026-04-03) — meeting-action-card.tsx 잔류
│   ├── home/               # activity-feed, key-companies-card, incomplete-actions-card
│   ├── export/             # excel-download-dialog
│   ├── editor/             # inline-editor (Tiptap)
│   ├── search/             # Global search overlay
│   ├── notes/              # Internal notes timeline
│   ├── version-diff/       # Version comparison UI
│   ├── conflict-dialog/    # Conflict resolution modal
│   └── version-unlock-modal.tsx
├── lib/
│   ├── prisma.ts           # Prisma client singleton
│   ├── auth.ts             # NextAuth 설정 (Google OAuth + Credentials)
│   ├── audit.ts            # Audit logging helper
│   ├── version.ts          # Version snapshot helper
│   ├── version-unlock.ts   # Version unlock utility
│   ├── conflict.ts         # Optimistic locking helper
│   ├── checkpoint.ts       # 체크포인트 백업/복원
│   ├── admin-unlock.ts     # Admin unlock utility
│   ├── excel.ts            # ExcelJS export helpers
│   ├── fetch.ts            # Custom fetch wrapper
│   └── weekly-cycle.ts     # ISO 8601 week utilities
├── hooks/                  # React Query hooks
├── stores/                 # Zustand stores
└── types/                  # Shared TypeScript types

prisma/
├── schema.prisma
├── migrations/
└── seed.ts
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
- Auth: NextAuth 5 + Google OAuth + APP_PASSWORD Credentials (구현 완료)

## Phase 1 Output

- [data-model.md](data-model.md) — Full entity model with fields,
  types, constraints, indexes, and state transitions
- [contracts/api-contracts.md](contracts/api-contracts.md) — REST API
  contract for all endpoints
- [quickstart.md](quickstart.md) — Developer setup and verification
  guide
