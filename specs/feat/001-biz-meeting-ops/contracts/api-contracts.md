# API Contracts: Business Management & Weekly Meeting Ops

**Date**: 2026-03-18
**Protocol**: REST over HTTPS
**Format**: JSON request/response
**Auth**: None initially; future Bearer token (NextAuth.js session)

## Base URL

```
/api
```

## Common Patterns

- All list endpoints support `?search=`, `?sort=`, `?order=asc|desc`
- All mutable operations return the updated entity
- All mutable operations require `lock_version` in request body
- Conflict response: HTTP 409 with `{ conflict: true, latest: {...}, submitted: {...} }`
- Archived items excluded by default; add `?include_archived=true` to include
- All IDs are UUIDs

## Error Response Format

```json
{
  "error": "CONFLICT | NOT_FOUND | VALIDATION | FORBIDDEN",
  "message": "Human-readable description",
  "details": {}
}
```

---

## Companies

### GET /api/companies
List companies with optional filters.

**Query params**: `search`, `is_key`, `include_archived`, `sort`, `order`
**Response**: `{ data: Company[], total: number }`

### POST /api/companies
Create a new company.

**Body**: `{ canonical_name, aliases?: string[], is_key?: boolean }`
**Response**: `201 { data: Company }`

### GET /api/companies/:id
Get company with aliases.

**Response**: `{ data: Company & { aliases: string[] } }`

### PUT /api/companies/:id
Update company.

**Body**: `{ canonical_name?, is_key?, lock_version }`
**Response**: `{ data: Company }` | `409 Conflict`

### POST /api/companies/:id/archive
Archive a company.

**Body**: `{ lock_version }`
**Response**: `{ data: Company }`

### POST /api/companies/:id/restore
Restore an archived company.

**Response**: `{ data: Company }`

### POST /api/companies/merge
Merge companies (admin only).

**Body**: `{ canonical_id, merge_ids: UUID[], canonical_name? }`
**Response**: `{ data: Company, merged_count: number, relinked: { businesses, actions, notes } }`

---

## Businesses

### GET /api/businesses
List businesses with company grouping.

**Query params**: `company_id`, `stage`, `assigned_to`, `search`,
`include_archived`, `sort`, `order`
**Response**: `{ data: Business[], total: number }`

### POST /api/businesses
Create a new business.

**Body**: `{ company_id, name, visibility?, scale?, timing_text?, timing_start?, timing_end?, assigned_to? }`
**Response**: `201 { data: Business }`

### GET /api/businesses/:id
Get business with progress items grouped by stage.

**Response**: `{ data: Business & { progress_items: Record<Stage, ProgressItem[]> } }`

### PUT /api/businesses/:id
Update business.

**Body**: `{ name?, visibility?, scale?, timing_text?, timing_start?, timing_end?, current_stage?, assigned_to?, sort_order?, lock_version }`
**Response**: `{ data: Business }` | `409 Conflict`

### POST /api/businesses/:id/archive
### POST /api/businesses/:id/restore

Same pattern as companies.

---

## Progress Items

### GET /api/businesses/:businessId/progress-items
List progress items for a business, grouped by stage.

**Response**: `{ data: Record<Stage, ProgressItem[]> }`

### POST /api/businesses/:businessId/progress-items
Create a progress item.

**Body**: `{ stage, content, sort_order? }`
**Response**: `201 { data: ProgressItem }`

### PUT /api/progress-items/:id
Update a progress item (content, sort_order).

**Body**: `{ content?, sort_order?, lock_version }`
**Response**: `{ data: ProgressItem }` | `409 Conflict`

### POST /api/progress-items/:id/move
Move a progress item to another stage (same business only).

**Body**: `{ target_stage, sort_order?, lock_version }`
**Response**: `{ data: ProgressItem }`

### DELETE /api/progress-items/:id
Delete a progress item (hard delete — these are sub-records).

**Body**: `{ lock_version }`
**Response**: `204`

---

## Weekly Cycles

### GET /api/weekly-cycles
List weekly cycles.

**Query params**: `year`, `week_number`, `current` (boolean — returns
current week only)
**Response**: `{ data: WeeklyCycle[] }`

### GET /api/weekly-cycles/current
Get or create the current week's cycle.

**Response**: `{ data: WeeklyCycle }`

---

## Weekly Actions

### GET /api/weekly-actions
List actions for a cycle.

**Query params**: `cycle_id`, `company_id`, `business_id`, `assigned_to`,
`status`, `search`, `include_archived`
**Response**: `{ data: WeeklyAction[], total: number }`

### POST /api/weekly-actions
Create a weekly action.

**Body**: `{ cycle_id, company_id, business_id?, content, assigned_to?, status?, priority? }`
**Response**: `201 { data: WeeklyAction }`

### PUT /api/weekly-actions/:id
Update a weekly action.

**Body**: `{ content?, assigned_to?, status?, priority?, business_id?, sort_order?, lock_version }`
**Response**: `{ data: WeeklyAction }` | `409 Conflict`

### POST /api/weekly-actions/:id/archive
### POST /api/weekly-actions/:id/restore

Same pattern as companies.

### POST /api/weekly-actions/carryover
Carry over actions from previous week.

**Body**: `{ source_cycle_id, target_cycle_id, action_ids: UUID[] }`
**Response**: `{ data: WeeklyAction[], carried_count: number }`

### POST /api/weekly-actions/carryover-all
Carry over all eligible actions.

**Body**: `{ source_cycle_id, target_cycle_id }`
**Response**: `{ data: WeeklyAction[], carried_count: number }`

### GET /api/weekly-actions/carryover-candidates
Get actions eligible for carryover from a source week.

**Query params**: `source_cycle_id`
**Response**: `{ data: WeeklyAction[] }`

---

## Internal Notes

### GET /api/notes
List notes for an owner.

**Query params**: `owner_type`, `owner_id`, `tag`, `search`
**Response**: `{ data: InternalNote[] }`

### POST /api/notes
Create a note.

**Body**: `{ owner_type, owner_id, title?, body, tag? }`
**Response**: `201 { data: InternalNote }`

### PUT /api/notes/:id
Update a note.

**Body**: `{ title?, body?, tag?, lock_version }`
**Response**: `{ data: InternalNote }` | `409 Conflict`

---

## Search

### GET /api/search
Global search across all entity types.

**Query params**: `q` (search query), `types?` (comma-separated:
company, business, progress_item, weekly_action, note)
**Response**:
```json
{
  "data": {
    "companies": [...],
    "businesses": [...],
    "progress_items": [...],
    "weekly_actions": [...],
    "notes": [...]
  },
  "total": number
}
```

---

## Audit Logs

### GET /api/audit-logs
List audit logs with filters.

**Query params**: `entity_type`, `entity_id`, `action`, `actor_id`,
`from_date`, `to_date`, `limit`, `offset`
**Response**: `{ data: AuditLog[], total: number }`

---

## Versions

### GET /api/versions
List versions for an entity.

**Query params**: `entity_type`, `entity_id`
**Response**: `{ data: Version[] }`

### GET /api/versions/:id
Get a specific version snapshot.

**Response**: `{ data: Version }`

### GET /api/versions/diff
Compare two versions.

**Query params**: `version_a`, `version_b`
**Response**: `{ data: { added: {}, removed: {}, changed: {} } }`

### POST /api/versions/:id/restore
Restore an entity to a previous version (creates new version).

**Response**: `{ data: { entity: {...}, new_version: Version } }`

---

## Export

### POST /api/export/current-view
Download current view as Excel.

**Body**: `{ view: 'business_management' | 'weekly_meeting', filters: {...} }`
**Response**: Binary .xlsx file (Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)

### POST /api/export/weekly
Download weekly report.

**Body**: `{ cycle_id, include_completed?, include_carryover?, assigned_to? }`
**Response**: Binary .xlsx file

### POST /api/export/monthly
Download monthly report.

**Body**: `{ year, month, include_stage_status?, include_change_history?, include_incomplete_actions? }`
**Response**: Binary .xlsx file

---

## Assignee Bulk Operations

### POST /api/bulk/assign
Bulk change assignee.

**Body**: `{ entity_type: 'business' | 'weekly_action', entity_ids: UUID[], assigned_to: UUID }`
**Response**: `{ updated_count: number }`

---

## Recent Views

### GET /api/recent-views
Get recent views for current user/session.

**Query params**: `limit` (default 20)
**Response**: `{ data: RecentView[] }`

### POST /api/recent-views
Record a view.

**Body**: `{ entity_type, entity_id }`
**Response**: `201`

---

## Admin (admin role required)

### GET /api/admin/users
List all users.

### PUT /api/admin/users/:id
Update user role/status.

**Body**: `{ role?, status? }`

### GET /api/admin/settings
Get system settings.

### PUT /api/admin/settings
Update system settings.

**Body**: `{ google_login_policy?, allowed_domains?, default_home?, excel_filename_rules? }`
