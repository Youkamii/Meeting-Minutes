-- Create weekly_checkpoints table
CREATE TABLE IF NOT EXISTS "weekly_checkpoints" (
  "id" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "label" TEXT,
  "year" INTEGER,
  "week_number" INTEGER,
  "payload" JSONB NOT NULL,
  "byte_size" INTEGER,
  "taken_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expires_at" TIMESTAMPTZ,
  "created_by" TEXT,
  CONSTRAINT "weekly_checkpoints_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "weekly_checkpoints_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "weekly_checkpoints_taken_at_idx" ON "weekly_checkpoints"("taken_at" DESC);
CREATE INDEX IF NOT EXISTS "weekly_checkpoints_kind_taken_at_idx" ON "weekly_checkpoints"("kind", "taken_at" DESC);
CREATE INDEX IF NOT EXISTS "weekly_checkpoints_expires_at_idx" ON "weekly_checkpoints"("expires_at");
