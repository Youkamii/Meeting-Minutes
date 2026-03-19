# Feature Specification: Business Management & Weekly Meeting Integrated Operations Service

**Feature Branch**: `feat/001-biz-meeting-ops`
**Created**: 2026-03-18
**Status**: Draft
**Input**: User description: "Business management and weekly meeting integrated operations web service replacing Excel-based workflows"

## Product Overview

This service replaces Excel-based business management and weekly meeting
workflows with a web application. It retains the structural familiarity of
Excel while adding direct input, search, stage transitions, weekly cycle
management, audit logs, version tracking, mobile responsiveness, dark mode,
and Excel download.

The service is an internal operations tool connecting two domains:

- **Business Management**: Long-term tracking of companies and their business
  opportunities across pipeline stages.
- **Weekly Meeting**: Short-term weekly action items, issue tracking, and
  carryover management.

### Core Product Principles

1. **Data entry is authoritative within the service** — Excel is only a
   download/export medium, never a source of truth.
2. **Separate screens for Business Management and Weekly Meeting** — but the
   Company master is shared; companies registered in Business Management
   appear automatically in Weekly Meeting.
3. **Hybrid UI**: table-first layout with block/card elements for progress
   stages and action items.
4. **Operational stability**: all significant changes are audit-logged;
   important entities support version history. Concurrent edits are resolved
   via conflict detection, not real-time co-editing.
5. **Extensibility**: start simple; the architecture MUST support adding
   Google OAuth + approval-based access control later without data model
   redesign.

### Confirmed Decisions

- Data entry happens inside the service (not via Excel upload).
- Excel is download-only.
- Business Management and Weekly Meeting are separate screens.
- Company is a shared master entity.
- Weekly Meeting is organized by weekly cycle.
- Meeting Mode is a separate view but MUST allow editing.
- No email or push notifications.
- Roles: Admin and User only (no read-only role).
- No real-time co-editing; conflict detection only.
- Future authentication targets Google OAuth + admin approval flow.

### Exclusions

- Excel upload
- Email notifications
- Push notifications
- Real-time co-editing
- Local password login
- Read-only role
- External calendar/email integration

## User Roles

### Admin

- Full access to all features
- Company merge and canonical name assignment
- User approval and role management
- System settings management
- Full audit log and version history access

### User

- Business Management and Weekly Meeting standard features
- Create/edit/sort/search/Excel download
- Weekly action processing, key company designation, assignee changes

Only two roles exist: Admin and User. No read-only role.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - New Business Registration (Priority: P1)

A user registers a new company and business opportunity from the Home screen
or the Business Management screen. The company becomes immediately available
in both Business Management and Weekly Meeting.

**Why this priority**: This is the foundational data entry flow — nothing else
works without companies and businesses in the system.

**Independent Test**: Create a company and business, then verify the company
appears in Weekly Meeting and can have actions attached.

**Acceptance Scenarios**:

1. **Given** no companies exist, **When** a user creates a company with
   a canonical name and registers a business under it, **Then** the company
   appears in both the Business Management table and the Weekly Meeting
   company list.
2. **Given** a company already exists, **When** a user adds a new business
   under it, **Then** the business row appears grouped under that company
   with default empty progress stages.
3. **Given** a user fills required fields (company name, business name,
   assignee), **When** they submit, **Then** an audit log entry is created
   for both the company and business creation.

---

### User Story 2 - Progress Stage Update (Priority: P1)

A user adds progress blocks to a business and moves them between pipeline
stages (Inbound, Funnel, Pipeline, Proposal, Contract, Build, Maintenance).

**Why this priority**: Stage tracking is the primary value proposition of the
Business Management screen.

**Independent Test**: Add a progress block to a business at the Inbound stage,
then move it to Funnel and verify it appears in the correct column.

**Acceptance Scenarios**:

1. **Given** a business exists, **When** a user adds a progress block to
   the Inbound stage, **Then** a mini-block appears in the Inbound cell
   with content, author, and date.
2. **Given** a progress block exists in Inbound, **When** a user drags or
   moves it to Funnel, **Then** it appears in Funnel and disappears from
   Inbound, and an audit log records the move.
3. **Given** a stage cell has more than the display limit of blocks, **When**
   viewing the table, **Then** a "+N more" indicator appears and clicking it
   reveals all blocks.

---

### User Story 3 - Weekly Action Creation (Priority: P1)

A user creates a weekly action item from the Business Detail panel or the
Weekly Meeting screen, linking it to a company and optionally to a specific
business.

**Why this priority**: Weekly actions are the operational heartbeat — users
create them every week.

**Independent Test**: Create a weekly action linked to a company, verify it
appears in the Weekly Meeting screen for the current week.

**Acceptance Scenarios**:

1. **Given** a business detail panel is open, **When** a user creates a
   weekly action, **Then** the action is pre-linked to that business and
   its company, assigned to the current weekly cycle.
2. **Given** the Weekly Meeting screen is open, **When** a user creates an
   action for a company without linking a specific business, **Then** the
   action appears as a company-level action for the current week.
3. **Given** a weekly action is created, **When** viewing the Home screen,
   **Then** it appears in the "This Week's Incomplete Actions" section.

---

### User Story 4 - Weekly Carryover Processing (Priority: P1)

A user carries over incomplete actions from the previous week to the current
week, with selective or bulk carryover options.

**Why this priority**: Carryover is essential for weekly continuity and
prevents lost action items.

**Independent Test**: Create actions in Week 1, leave some incomplete, advance
to Week 2, and verify the carryover flow works.

**Acceptance Scenarios**:

1. **Given** last week has incomplete actions (status: scheduled or
   in-progress), **When** a user opens the carryover dialog, **Then** a list
   of carryover candidates appears (completed items excluded by default).
2. **Given** carryover candidates are shown, **When** a user selects specific
   items and confirms, **Then** new copies are created in the current week
   with a carryover badge, carryover count, and a link back to the
   original. The original remains in the previous week unchanged.
3. **Given** carryover candidates are shown, **When** a user clicks "Carry
   Over All", **Then** all candidate items are carried over in bulk.
4. **Given** an action has been carried over multiple times, **When** viewing
   it, **Then** the cumulative carryover count is displayed.

---

### User Story 5 - Meeting Mode Editing (Priority: P2)

A user activates Meeting Mode during a weekly meeting to view actions in a
simplified, large-font layout while still being able to edit statuses,
assignees, and memos.

**Why this priority**: Meeting Mode is a high-value UX differentiator for
the weekly meeting use case.

**Independent Test**: Activate Meeting Mode, change an action's status and
assignee, verify changes persist after exiting Meeting Mode.

**Acceptance Scenarios**:

1. **Given** the Weekly Meeting screen is open, **When** a user activates
   Meeting Mode, **Then** the UI switches to a large-font, simplified view
   with advanced filters and admin features hidden.
2. **Given** Meeting Mode is active, **When** a user changes an action's
   status from "Scheduled" to "Completed", **Then** the change persists and
   is audit-logged.
3. **Given** Meeting Mode is active, **When** a user adds a memo to an
   action, **Then** the memo appears in the action's memo timeline.

---

### User Story 6 - Search with Immediate Actions (Priority: P2)

A user searches globally and performs quick actions (stage move, assignee
change, key company toggle, memo add) directly from search results.

**Why this priority**: Search-and-act flow reduces navigation overhead
significantly for power users.

**Independent Test**: Search for a company name, then change the assignee of
one of its businesses directly from the search result.

**Acceptance Scenarios**:

1. **Given** companies, businesses, actions, and memos exist, **When** a user
   types a search query, **Then** results are grouped by type (Company,
   Business, Progress Item, Weekly Action, Memo).
2. **Given** search results are displayed, **When** a user clicks a quick
   action button (e.g., "Change Assignee") on a business result, **Then**
   the assignee change dialog opens inline.
3. **Given** the user is on mobile, **When** they long-press a search result,
   **Then** an action sheet appears with the same quick actions.

---

### User Story 7 - Company Merge (Priority: P3)

An admin merges duplicate companies, designates a canonical name, retains
aliases, and re-links all associated businesses, weekly actions, and logs.

**Why this priority**: Duplicate management is an admin-only maintenance task,
not part of daily operations.

**Independent Test**: Create two companies with overlapping businesses, merge
them, and verify all data is consolidated under the canonical name.

**Acceptance Scenarios**:

1. **Given** two companies with similar names exist, **When** an admin
   selects them for merge and designates one as canonical, **Then** all
   businesses, actions, and logs are re-linked to the canonical company.
2. **Given** a merge is complete, **When** searching by the old company name
   (now an alias), **Then** the canonical company appears in results.
3. **Given** a non-admin user is logged in, **When** they attempt to merge
   companies, **Then** the merge option is not available.

---

### User Story 8 - Version Comparison (Priority: P3)

A user views version history for a business or weekly action and compares
previous versions with the current state.

**Why this priority**: Version tracking is a safety net, not a daily
workflow.

**Independent Test**: Edit a business multiple times, then view version
history and compare version 1 with the current version.

**Acceptance Scenarios**:

1. **Given** a business has been edited 3 times, **When** a user opens its
   version history, **Then** 3 versions are listed with timestamps and
   authors.
2. **Given** version history is open, **When** a user selects a previous
   version, **Then** a diff view shows what changed between that version
   and the current state.
3. **Given** a diff is displayed, **When** a user clicks "Restore", **Then**
   a new version is created with the restored values (the old version is
   not overwritten).

---

### User Story 9 - Recent Activity Overview (Priority: P2)

A user views the Home screen to see recent changes, recently viewed items,
key companies, and incomplete/carried-over actions in a unified activity feed.

**Why this priority**: The Home screen is the operational starting point for
every session.

**Independent Test**: Perform several actions across Business Management and
Weekly Meeting, then verify the Home screen reflects all recent activity.

**Acceptance Scenarios**:

1. **Given** multiple changes have been made, **When** a user opens the Home
   screen, **Then** the activity feed shows recent change logs and recently
   viewed items in a combined timeline.
2. **Given** the activity feed is visible, **When** a user applies the
   "Changes Only" filter, **Then** only audit log entries are shown.
3. **Given** key companies are designated, **When** viewing Home, **Then**
   key companies appear in a dedicated section at the top.

---

### User Story 10 - Excel Download (Priority: P2)

A user downloads weekly or monthly Excel reports with configurable options
(include completed items, carryover items, assignee filter, etc.).

**Why this priority**: Excel download is the primary output/sharing mechanism
for stakeholders who do not use the service directly.

**Independent Test**: Configure a weekly download with specific filters and
verify the downloaded file contains the correct data.

**Acceptance Scenarios**:

1. **Given** the Weekly Meeting screen is open, **When** a user clicks "Excel
   Download" and selects weekly options (week, include completed, assignee
   filter), **Then** an .xlsx file is generated with matching data and
   auto-generated filename including timestamp.
2. **Given** the Business Management screen is open, **When** a user clicks
   "Excel Download" with monthly options, **Then** the file includes stage
   status summaries and optionally change history.
3. **Given** any download is initiated, **When** it completes, **Then** a
   download audit log entry is created.

---

### User Story 11 - Future Authentication Setup (Priority: P3)

An admin manages user approval after Google OAuth login is enabled in a
future release.

**Why this priority**: Authentication is deferred; only the extensibility
structure matters now.

**Independent Test**: Verify the data model includes user entity with status
and role fields; verify all entities have created_by/updated_by fields.

**Acceptance Scenarios**:

1. **Given** Google OAuth is enabled (future), **When** a new user logs in,
   **Then** their status is "pending" until an admin approves them.
2. **Given** a user is approved, **When** they log in, **Then** they gain
   access to all User-role features.
3. **Given** the current version has no auth, **When** examining the data
   model, **Then** user references (created_by, updated_by, assigned_to)
   exist as nullable fields ready for future binding.

---

### Edge Cases

- What happens when a user tries to carry over an action that was already
  carried over to the target week? → Prevent duplicate carryover; show
  a warning.
- How does the system handle a company merge when one company has active
  weekly actions in the current week? → Re-link actions to the canonical
  company; show a confirmation dialog listing affected actions.
- What happens when two users edit the same business simultaneously? →
  Conflict detection at save time; the second saver sees a diff and
  chooses to re-apply, view latest, or cancel.
- What happens when a progress block is the only item in a stage and
  gets moved? → The stage cell becomes empty; this is normal.
- How does the system handle a weekly cycle boundary (e.g., year-end)?
  → Weekly cycles are identified by ISO week number and year (e.g.,
  2026-W12); year transitions are handled naturally.
- What happens when an admin archives a company that has active weekly
  actions? → Warn the admin that N active actions exist; require
  explicit confirmation.

## Domain Model *(mandatory)*

### Key Entities

- **Company**: Top-level management unit. Has canonical name, aliases,
  key-company flag, status (active/archived). Shared across Business
  Management and Weekly Meeting.
- **Business**: A specific opportunity/project under a company. Has assignee,
  visibility (public/private), scale (free text), timing (free text +
  optional start/end dates via date picker — both coexist), current stage,
  progress history.
- **Progress Item**: A block-type record within a specific stage (Inbound →
  Funnel → Pipeline → Proposal → Contract → Build → Maintenance). Has
  content, author, created date, stage, sort order.
- **Weekly Cycle**: A time-based unit (e.g., 2026 March Week 3). The
  organizing dimension for Weekly Meeting.
- **Weekly Action**: An action/issue item managed per weekly cycle. Linked
  to a company (required) and optionally to a business. Has content,
  assignee, status (Scheduled/In-Progress/Completed/On-Hold), priority,
  carryover flag, carryover count, sort order, and optional
  carried_from_id (reference to the original action in a previous week).
  Carryover creates a new copy; the original remains in its source week.
- **Internal Note**: A short operational memo attachable to Company, Business,
  or Weekly Action. Has title/summary, body, author, timestamp, optional
  tag (Situation/Decision/Risk/Follow-up). Accumulates as a timeline, not
  threaded comments.
- **Audit Log**: Records who changed what, when, and how. Immutable.
  Retained indefinitely (no automatic purge).
- **Version**: Point-in-time snapshot of Business, Progress Item, Weekly
  Action, and Internal Note (on edit). Supports diff and restore-as-new.
  Retained indefinitely (no automatic purge).
- **User** (future-ready): Has email, name, role (Admin/User), status
  (pending/approved/rejected). All entities reference User via created_by,
  updated_by, assigned_to as nullable foreign keys.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-01**: System MUST provide consistent navigation (top/side menu, global
  search, dark mode toggle, user area, context-sensitive quick actions)
  across desktop, tablet, and mobile.
- **FR-02**: Home screen MUST display key companies, this week's incomplete
  actions, carried-over actions, recent change log, recently viewed items,
  and quick action entry points.
- **FR-03**: Business Management screen MUST present an Excel-like table with
  fixed left columns (visibility, company, business name, timing, scale,
  assignee) and horizontally scrollable progress stage columns (Inbound
  through Maintenance). The left columns (company group header, business
  info) MUST remain sticky during horizontal scroll. Stage column headers
  MUST be clickable to toggle visibility — collapsed stages show as narrow
  (40px) indicators with mini pill markers representing card count.
  Multiple stages can be visible simultaneously; minimum one stage must
  remain visible.
- **FR-04**: Progress stage cells MUST display thin mini-blocks (not large
  cards) with content, date, and author; support reordering within a stage;
  support moving to another stage within the same business row; show "+N
  more" overflow indicator. When creating a new progress item without
  specifying a date, the system MUST default to today's date (YYYY-MM-DD).
  The block detail modal MUST open at 700×520px by default and support
  drag-to-resize from the bottom-right corner (minimum 540×400px). The
  textarea fills available vertical space dynamically.
- **FR-05**: Business detail MUST open as a right slide panel or full-screen
  view with tabs: Basic Info, Progress, Weekly Actions, Internal Notes,
  Files/References, Log/Version.
- **FR-06**: Weekly Meeting screen MUST be a separate screen organized by
  weekly cycle, showing company-grouped actions. Actions MUST optionally
  link to a specific business. Status values: Scheduled, In-Progress,
  Completed, On-Hold.
- **FR-07**: System MUST support carryover of incomplete actions from the
  previous week: auto-detect candidates, show candidate list, allow
  selective and bulk carryover, display carryover badge and cumulative
  count.
- **FR-08**: System MUST support key company designation (★ toggle on/off)
  as a favorite marker — consistently across Business Management, Weekly
  Meeting, Home, and search results. Company display order is controlled
  via drag-and-drop reordering (not tied to key-company status). The
  reordered sort order persists via `sortOrder` field. A "중요기업만"
  checkbox filters the list to show only key companies; when active and no
  key companies exist, the empty state indicates how to designate key
  companies.
- **FR-09**: System MUST provide internal notes (timeline-style, not
  threaded) attachable to Company, Business, and Weekly Action with
  optional tags (Situation, Decision, Risk, Follow-up). Notes MUST be
  searchable and partially visible inline in list/detail views.
- **FR-10**: The system provides two complementary search mechanisms:
  (a) **Global search (⌘K)** — a command palette overlay for navigating to
  specific items. Searching across company names/aliases, business names,
  progress block content, memos, weekly actions. Results grouped by type.
  Clicking a progress item scrolls to the card and highlights it with a
  blue border (current) that transitions to red (visited) when the next
  match is selected; red border fades on mouse hover.
  (b) **Local filter** — the Business Management toolbar search input dims
  non-matching progress cards (opacity 25%) without hiding companies or
  businesses. Pressing Enter cycles through matching cards sequentially
  with a (n/N) counter. The filter respects the current key-company filter
  and visible stage selection. Clearing the input (✕) removes all dimming.
- **FR-11**: Global search results MUST support navigation to the matched
  item (scroll + highlight for progress items, page navigation for other
  types). Quick actions from search results are a future enhancement.
  Mobile MUST use action sheets.
- **FR-12**: System MUST record audit logs for: entity CRUD, progress block
  moves, weekly action status changes and carryovers, assignee changes,
  key company toggles, company merges, canonical name changes, Excel
  downloads, and user approval/role changes.
- **FR-13**: System MUST provide version history for Business, Progress Item,
  Weekly Action, and Internal Note (on edit). MUST support version
  comparison (diff), and restore-as-new-version (never overwrite).
- **FR-14**: Home screen MUST show a unified activity feed combining recent
  changes and recently viewed items with filters (All / Changes / My
  Views). When authenticated, store per-user; otherwise, use browser
  local storage.
- **FR-15**: Admin MUST be able to merge duplicate companies: query
  suspected duplicates, merge two or more, designate canonical name,
  retain aliases, re-link all associated data. Lists/detail/Excel use
  canonical name; search matches both canonical and alias.
- **FR-16**: System MUST support assignee changes for business owner and
  weekly action assignee via single change, multi-select bulk change,
  search result quick change, weekly meeting inline change, and business
  detail change. All assignee changes MUST be audit-logged.
- **FR-17**: System MUST provide quick actions: global (new company, new
  business, new weekly action), Business Management context, Weekly
  Meeting context, and search result context — all as enumerated in the
  requirements document.
- **FR-18**: System MUST provide Meeting Mode with large font, simplified
  UI, hidden advanced filters/admin features, while allowing: status
  change, assignee change, action add, carryover, memo add, priority
  adjust.
- **FR-19**: System MUST provide Excel download only (no upload). Download
  types: current view, weekly, monthly. Weekly options: target week,
  include completed, include carryover, assignee filter. Monthly options:
  target month, include stage status, include change history, include
  incomplete actions. All downloads MUST auto-generate filenames with
  timestamps and create audit log entries.
- **FR-20**: System MUST support light and dark mode with global toggle,
  persist user preference, apply across all screens, and ensure status
  badges and priority indicators remain clearly distinguishable in dark
  mode.
- **FR-21**: System MUST be responsive: desktop (table-centric Business
  Management, list/board Weekly Meeting, right panel detail), tablet
  (condensed columns, overlay detail, drawer filters), mobile (card/
  accordion Business Management, collapsible Progress Status, floating
  action button, touch-friendly stage change menus instead of drag).
- **FR-22**: System MUST implement conflict detection on save: compare
  versions, never silently overwrite, show diff between latest version
  and user's changes, allow re-apply/view-latest/cancel. Applies to
  business info, progress blocks, weekly actions, memo edits, sort state.
  Auto-merge is not required.
- **FR-23**: System MUST use archive/restore instead of hard delete for
  Company, Business, and Weekly Action. Archived items are hidden from
  default lists but restorable. Logs and versions are preserved.
- **FR-24**: Admin MUST have access to: user approval/rejection, role
  change, company merge, canonical name assignment, full audit log, and
  system settings (Google login policy, allowed domains/users, default
  home screen, Excel filename rules).
- **FR-25**: Initial version MAY operate without authentication. The data
  model MUST include a User entity with status (pending/approved/rejected)
  and role fields. All entities MUST have nullable created_by, updated_by,
  assigned_to references. Route protection MUST be extensible. Admin
  approval UI MAY be in-app or via external CMS, but the authoritative
  access state MUST reside in the app's data store.

## Information Architecture

The service has the following menu structure:

1. **Home** — operational starting screen (not a statistics dashboard)
2. **Business Management** — table-centric long-term pipeline tracking
3. **Weekly Meeting** — weekly-cycle-centric action/issue management
4. **Admin** (visible to admins only) — user management, company merge,
   logs, system settings

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can register a new company and business in under
  2 minutes from any screen.
- **SC-002**: Users can move a progress block between stages in under
  3 clicks (desktop) or 3 taps (mobile).
- **SC-003**: Weekly carryover of up to 50 action items completes in
  under 10 seconds.
- **SC-004**: Global search returns results within 1 second for databases
  with up to 10,000 companies and 50,000 businesses.
- **SC-005**: Meeting Mode can be activated and the first action edited
  within 5 seconds of toggling.
- **SC-006**: Excel download (weekly, up to 500 actions) generates in
  under 5 seconds.
- **SC-007**: Conflict detection correctly identifies and surfaces
  100% of concurrent edit conflicts (no silent overwrites).
- **SC-008**: All audit-loggable events (as defined in FR-12) produce
  log entries with zero data loss.
- **SC-009**: Version restore creates a new version 100% of the time
  (never overwrites existing versions).
- **SC-010**: Mobile users can complete core workflows (view business,
  edit weekly action, search, use quick actions) without horizontal
  scrolling on screens 375px and wider.
- **SC-011**: Dark mode maintains WCAG AA contrast ratios for all status
  badges and priority indicators.
- **SC-012**: Company merge correctly re-links 100% of associated
  businesses, actions, and logs to the canonical company.

## Clarifications

### Session 2026-03-18

- Q: Carryover mechanics — copy vs move? → A: Copy. The original action
  remains in its original week (preserving history). A new copy is created
  in the current week with a link back to the original. This ensures weekly
  reports remain accurate and version history is intact.
- Q: Business Scale and Timing data types? → A: Scale is free text.
  Timing is hybrid — free text input plus an optional date picker
  (start/end dates). Both input methods coexist; the user can type
  descriptive text (e.g., "2026 상반기") and/or select dates from a
  calendar widget. This supports future calendar view features.
- Q: Audit log and version retention policy? → A: Unlimited retention.
  All logs and versions are kept indefinitely. A future archiving policy
  may be added if storage becomes a concern, but is out of scope now.

### Session 2026-03-19

- Q: Key company (★) and pin-to-top — are they the same? → A: No. ★ is a
  favorite/importance marker only. Display order is controlled by
  drag-and-drop reordering of company rows, persisted via sortOrder. Pin
  feature was considered and removed in favor of DnD.
- Q: Search overlap between global (⌘K) and local toolbar search? → A:
  Separated by role. Global search = navigate to a specific item (scroll +
  highlight). Local search = filter/dim non-matching cards in place. They
  do not interfere with each other.
- Q: Stage column visibility? → A: Stage headers are clickable toggles.
  Collapsed stages shrink to 40px with pill indicators showing card
  existence. Card filtering and search respect visible stages only.
- Q: Default date on progress item creation? → A: When date is not
  specified, today's date (YYYY-MM-DD) is auto-filled. Updates do not
  change the date unless explicitly modified.
- Q: Block detail modal size? → A: Default 700×520px, resizable by
  dragging the bottom-right corner (min 540×400px). Textarea fills
  available space. Size resets when opening a different card.

## Assumptions

- The service targets a small-to-medium internal team (up to ~50
  concurrent users).
- Weekly cycles follow ISO 8601 week numbering.
- The initial deployment will be without authentication; the User entity
  and nullable foreign keys are included in the data model from day one
  for forward compatibility.
- "Files/References" tab in business detail is a placeholder for future
  file attachment capability; it is listed in navigation but
  implementation details are deferred.
- Drag-and-drop for progress block movement is desktop-only; mobile uses
  menu-based stage selection.
- The system uses soft delete (archive) universally; no hard delete is
  exposed in the UI.
- Business timing supports optional structured dates (start/end) to enable
  a future calendar view feature. The calendar view itself is not in scope
  for this version but the data model accommodates it.
