-- Add per-user edit permission (default: read-only) and make new users
-- readable-by-default (login grants read access without admin approval).
-- Idempotent: safe to run directly against the production DB, which has
-- migration drift (deploys do not run migrations automatically).

-- AlterTable: add can_edit column, default false (read-only)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "can_edit" BOOLEAN NOT NULL DEFAULT false;

-- Change default status for new users from 'pending' to 'approved'
ALTER TABLE "users" ALTER COLUMN "status" SET DEFAULT 'approved';
