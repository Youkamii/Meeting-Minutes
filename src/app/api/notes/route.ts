import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { checkLockVersion, ConflictError, conflictResponse } from "@/lib/conflict";

const VALID_TAGS = ["situation", "decision", "risk", "follow_up"] as const;
const VALID_OWNER_TYPES = ["company", "business", "weekly_action"] as const;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ownerType = searchParams.get("owner_type");
  const ownerId = searchParams.get("owner_id");
  const tag = searchParams.get("tag");

  const where: Record<string, unknown> = {};
  if (ownerType) where.ownerType = ownerType;
  if (ownerId) where.ownerId = ownerId;
  if (tag) where.tag = tag;

  const notes = await prisma.internalNote.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: notes, total: notes.length });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { owner_type, owner_id, title, body: noteBody, tag } = body;

  if (!owner_type || !owner_id || !noteBody) {
    return NextResponse.json(
      { error: "VALIDATION", message: "owner_type, owner_id, and body are required" },
      { status: 400 },
    );
  }

  if (!VALID_OWNER_TYPES.includes(owner_type)) {
    return NextResponse.json(
      {
        error: "VALIDATION",
        message: `owner_type must be one of: ${VALID_OWNER_TYPES.join(", ")}`,
      },
      { status: 400 },
    );
  }

  if (tag != null && !VALID_TAGS.includes(tag)) {
    return NextResponse.json(
      {
        error: "VALIDATION",
        message: `tag must be one of: ${VALID_TAGS.join(", ")}`,
      },
      { status: 400 },
    );
  }

  const note = await prisma.internalNote.create({
    data: {
      ownerType: owner_type,
      ownerId: owner_id,
      title: title ?? null,
      body: noteBody,
      tag: tag ?? null,
    },
  });

  // Create version snapshot
  const latestVersion = await prisma.internalNoteVersion.findFirst({
    where: { noteId: note.id },
    orderBy: { versionNumber: "desc" },
  });

  await prisma.internalNoteVersion.create({
    data: {
      noteId: note.id,
      versionNumber: (latestVersion?.versionNumber ?? 0) + 1,
      snapshot: JSON.parse(JSON.stringify(note)),
    },
  });

  await createAuditLog({
    entityType: "internal_note",
    entityId: note.id,
    action: "create",
    summary: title ?? "New note",
  });

  return NextResponse.json({ data: note }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, title, body: noteBody, tag, lockVersion } = body;

  if (!id) {
    return NextResponse.json(
      { error: "VALIDATION", message: "id is required" },
      { status: 400 },
    );
  }

  const current = await prisma.internalNote.findUnique({ where: { id } });

  if (!current) {
    return NextResponse.json(
      { error: "NOT_FOUND", message: "Note not found" },
      { status: 404 },
    );
  }

  if (tag !== undefined && tag !== null && !VALID_TAGS.includes(tag)) {
    return NextResponse.json(
      {
        error: "VALIDATION",
        message: `tag must be one of: ${VALID_TAGS.join(", ")}`,
      },
      { status: 400 },
    );
  }

  try {
    checkLockVersion(
      current.lockVersion,
      lockVersion,
      current as unknown as Record<string, unknown>,
      body,
    );
  } catch (e) {
    if (e instanceof ConflictError) return conflictResponse(e);
    throw e;
  }

  const updated = await prisma.internalNote.update({
    where: { id },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(noteBody !== undefined ? { body: noteBody } : {}),
      ...(tag !== undefined ? { tag } : {}),
      lockVersion: { increment: 1 },
    },
  });

  // Create version snapshot
  const latestVersion = await prisma.internalNoteVersion.findFirst({
    where: { noteId: id },
    orderBy: { versionNumber: "desc" },
  });

  await prisma.internalNoteVersion.create({
    data: {
      noteId: id,
      versionNumber: (latestVersion?.versionNumber ?? 0) + 1,
      snapshot: JSON.parse(JSON.stringify(updated)),
    },
  });

  await createAuditLog({
    entityType: "internal_note",
    entityId: id,
    action: "update",
    changes: {
      before: {
        title: current.title,
        body: current.body,
        tag: current.tag,
      },
      after: {
        title: updated.title,
        body: updated.body,
        tag: updated.tag,
      },
    },
  });

  return NextResponse.json({ data: updated });
}
