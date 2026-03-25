// ============================================================
// Enums
// ============================================================

export type Role = "admin" | "user";

export type UserStatus = "pending" | "approved" | "rejected";

export type Visibility = "public" | "private";

export type Stage =
  | "inbound"
  | "funnel"
  | "pipeline"
  | "proposal"
  | "contract"
  | "build"
  | "maintenance";

export type ActionStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "on_hold";

export type Priority = "high" | "medium" | "low";

export type NoteTag = "situation" | "decision" | "risk" | "follow_up";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "move"
  | "merge"
  | "carryover"
  | "download"
  | "status_change"
  | "role_change";

// ============================================================
// Entities
// ============================================================

export interface User {
  id: string;
  email: string | null;
  name: string;
  role: Role;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  canonicalName: string;
  aliases: string[];
  isKey: boolean;
  isArchived: boolean;
  archivedAt: string | null;
  sortOrder: number;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  lockVersion: number;
}

export interface Business {
  id: string;
  companyId: string;
  name: string;
  embargoName: string | null;
  visibility: Visibility;
  scale: string | null;
  timingText: string | null;
  timingStart: string | null;
  timingEnd: string | null;
  funnelNumbers: Record<string, string> | null;
  currentStage: Stage | null;
  assignedTo: string | null;
  isArchived: boolean;
  archivedAt: string | null;
  sortOrder: number;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  lockVersion: number;
}

export interface ProgressItem {
  id: string;
  businessId: string;
  stage: Stage;
  title: string;
  content: string;
  date: string | null;
  sortOrder: number;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  lockVersion: number;
}

export interface WeeklyCycle {
  id: string;
  year: number;
  weekNumber: number;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface WeeklyAction {
  id: string;
  cycleId: string;
  companyId: string;
  businessId: string | null;
  content: string;
  assignedTo: string | null;
  status: ActionStatus;
  priority: Priority;
  carriedFromId: string | null;
  carryoverCount: number;
  isArchived: boolean;
  archivedAt: string | null;
  sortOrder: number;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  lockVersion: number;
}

/** WeeklyAction with joined relations as returned by the list API. */
export interface WeeklyActionWithRelations extends WeeklyAction {
  company?: { id: string; canonicalName: string; isKey: boolean };
  business?: { name: string } | null;
}

/** Business with joined company name as used in list views. */
export interface BusinessWithCompany extends Business {
  company?: { canonicalName: string };
}

export interface InternalNote {
  id: string;
  ownerType: "company" | "business" | "weekly_action";
  ownerId: string;
  title: string | null;
  body: string;
  tag: NoteTag | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  lockVersion: number;
}

export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: AuditAction;
  actorId: string | null;
  changes: Record<string, unknown> | null;
  summary: string | null;
  createdAt: string;
}

export interface Version {
  id: string;
  entityType: string;
  entityId: string;
  versionNumber: number;
  snapshot: Record<string, unknown>;
  createdBy: string | null;
  createdAt: string;
}

export interface RecentView {
  id: string;
  userId: string | null;
  sessionId: string | null;
  entityType: string;
  entityId: string;
  viewedAt: string;
}

// ============================================================
// API response types
// ============================================================

export interface ApiListResponse<T> {
  data: T[];
  total: number;
}

export interface ApiResponse<T> {
  data: T;
}

export interface ConflictResponse<T> {
  error: "CONFLICT";
  message: string;
  latest: T;
  submitted: T;
}

export interface SearchResults {
  companies: Company[];
  businesses: Business[];
  progressItems: ProgressItem[];
  weeklyActions: WeeklyAction[];
  notes: InternalNote[];
}
