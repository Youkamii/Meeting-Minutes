# Quickstart: Business Management & Weekly Meeting Ops

**Date**: 2026-03-18 (최종 업데이트: 2026-05-04)
**Branch**: `master` (feature branch `feat/001-biz-meeting-ops` → merged)

## Prerequisites

- Node.js 20+ and npm/pnpm
- PostgreSQL 15+ (local or Docker)
- Git

## Project Setup

```bash
# Clone repository
git clone <repo-url>
cd Meeting-Minutes

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.local
# .env.local에 다음 항목 설정:
#   DATABASE_URL="postgresql://user:pass@localhost:5432/meeting_minutes"
#   DIRECT_URL="postgresql://user:pass@localhost:5432/meeting_minutes"
#   NEXTAUTH_SECRET="<random-secret>"
#   NEXTAUTH_URL="http://localhost:3000"
#   GOOGLE_CLIENT_ID="<google-oauth-client-id>"       # Google OAuth 사용 시
#   GOOGLE_CLIENT_SECRET="<google-oauth-client-secret>"
#   APP_PASSWORD="<shared-password>"                  # 공유 비밀번호 로그인 사용 시

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
3. **Weekly Meeting** (`/weekly`) — Company × Week table with monthly navigation
4. **Admin** (`/admin`) — User management, audit logs, settings, checkpoints (admin only)
5. **Login** (`/login`) — Google OAuth 또는 공유 비밀번호 로그인
6. **Pending** (`/pending`) — 어드민 승인 대기 화면

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

1. Open Business Management or Weekly Meeting
2. Click "엑셀" → 월간 또는 연간 선택
3. 연도/월 선택 후 다운로드
4. .xlsx 파일에 사업관리 + 주간회의 두 시트가 올바르게 생성되는지 확인
5. (참고: 주간 다운로드 옵션은 2026-04-03 제거됨)

## Development Commands

```bash
pnpm dev              # Start dev server (Next.js 16)
pnpm build            # Production build (prisma generate + next build)
pnpm lint             # ESLint check
pnpm format           # Prettier format
pnpm prisma studio    # Database GUI
pnpm prisma:migrate   # Run migrations
pnpm prisma:seed      # Seed data
```

> **참고**: 테스트 스위트 미구성 (Vitest/Playwright 미설치)

## Project Structure

```
src/
├── app/                    # Next.js 16 App Router
│   ├── page.tsx            # Home / Activity Center
│   ├── business/           # Business Management
│   ├── weekly/             # Weekly Meeting (company × week table)
│   ├── admin/              # Admin screens (users, logs, settings, checkpoints)
│   ├── login/              # 로그인 페이지
│   ├── pending/            # 승인 대기 페이지
│   ├── privacy/            # 개인정보 처리방침
│   ├── admin-unlock/       # 관리자 언락
│   ├── api/                # API Routes
│   │   ├── auth/           # NextAuth handler
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
│   │   └── cron/           # 체크포인트 cron
│   └── layout.tsx          # Root layout (nav, dark mode)
├── components/
│   ├── ui/                 # button, empty-state
│   ├── layout/             # top-nav
│   ├── home/               # activity-feed, key-companies-card, incomplete-actions-card
│   ├── export/             # excel-download-dialog
│   ├── editor/             # inline-editor (Tiptap)
│   ├── business-table/     # TanStack Table for Business Management
│   ├── progress-blocks/    # dnd-kit progress stage blocks
│   ├── weekly-meeting/     # Weekly Meeting components
│   ├── meeting-mode/       # ⚠ 제거됨 (2026-04-03) — 파일 잔류
│   ├── search/             # Global search overlay
│   ├── notes/              # Internal notes timeline
│   ├── version-diff/       # Version comparison UI
│   └── conflict-dialog/    # Conflict resolution modal
├── lib/
│   ├── auth.ts             # NextAuth 설정
│   ├── prisma.ts           # Prisma client singleton
│   ├── audit.ts            # Audit logging helper
│   ├── version.ts          # Version snapshot helper
│   ├── version-unlock.ts   # Version unlock utility
│   ├── conflict.ts         # Optimistic locking helper
│   ├── checkpoint.ts       # 체크포인트 백업/복원
│   ├── admin-unlock.ts     # Admin unlock utility
│   ├── excel.ts            # ExcelJS export helpers
│   ├── fetch.ts            # Custom fetch wrapper
│   └── weekly-cycle.ts     # ISO 8601 week utilities
├── hooks/                  # React 19 Query hooks (TanStack Query v5)
├── stores/                 # Zustand v5 stores
└── types/                  # Shared TypeScript types

prisma/
├── schema.prisma           # Database schema
├── migrations/             # Migration files
└── seed.ts                 # Seed data
```
