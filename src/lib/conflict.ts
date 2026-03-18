import { NextResponse } from "next/server";

export class ConflictError extends Error {
  constructor(
    public latest: Record<string, unknown>,
    public submitted: Record<string, unknown>,
  ) {
    super("Conflict detected: entity was modified by another user");
    this.name = "ConflictError";
  }
}

export function checkLockVersion(
  currentVersion: number,
  submittedVersion: number,
  latestEntity: Record<string, unknown>,
  submittedData: Record<string, unknown>,
) {
  if (currentVersion !== submittedVersion) {
    throw new ConflictError(latestEntity, submittedData);
  }
}

export function conflictResponse(error: ConflictError) {
  return NextResponse.json(
    {
      error: "CONFLICT",
      message: error.message,
      latest: error.latest,
      submitted: error.submitted,
    },
    { status: 409 },
  );
}
