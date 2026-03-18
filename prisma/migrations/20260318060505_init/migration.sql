-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'user');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('public', 'private');

-- CreateEnum
CREATE TYPE "Stage" AS ENUM ('inbound', 'funnel', 'pipeline', 'proposal', 'contract', 'build', 'maintenance');

-- CreateEnum
CREATE TYPE "ActionStatus" AS ENUM ('scheduled', 'in_progress', 'completed', 'on_hold');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('high', 'medium', 'low');

-- CreateEnum
CREATE TYPE "NoteTag" AS ENUM ('situation', 'decision', 'risk', 'follow_up');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'user',
    "status" "UserStatus" NOT NULL DEFAULT 'approved',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "canonical_name" TEXT NOT NULL,
    "is_key" BOOLEAN NOT NULL DEFAULT false,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_by" TEXT,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "lock_version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_aliases" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_aliases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "businesses" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "visibility" "Visibility" NOT NULL DEFAULT 'public',
    "scale" TEXT,
    "timing_text" TEXT,
    "timing_start" DATE,
    "timing_end" DATE,
    "current_stage" "Stage",
    "assigned_to" TEXT,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_by" TEXT,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "lock_version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "businesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progress_items" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "stage" "Stage" NOT NULL,
    "content" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_by" TEXT,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "lock_version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "progress_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_cycles" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "week_number" INTEGER NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weekly_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_actions" (
    "id" TEXT NOT NULL,
    "cycle_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "business_id" TEXT,
    "content" TEXT NOT NULL,
    "assigned_to" TEXT,
    "status" "ActionStatus" NOT NULL DEFAULT 'scheduled',
    "priority" "Priority" NOT NULL DEFAULT 'medium',
    "carried_from_id" TEXT,
    "carryover_count" INTEGER NOT NULL DEFAULT 0,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_by" TEXT,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "lock_version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "weekly_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internal_notes" (
    "id" TEXT NOT NULL,
    "owner_type" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "tag" "NoteTag",
    "created_by" TEXT,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "lock_version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "internal_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actor_id" TEXT,
    "changes" JSONB,
    "summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_versions" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progress_item_versions" (
    "id" TEXT NOT NULL,
    "progress_item_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "progress_item_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_action_versions" (
    "id" TEXT NOT NULL,
    "action_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weekly_action_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internal_note_versions" (
    "id" TEXT NOT NULL,
    "note_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "internal_note_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recent_views" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "session_id" TEXT,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recent_views_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "companies_canonical_name_idx" ON "companies"("canonical_name");

-- CreateIndex
CREATE INDEX "companies_is_key_idx" ON "companies"("is_key");

-- CreateIndex
CREATE INDEX "companies_is_archived_idx" ON "companies"("is_archived");

-- CreateIndex
CREATE INDEX "companies_sort_order_idx" ON "companies"("sort_order");

-- CreateIndex
CREATE INDEX "company_aliases_alias_idx" ON "company_aliases"("alias");

-- CreateIndex
CREATE UNIQUE INDEX "company_aliases_company_id_alias_key" ON "company_aliases"("company_id", "alias");

-- CreateIndex
CREATE INDEX "businesses_company_id_idx" ON "businesses"("company_id");

-- CreateIndex
CREATE INDEX "businesses_assigned_to_idx" ON "businesses"("assigned_to");

-- CreateIndex
CREATE INDEX "businesses_is_archived_idx" ON "businesses"("is_archived");

-- CreateIndex
CREATE INDEX "businesses_current_stage_idx" ON "businesses"("current_stage");

-- CreateIndex
CREATE INDEX "progress_items_business_id_stage_sort_order_idx" ON "progress_items"("business_id", "stage", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "weekly_cycles_year_week_number_key" ON "weekly_cycles"("year", "week_number");

-- CreateIndex
CREATE INDEX "weekly_actions_cycle_id_idx" ON "weekly_actions"("cycle_id");

-- CreateIndex
CREATE INDEX "weekly_actions_company_id_idx" ON "weekly_actions"("company_id");

-- CreateIndex
CREATE INDEX "weekly_actions_business_id_idx" ON "weekly_actions"("business_id");

-- CreateIndex
CREATE INDEX "weekly_actions_assigned_to_idx" ON "weekly_actions"("assigned_to");

-- CreateIndex
CREATE INDEX "weekly_actions_status_idx" ON "weekly_actions"("status");

-- CreateIndex
CREATE INDEX "weekly_actions_carried_from_id_idx" ON "weekly_actions"("carried_from_id");

-- CreateIndex
CREATE UNIQUE INDEX "weekly_actions_carried_from_id_cycle_id_key" ON "weekly_actions"("carried_from_id", "cycle_id");

-- CreateIndex
CREATE INDEX "internal_notes_owner_type_owner_id_created_at_idx" ON "internal_notes"("owner_type", "owner_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs"("actor_id");

-- CreateIndex
CREATE INDEX "business_versions_business_id_created_at_idx" ON "business_versions"("business_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "business_versions_business_id_version_number_key" ON "business_versions"("business_id", "version_number");

-- CreateIndex
CREATE INDEX "progress_item_versions_progress_item_id_created_at_idx" ON "progress_item_versions"("progress_item_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "progress_item_versions_progress_item_id_version_number_key" ON "progress_item_versions"("progress_item_id", "version_number");

-- CreateIndex
CREATE INDEX "weekly_action_versions_action_id_created_at_idx" ON "weekly_action_versions"("action_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "weekly_action_versions_action_id_version_number_key" ON "weekly_action_versions"("action_id", "version_number");

-- CreateIndex
CREATE INDEX "internal_note_versions_note_id_created_at_idx" ON "internal_note_versions"("note_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "internal_note_versions_note_id_version_number_key" ON "internal_note_versions"("note_id", "version_number");

-- CreateIndex
CREATE INDEX "recent_views_user_id_viewed_at_idx" ON "recent_views"("user_id", "viewed_at" DESC);

-- CreateIndex
CREATE INDEX "recent_views_session_id_viewed_at_idx" ON "recent_views"("session_id", "viewed_at" DESC);

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_aliases" ADD CONSTRAINT "company_aliases_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_items" ADD CONSTRAINT "progress_items_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_items" ADD CONSTRAINT "progress_items_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_items" ADD CONSTRAINT "progress_items_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_actions" ADD CONSTRAINT "weekly_actions_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "weekly_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_actions" ADD CONSTRAINT "weekly_actions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_actions" ADD CONSTRAINT "weekly_actions_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_actions" ADD CONSTRAINT "weekly_actions_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_actions" ADD CONSTRAINT "weekly_actions_carried_from_id_fkey" FOREIGN KEY ("carried_from_id") REFERENCES "weekly_actions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_actions" ADD CONSTRAINT "weekly_actions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_actions" ADD CONSTRAINT "weekly_actions_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_notes" ADD CONSTRAINT "internal_notes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_notes" ADD CONSTRAINT "internal_notes_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_versions" ADD CONSTRAINT "business_versions_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_versions" ADD CONSTRAINT "business_versions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_item_versions" ADD CONSTRAINT "progress_item_versions_progress_item_id_fkey" FOREIGN KEY ("progress_item_id") REFERENCES "progress_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_item_versions" ADD CONSTRAINT "progress_item_versions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_action_versions" ADD CONSTRAINT "weekly_action_versions_action_id_fkey" FOREIGN KEY ("action_id") REFERENCES "weekly_actions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_action_versions" ADD CONSTRAINT "weekly_action_versions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_note_versions" ADD CONSTRAINT "internal_note_versions_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "internal_notes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_note_versions" ADD CONSTRAINT "internal_note_versions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recent_views" ADD CONSTRAINT "recent_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
