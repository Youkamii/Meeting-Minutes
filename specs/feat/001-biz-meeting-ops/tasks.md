# Tasks: Business Management & Weekly Meeting Ops

**Input**: Design documents from `specs/feat/001-biz-meeting-ops/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Tests are NOT explicitly requested in the spec. Test tasks are omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Fullstack Next.js**: `src/app/` for pages and API routes, `src/components/` for UI, `src/lib/` for utilities
- `prisma/schema.prisma` for database schema
- `src/types/` for shared TypeScript types

---

## Phase 1: Setup

**Purpose**: Project initialization and basic structure

- [ ] T001 Initialize Next.js project with TypeScript, Tailwind CSS v4, and App Router in project root
- [ ] T002 Install and configure core dependencies (TanStack Table, TanStack Query, Zustand, shadcn/ui, dnd-kit, Prisma, ExcelJS, React Hook Form, Zod, next-themes) in package.json
- [ ] T003 [P] Configure ESLint and Prettier with TypeScript rules in .eslintrc.js and .prettierrc
- [ ] T004 [P] Set up shadcn/ui with Tailwind CSS and configure dark mode theme in tailwind.config.ts and src/app/globals.css
- [ ] T005 [P] Create shared TypeScript types for all entities (Company, Business, ProgressItem, WeeklyCycle, WeeklyAction, InternalNote, AuditLog, Version, User) in src/types/index.ts
- [ ] T006 [P] Create .env.example with DATABASE_URL and other environment variable templates

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema, core utilities, and layout that ALL user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [ ] T007 Define complete Prisma schema with all entities (User, Company, CompanyAlias, Business, ProgressItem, WeeklyCycle, WeeklyAction, InternalNote, AuditLog, BusinessVersion, ProgressItemVersion, WeeklyActionVersion, InternalNoteVersion, RecentView) including enums, relations, and indexes in prisma/schema.prisma
- [ ] T008 Create Prisma seed script with system user and sample weekly cycle in prisma/seed.ts
- [ ] T009 Create Prisma client singleton in src/lib/prisma.ts
- [ ] T010 [P] Create audit logging utility (createAuditLog helper that accepts entity_type, entity_id, action, changes, actor_id) in src/lib/audit.ts
- [ ] T011 [P] Create version snapshot utility (createVersionSnapshot helper that serializes entity to JSONB and auto-increments version_number) in src/lib/version.ts
- [ ] T012 [P] Create optimistic locking utility (checkLockVersion helper that compares submitted vs current lock_version, throws ConflictError) in src/lib/conflict.ts
- [ ] T013 [P] Create ISO 8601 weekly cycle utilities (getCurrentWeek, getWeekDateRange, formatWeekLabel) in src/lib/weekly-cycle.ts
- [ ] T014 Create root layout with navigation (top menu: Home, Business Management, Weekly Meeting, Admin), global search input, dark mode toggle via next-themes, and user area placeholder in src/app/layout.tsx
- [ ] T015 [P] Create Zustand store for UI state (dark mode preference, sidebar collapsed, meeting mode active, active filters) in src/stores/ui-store.ts
- [ ] T016 [P] Create TanStack Query provider wrapper in src/app/providers.tsx
- [ ] T017 [P] Create reusable conflict resolution dialog component (shows diff between server/client versions, re-apply/view-latest/cancel buttons) in src/components/conflict-dialog/conflict-dialog.tsx

**Checkpoint**: Foundation ready — database, utilities, layout, and providers in place

---

## Phase 3: User Story 1 — New Business Registration (Priority: P1) MVP

**Goal**: Users can register companies and businesses; data appears across both screens

**Independent Test**: Create a company and business, verify the company appears in Weekly Meeting

### Implementation for User Story 1

- [ ] T018 [P] [US1] Create Company API routes (GET list with search/filter/sort, POST create, GET by id, PUT update with lock_version, POST archive, POST restore) in src/app/api/companies/route.ts and src/app/api/companies/[id]/route.ts
- [ ] T019 [P] [US1] Create CompanyAlias API logic within company routes (add/remove aliases on create/update) in src/app/api/companies/[id]/route.ts
- [ ] T020 [P] [US1] Create Business API routes (GET list with company_id filter, POST create, GET by id, PUT update with lock_version, POST archive, POST restore) in src/app/api/businesses/route.ts and src/app/api/businesses/[id]/route.ts
- [ ] T021 [P] [US1] Create React Query hooks for companies (useCompanies, useCompany, useCreateCompany, useUpdateCompany) in src/hooks/use-companies.ts
- [ ] T022 [P] [US1] Create React Query hooks for businesses (useBusinesses, useBusiness, useCreateBusiness, useUpdateBusiness) in src/hooks/use-businesses.ts
- [ ] T023 [US1] Create Business Management page with TanStack Table (fixed left columns: visibility, company, name, timing, scale, assignee; horizontally scrollable stage columns) in src/app/business/page.tsx
- [ ] T024 [US1] Create company group rows with expand/collapse and sort order drag handle in src/components/business-table/company-group-row.tsx
- [ ] T025 [US1] Create business row component with inline editable cells and click-to-open detail in src/components/business-table/business-row.tsx
- [ ] T026 [US1] Create new company dialog (canonical name, optional aliases) in src/components/business-table/new-company-dialog.tsx
- [ ] T027 [US1] Create new business dialog (company selector, name, visibility, scale, timing text, timing date picker, assignee) in src/components/business-table/new-business-dialog.tsx
- [ ] T028 [US1] Create business detail slide panel with tabs (Basic Info, Progress, Weekly Actions, Internal Notes, Files/References placeholder, Log/Version) in src/components/business-table/business-detail-panel.tsx
- [ ] T029 [US1] Create key company toggle button (★ favorite marker only, no sort effect) and filtering logic ("중요기업만" checkbox) in src/components/business-table/key-company-toggle.tsx
- [ ] T030 [US1] Add quick action buttons (new company, new business) to Business Management toolbar and Home screen in src/components/ui/quick-actions.tsx

**Checkpoint**: Companies and businesses can be created, viewed in table, and detail panel works

---

## Phase 4: User Story 2 — Progress Stage Update (Priority: P1)

**Goal**: Users can add progress blocks and move them between pipeline stages

**Independent Test**: Add a block to Inbound, move it to Funnel, verify audit log

### Implementation for User Story 2

- [ ] T031 [P] [US2] Create ProgressItem API routes (GET by business grouped by stage, POST create, PUT update, POST move to different stage, DELETE) in src/app/api/businesses/[businessId]/progress-items/route.ts and src/app/api/progress-items/[id]/route.ts
- [ ] T032 [P] [US2] Create React Query hooks for progress items (useProgressItems, useCreateProgressItem, useMoveProgressItem) in src/hooks/use-progress-items.ts
- [ ] T033 [US2] Create progress stage cell component with mini-blocks, "+N more" overflow, and add-block button in src/components/progress-blocks/stage-cell.tsx
- [ ] T034 [US2] Create mini-block component (content preview, author, date, click to expand) in src/components/progress-blocks/mini-block.tsx
- [ ] T035 [US2] Implement dnd-kit drag-and-drop for reordering blocks within a stage and moving between stages (same business row only) in src/components/progress-blocks/dnd-context.tsx
- [ ] T036 [US2] Create mobile stage-move menu (action sheet with stage list instead of drag) in src/components/progress-blocks/mobile-stage-menu.tsx
- [ ] T037 [US2] Create progress block detail popover/modal (full content, edit, version history link) in src/components/progress-blocks/block-detail.tsx
- [ ] T038 [US2] Integrate stage cells into business table rows from Phase 3 in src/app/business/page.tsx
- [ ] T039 [US2] Add progress tab content to business detail panel (full stage view with all blocks) in src/components/business-table/business-detail-panel.tsx

**Checkpoint**: Progress blocks can be created, reordered, moved between stages with audit trail

---

## Phase 5: User Story 3 — Weekly Action Creation (Priority: P1)

**Goal**: Users can create weekly actions linked to companies/businesses

**Independent Test**: Create a weekly action from business detail, verify it appears in Weekly Meeting

### Implementation for User Story 3

- [ ] T040 [P] [US3] Create WeeklyCycle API routes (GET list, GET current, auto-create current week) in src/app/api/weekly-cycles/route.ts
- [ ] T041 [P] [US3] Create WeeklyAction API routes (GET list with cycle/company/status filters, POST create, PUT update with lock_version, POST archive, POST restore) in src/app/api/weekly-actions/route.ts and src/app/api/weekly-actions/[id]/route.ts
- [ ] T042 [P] [US3] Create React Query hooks for weekly cycles and actions (useWeeklyCycles, useCurrentCycle, useWeeklyActions, useCreateWeeklyAction, useUpdateWeeklyAction) in src/hooks/use-weekly-actions.ts
- [ ] T043 [US3] Create Weekly Meeting page with week selector, company-grouped action list, status filters, and add-action button in src/app/weekly/page.tsx
- [ ] T044 [US3] Create weekly action card component (content, assignee, status badge, priority indicator, carryover badge, inline edit) in src/components/weekly-meeting/action-card.tsx
- [ ] T045 [US3] Create new weekly action dialog (company selector, optional business link, content, assignee, priority, status) in src/components/weekly-meeting/new-action-dialog.tsx
- [ ] T046 [US3] Create inline status change dropdown (Scheduled → In-Progress → Completed / On-Hold) in src/components/weekly-meeting/status-dropdown.tsx
- [ ] T047 [US3] Create inline assignee change component for weekly actions in src/components/weekly-meeting/assignee-picker.tsx
- [ ] T048 [US3] Add weekly actions tab to business detail panel (list actions for this business, create new) in src/components/business-table/business-detail-panel.tsx
- [ ] T049 [US3] Add bulk assignee change API endpoint in src/app/api/bulk/assign/route.ts

**Checkpoint**: Weekly actions CRUD complete, linked to companies/businesses, visible in both screens

---

## Phase 6: User Story 4 — Weekly Carryover Processing (Priority: P1)

**Goal**: Users can carry over incomplete actions from previous week with copy semantics

**Independent Test**: Create actions in Week 1, carryover to Week 2, verify originals unchanged

### Implementation for User Story 4

- [ ] T050 [P] [US4] Create carryover API endpoints (GET candidates from source week, POST selective carryover, POST bulk carryover) in src/app/api/weekly-actions/carryover/route.ts
- [ ] T051 [US4] Create carryover dialog component (candidate list with checkboxes, select all, carry over button, skip/complete/hold actions for already-done items) in src/components/weekly-meeting/carryover-dialog.tsx
- [ ] T052 [US4] Create carryover badge component (shows carryover count, click to view origin chain) in src/components/weekly-meeting/carryover-badge.tsx
- [ ] T053 [US4] Add duplicate carryover prevention logic (check UNIQUE constraint on carried_from_id + cycle_id, show warning) in src/app/api/weekly-actions/carryover/route.ts
- [ ] T054 [US4] Add week-end convenience actions to Weekly Meeting (batch complete, batch hold, batch carryover) in src/components/weekly-meeting/week-end-actions.tsx
- [ ] T055 [US4] Integrate carryover entry point into Weekly Meeting page toolbar and weekly cycle navigation in src/app/weekly/page.tsx

**Checkpoint**: Carryover works with copy semantics, badges show, originals preserved — P1 MVP complete

---

## Phase 7: User Story 5 — Meeting Mode Editing (Priority: P2)

**Goal**: Simplified large-font view for weekly meetings with editing capability

**Independent Test**: Activate Meeting Mode, change status and assignee, verify persistence

### Implementation for User Story 5

- [ ] T056 [US5] Create Meeting Mode toggle button and Zustand state integration in src/components/meeting-mode/meeting-mode-toggle.tsx
- [ ] T057 [US5] Create Meeting Mode layout (large font, simplified cards, hidden advanced filters/admin) in src/components/meeting-mode/meeting-mode-view.tsx
- [ ] T058 [US5] Create Meeting Mode action card (large status badge, one-tap status change, assignee picker, quick memo add, priority adjust) in src/components/meeting-mode/meeting-action-card.tsx
- [ ] T059 [US5] Add Meeting Mode carryover shortcut (inline "move to next week" button per action) in src/components/meeting-mode/meeting-mode-view.tsx
- [ ] T060 [US5] Integrate Meeting Mode as an alternate view on the Weekly Meeting page in src/app/weekly/page.tsx

**Checkpoint**: Meeting Mode toggleable, edits persist, simplified UI works on projector/large screen

---

## Phase 8: User Story 6 — Search with Immediate Actions (Priority: P2)

**Goal**: Global search across all entities with quick actions from results

**Independent Test**: Search for a company, change assignee of a business from results

### Implementation for User Story 6

- [ ] T061 [P] [US6] Create search API endpoint (PostgreSQL full-text search across companies, aliases, businesses, progress items, weekly actions, notes; results grouped by type) in src/app/api/search/route.ts
- [ ] T062 [US6] Create global search overlay/command palette component (input, grouped results, keyboard navigation) in src/components/search/search-overlay.tsx
- [ ] T063 [US6] Create search result card components per entity type (company, business, progress item, action, note) with key-company indicator in src/components/search/search-result-cards.tsx
- [ ] T064 [US6] Create quick action buttons on search results (open detail, add action, move stage, change assignee, toggle key company, add memo) in src/components/search/quick-actions.tsx
- [ ] T065 [US6] Create mobile action sheet for search result quick actions (long-press trigger) in src/components/search/mobile-action-sheet.tsx
- [ ] T066 [US6] Integrate global search into layout header (Ctrl+K shortcut, search icon) in src/app/layout.tsx

**Checkpoint**: Search works across all entities, quick actions function inline

---

## Phase 9: User Story 9 — Recent Activity Overview (Priority: P2)

**Goal**: Home screen with key companies, incomplete actions, activity feed

**Independent Test**: Perform actions, verify Home reflects all recent activity

### Implementation for User Story 9

- [ ] T067 [P] [US9] Create audit log API routes (GET list with entity_type/entity_id/date filters, pagination) in src/app/api/audit-logs/route.ts
- [ ] T068 [P] [US9] Create recent views API routes (GET list, POST record view) in src/app/api/recent-views/route.ts
- [ ] T069 [P] [US9] Create React Query hooks for audit logs and recent views in src/hooks/use-activity.ts
- [ ] T070 [US9] Create Home page with sections: key companies, this week's incomplete actions, carried-over actions, activity feed, quick actions in src/app/page.tsx
- [ ] T071 [US9] Create unified activity feed component (combined change log + recent views, filter: All/Changes/My Views) in src/components/home/activity-feed.tsx
- [ ] T072 [US9] Create key companies summary card (list with quick links) in src/components/home/key-companies-card.tsx
- [ ] T073 [US9] Create incomplete actions summary card (this week's unfinished, carried-over count) in src/components/home/incomplete-actions-card.tsx
- [ ] T074 [US9] Add automatic recent-view tracking when opening business detail or weekly action in src/components/business-table/business-detail-panel.tsx

**Checkpoint**: Home screen shows operational overview, activity feed works with filters

---

## Phase 10: User Story 10 — Excel Download (Priority: P2)

**Goal**: Weekly and monthly Excel downloads with configurable options

**Independent Test**: Download weekly Excel with filters, verify content and timestamp

### Implementation for User Story 10

- [ ] T075 [P] [US10] Create ExcelJS utility helpers (worksheet creation, styling, header formatting, timestamp) in src/lib/excel.ts
- [ ] T076 [P] [US10] Create export API routes: POST current-view, POST weekly (with cycle_id, include_completed, include_carryover, assigned_to filters), POST monthly (with year, month, include_stage_status, include_change_history, include_incomplete_actions) in src/app/api/export/route.ts
- [ ] T077 [US10] Create Excel download dialog (type selector: current view/weekly/monthly, option checkboxes, assignee filter, download button) in src/components/export/excel-download-dialog.tsx
- [ ] T078 [US10] Add Excel download button to Business Management and Weekly Meeting toolbars in src/app/business/page.tsx and src/app/weekly/page.tsx
- [ ] T079 [US10] Add audit log entry for every download (log download type, filters used, filename) in src/app/api/export/route.ts

**Checkpoint**: Excel downloads work for all three types with proper formatting and audit trail

---

## Phase 11: User Story 7 — Company Merge (Priority: P3)

**Goal**: Admin can merge duplicate companies, re-link all data, retain aliases

**Independent Test**: Create two companies with businesses, merge, verify consolidated

### Implementation for User Story 7

- [ ] T080 [P] [US7] Create company merge API endpoint (POST merge with canonical_id, merge_ids; re-links businesses, actions, notes, logs; retains aliases) in src/app/api/companies/merge/route.ts
- [ ] T081 [US7] Create duplicate company detection query (similar canonical names/aliases) in src/app/api/companies/merge/route.ts
- [ ] T082 [US7] Create admin company merge page (search for duplicates, select companies, designate canonical, preview affected data, confirm merge) in src/app/admin/merge/page.tsx
- [ ] T083 [US7] Create merge confirmation dialog (lists affected businesses, actions, notes count) in src/components/admin/merge-confirmation-dialog.tsx
- [ ] T084 [US7] Add admin role check middleware (verify role=admin for admin routes) in src/lib/auth.ts

**Checkpoint**: Admin can merge companies, all data re-linked, aliases searchable

---

## Phase 12: User Story 8 — Version Comparison (Priority: P3)

**Goal**: Users can view version history, compare diffs, and restore previous versions

**Independent Test**: Edit a business 3 times, compare v1 with current, restore v1

### Implementation for User Story 8

- [ ] T085 [P] [US8] Create version API routes (GET list by entity, GET single version, GET diff between two versions, POST restore from version) in src/app/api/versions/route.ts
- [ ] T086 [P] [US8] Create React Query hooks for versions (useVersions, useVersionDiff, useRestoreVersion) in src/hooks/use-versions.ts
- [ ] T087 [US8] Create version history panel component (version list with timestamps/authors, click to select for comparison) in src/components/version-diff/version-history-panel.tsx
- [ ] T088 [US8] Create JSON diff view component (side-by-side or inline diff of two JSONB snapshots, highlight added/removed/changed fields) in src/components/version-diff/diff-view.tsx
- [ ] T089 [US8] Create restore confirmation dialog (preview restored state, confirm creates new version) in src/components/version-diff/restore-dialog.tsx
- [ ] T090 [US8] Integrate version history access into business detail panel Log/Version tab and weekly action detail in src/components/business-table/business-detail-panel.tsx

**Checkpoint**: Version history, diff view, and restore-as-new all functional

---

## Phase 13: User Story 11 — Future Authentication Setup (Priority: P3)

**Goal**: Data model and UI placeholders ready for future Google OAuth + admin approval

**Independent Test**: Verify User entity exists with status/role fields, all FKs nullable

### Implementation for User Story 11

- [ ] T091 [US11] Create admin page layout with navigation (Users, Company Merge, Audit Logs, Settings) in src/app/admin/layout.tsx
- [ ] T092 [P] [US11] Create admin user management page (list users, approve/reject pending, change roles) in src/app/admin/users/page.tsx
- [ ] T093 [P] [US11] Create admin user API routes (GET list, PUT update role/status) in src/app/api/admin/users/route.ts
- [ ] T094 [P] [US11] Create admin settings page (Google login policy placeholder, allowed domains, default home screen, Excel filename rules) in src/app/admin/settings/page.tsx
- [ ] T095 [P] [US11] Create admin settings API routes (GET settings, PUT settings) in src/app/api/admin/settings/route.ts
- [ ] T096 [US11] Create admin audit log viewer page (full log list with entity/action/date/actor filters, pagination) in src/app/admin/logs/page.tsx

**Checkpoint**: Admin screens ready, auth integration can be added via NextAuth.js without refactor

---

## Phase 14: Internal Notes (Cross-cutting)

**Purpose**: Internal notes used by US1, US3, US5, US6, US9 — built as shared module

- [ ] T097 [P] Create InternalNote API routes (GET by owner_type+owner_id with tag filter, POST create, PUT update with lock_version) in src/app/api/notes/route.ts
- [ ] T098 Create notes timeline component (chronological list with tag badges, inline preview, add-note form) in src/components/notes/notes-timeline.tsx
- [ ] T099 Integrate notes into business detail panel (Internal Notes tab) in src/components/business-table/business-detail-panel.tsx
- [ ] T100 Integrate notes into weekly action detail (expandable notes section) in src/components/weekly-meeting/action-card.tsx
- [ ] T101 Integrate notes into company detail (notes section on company group expand) in src/components/business-table/company-group-row.tsx

**Checkpoint**: Notes attachable to Company, Business, and WeeklyAction with timeline view

---

## Phase 15: Polish & Cross-Cutting Concerns

**Purpose**: Dark mode, responsive, archive/restore, performance

- [ ] T102 [P] Implement dark mode consistent styling across all screens (verify status badges, priority indicators meet WCAG AA contrast) in src/app/globals.css
- [ ] T103 [P] Implement mobile responsive layout: Business Management (card/accordion), Weekly Meeting (company card + action list), detail (full-screen overlay), floating action button in src/app/business/page.tsx and src/app/weekly/page.tsx
- [ ] T104 [P] Implement tablet responsive layout: condensed table columns, overlay detail panel, drawer filters in src/app/business/page.tsx and src/app/weekly/page.tsx
- [ ] T105 [P] Create archive/restore UI components (archive button with confirmation, "Show Archived" toggle, restore button) in src/components/ui/archive-restore.tsx
- [x] T106 [P] Add sort order drag-and-drop for company groups in Business Management (DndContext + SortableContext + drag handle on company header, PUT /api/companies/reorder batch endpoint) in src/app/business/page.tsx and src/app/api/companies/reorder/route.ts
- [ ] T107 Add quick action floating button for mobile (context-sensitive: new company, new business, new action) in src/components/ui/mobile-fab.tsx
- [ ] T108 Performance optimization: add PostgreSQL indexes per data-model.md, add TanStack Table virtual scrolling for large datasets in src/app/business/page.tsx
- [ ] T109 Run quickstart.md validation (all 7 verification steps pass end-to-end)

---

## Phase 16: UX Improvements (2026-03-19)

**Purpose**: Search refinement, card interaction, modal usability, sticky layout, stage filtering

### Completed Tasks

- [x] T110 [US2] Default to today's date (YYYY-MM-DD) when creating a progress item without specifying a date in src/app/api/businesses/[id]/progress-items/route.ts
- [x] T111 [US1] Add company drag-and-drop reordering via DndContext/SortableContext with drag handle on company header row; separate ★ (favorite) from sort order in src/app/business/page.tsx, src/components/business-table/company-group-row.tsx
- [x] T112 [US1] Create PUT /api/companies/reorder endpoint for batch sortOrder updates (transaction) in src/app/api/companies/reorder/route.ts
- [x] T113 [US1] Add useReorderCompanies mutation hook in src/hooks/use-companies.ts
- [x] T114 [US1] Make left columns (company header, business info, stage header "사업 정보") sticky left-0 during horizontal scroll with proper z-index and background in src/app/business/page.tsx, src/components/business-table/company-group-row.tsx, src/components/business-table/business-row.tsx
- [x] T115 [US2] Enlarge block detail modal to 700×520px default with drag-to-resize from bottom-right corner (min 540×400px); textarea fills available space in src/components/progress-blocks/block-detail.tsx
- [x] T116 [US6] Separate search into two roles: global search (⌘K) for item navigation with scroll+highlight, local search for card filtering with dimming in src/components/search/search-overlay.tsx, src/app/business/page.tsx
- [x] T117 [US6] Add searchHighlightId and searchFilterText to Zustand UI store in src/stores/ui-store.ts
- [x] T118 [US6] Implement card highlight: blue border (current match), red border (visited), fade on mouse hover; dimming for non-matching cards (opacity 25%) in src/components/progress-blocks/mini-block.tsx
- [x] T119 [US6] Add local filter match navigation: Enter cycles through matches with (n/N) counter, respects visible stages and key-company filter in src/app/business/page.tsx
- [x] T120 [US6] Add stage column toggle: clickable headers to show/hide stages (300px active → 40px collapsed with vertical text and pill card indicators); search/filter respects visible stages in src/app/business/page.tsx, src/components/progress-blocks/stage-row-dnd.tsx
- [x] T121 [US1] Differentiate empty state message for "중요기업만" filter ("중요 기업으로 등록된 기업이 없습니다") vs general ("등록된 기업이 없습니다") in src/app/business/page.tsx

---

## Phase 17: Weekly Table Redesign + FunnelNo. (2026-03-25)

**Purpose**: Weekly meeting page redesign as company × week table with monthly navigation, inline editing, and FunnelNo. per stage

### Completed Tasks

- [x] T122 [US3] Weekly meeting table redesign — company × week layout, monthly navigation with month picker in src/app/weekly/page.tsx
- [x] T123 [US3] Inline Tiptap rich text editor for weekly cells in src/components/weekly-meeting/tiptap-cell-editor.tsx
- [x] T124 [US3] Week column toggle — collapse/expand individual week columns in src/app/weekly/page.tsx
- [x] T125 [US3] Auto-create weekly cycles via POST /api/weekly-cycles (upsert for past/future weeks) in src/app/api/weekly-cycles/route.ts
- [x] T126 [US3] useWeeklyActionsMultiCycle hook for monthly data fetch (all cycles in visible month) in src/hooks/use-weekly-actions.ts
- [x] T127 [US2] Block detail modal weekly actions panel — shows prev/this/next week actions for the same company in the right panel below calendar in src/components/progress-blocks/block-detail.tsx
- [x] T128 [US1] FunnelNo. per stage on business — JSONB field, double-click inline edit, auto-save (skips lockVersion for funnelNumbers-only updates) in src/components/business-table/funnel-number.tsx, src/app/api/businesses/[id]/route.ts
- [x] T129 Excel data import script for weekly meeting data in prisma/import-weekly.ts
- [x] T130 .gitignore update — added *.xlsx and *.xls patterns to prevent accidental data file commits

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational
- **US2 (Phase 4)**: Depends on US1 (needs business table)
- **US3 (Phase 5)**: Depends on US1 (needs companies/businesses)
- **US4 (Phase 6)**: Depends on US3 (needs weekly actions)
- **US5 (Phase 7)**: Depends on US3 (needs weekly meeting screen)
- **US6 (Phase 8)**: Depends on US1 + US3 (needs data to search)
- **US9 (Phase 9)**: Depends on Foundational (needs audit log API)
- **US10 (Phase 10)**: Depends on US1 + US3 (needs data to export)
- **US7 (Phase 11)**: Depends on US1 (needs companies)
- **US8 (Phase 12)**: Depends on Foundational (needs version utilities)
- **US11 (Phase 13)**: Depends on Foundational
- **Internal Notes (Phase 14)**: Depends on US1 + US3
- **Polish (Phase 15)**: Depends on all desired user stories

### User Story Dependencies

```
Phase 1 (Setup) → Phase 2 (Foundational)
                       │
                       ├── US1 (P1: Registration) ──┬── US2 (P1: Progress Stages)
                       │                             ├── US3 (P1: Weekly Actions) ── US4 (P1: Carryover)
                       │                             │                              └── US5 (P2: Meeting Mode)
                       │                             ├── US6 (P2: Search) ← also needs US3
                       │                             ├── US10 (P2: Excel) ← also needs US3
                       │                             ├── US7 (P3: Company Merge)
                       │                             └── Internal Notes
                       │
                       ├── US9 (P2: Home/Activity) [can start early — only needs audit log API]
                       ├── US8 (P3: Versions) [can start early — only needs version utilities]
                       └── US11 (P3: Auth Setup) [can start early — admin pages]
```

### Parallel Opportunities

After Phase 2 (Foundational) completes:
- **US9, US8, US11** can start immediately (independent of US1)
- **US1** is the critical path — US2, US3 depend on it
- After US1: **US2, US3, US6, US7, US10, Internal Notes** can proceed in parallel
- After US3: **US4, US5** can proceed in parallel

### Within Each User Story

- API routes and React Query hooks marked [P] can run in parallel
- UI components depend on hooks being ready
- Integration tasks depend on both API and UI

---

## Implementation Strategy

### MVP First (User Stories 1–4 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: US1 — New Business Registration
4. Complete Phase 4: US2 — Progress Stage Update
5. Complete Phase 5: US3 — Weekly Action Creation
6. Complete Phase 6: US4 — Weekly Carryover
7. **STOP and VALIDATE**: All P1 stories independently testable
8. Deploy/demo MVP

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 → Business registration works (first demo)
3. US2 → Progress tracking works
4. US3 + US4 → Weekly meeting workflow complete (MVP!)
5. US5 + US6 + US9 + US10 → P2 features (meeting mode, search, home, export)
6. US7 + US8 + US11 → P3 features (merge, versions, auth prep)
7. Internal Notes + Polish → Final release

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Total tasks: 118
