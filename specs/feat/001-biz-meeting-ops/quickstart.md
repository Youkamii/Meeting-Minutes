# Quickstart: Business Management & Weekly Meeting Ops

**Date**: 2026-03-18
**Feature Branch**: `feat/001-biz-meeting-ops`

## Prerequisites

- Node.js 20+ and npm/pnpm
- PostgreSQL 15+ (local or Docker)
- Git

## Project Setup

```bash
# Clone and checkout feature branch
git clone <repo-url>
cd Meeting-Minutes
git checkout feat/001-biz-meeting-ops

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your PostgreSQL connection string:
#   DATABASE_URL="postgresql://user:pass@localhost:5432/meeting_minutes"

# Run database migrations
pnpm prisma migrate dev

# Seed initial data (system user + sample weekly cycle)
pnpm prisma db seed

# Start development server
pnpm dev
```

## Access

- **App**: http://localhost:3000
- **API**: http://localhost:3000/api

## Key Screens

1. **Home** (`/`) — Activity center: key companies, incomplete actions,
   recent activity, quick actions
2. **Business Management** (`/business`) — Excel-like table with
   progress stage columns
3. **Weekly Meeting** (`/weekly`) — Weekly-cycle-centric action
   management
4. **Admin** (`/admin`) — User management, logs, settings (admin only)

## Quick Verification Steps

### 1. Create a Company and Business

1. Click "New Company" from Home or Business Management
2. Enter canonical name (e.g., "Acme Corp")
3. Click "New Business" under that company
4. Fill in name, assignee, timing
5. Verify the company appears in Weekly Meeting screen

### 2. Add a Progress Block

1. Open Business Management
2. Click a stage cell (e.g., Inbound) for a business
3. Add a progress block with content
4. Drag the block from Inbound to Funnel
5. Verify the block moved and audit log recorded the move

### 3. Create a Weekly Action

1. Open Weekly Meeting for the current week
2. Click "Add Action" for a company
3. Fill in content, assignee, priority
4. Verify it appears on the Home screen under incomplete actions

### 4. Carryover Test

1. Create an action for last week (status: scheduled)
2. Navigate to the current week
3. Click "Carryover" — verify the action appears as a candidate
4. Carry it over — verify badge and count display correctly
5. Verify the original remains in the previous week

### 5. Conflict Detection Test

1. Open a business detail in two browser tabs
2. Edit and save in Tab 1
3. Edit and save in Tab 2
4. Verify Tab 2 shows a conflict dialog with diff

### 6. Dark Mode

1. Click the dark mode toggle in the top navigation
2. Verify all screens switch consistently
3. Verify status badges remain clearly visible

### 7. Excel Download

1. Open Weekly Meeting
2. Click "Excel Download" → Weekly
3. Select options and download
4. Verify the .xlsx file contains correct data and timestamp

## Development Commands

```bash
pnpm dev           # Start dev server (Next.js)
pnpm build         # Production build
pnpm lint          # ESLint check
pnpm format        # Prettier format
pnpm prisma studio # Database GUI
pnpm test          # Run tests
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx            # Home / Activity Center
│   ├── business/           # Business Management
│   ├── weekly/             # Weekly Meeting
│   ├── admin/              # Admin screens
│   ├── api/                # API Routes
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
│   ├── ui/                 # shadcn/ui components
│   ├── business-table/     # TanStack Table for Business Management
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
├── hooks/                  # React hooks (queries, mutations)
├── stores/                 # Zustand stores (UI state)
└── types/                  # Shared TypeScript types

prisma/
├── schema.prisma           # Database schema
├── migrations/             # Migration files
└── seed.ts                 # Seed data

tests/
├── unit/
├── integration/
└── e2e/
```
