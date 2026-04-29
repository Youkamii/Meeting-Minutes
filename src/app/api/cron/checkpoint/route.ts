import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import {
  createCheckpoint,
  cleanupExpiredCheckpoints,
} from "@/lib/checkpoint";
import { getCurrentWeek, formatWeekLabel } from "@/lib/weekly-cycle";
import { createAuditLog } from "@/lib/audit";

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization") ?? "";
  const expected = secret ? `Bearer ${secret}` : null;
  if (!expected || !safeEqual(auth, expected)) {
    return NextResponse.json(
      { error: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  const { year, weekNumber } = getCurrentWeek();
  const label = `${formatWeekLabel(year, weekNumber)} auto`;

  const checkpoint = await createCheckpoint({
    kind: "weekly",
    label,
    year,
    weekNumber,
  });

  const cleaned = await cleanupExpiredCheckpoints();

  await createAuditLog({
    entityType: "weekly_checkpoint",
    entityId: checkpoint.id,
    action: "create",
    summary: `Auto weekly checkpoint (${label}, byteSize=${checkpoint.byteSize}, cleanedCheckpoints=${cleaned.deletedCheckpoints}, cleanedOrphanLogs=${cleaned.deletedOrphanLogs})`,
  });

  return NextResponse.json({
    data: {
      checkpointId: checkpoint.id,
      label: checkpoint.label,
      byteSize: checkpoint.byteSize,
      cleanedUp: cleaned,
    },
  });
}
