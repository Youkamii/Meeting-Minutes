-- This migration was reverted: isPinned is no longer needed.
-- The column was added and then dropped in the same release.
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "is_pinned" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "companies" DROP COLUMN IF EXISTS "is_pinned";
