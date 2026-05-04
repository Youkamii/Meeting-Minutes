-- Link orphaned AuditLogs to their pre_restore snapshot so that
-- entityId references deleted by restore can still be resolved.
ALTER TABLE "audit_logs"
  ADD COLUMN IF NOT EXISTS "snapshot_checkpoint_id" TEXT;

ALTER TABLE "audit_logs"
  ADD CONSTRAINT "audit_logs_snapshot_checkpoint_id_fkey"
  FOREIGN KEY ("snapshot_checkpoint_id")
  REFERENCES "weekly_checkpoints"("id")
  ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "audit_logs_snapshot_checkpoint_id_idx"
  ON "audit_logs"("snapshot_checkpoint_id");
