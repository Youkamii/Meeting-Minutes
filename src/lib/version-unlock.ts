import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const VERSION_UNLOCK_COOKIE = "version_unlock";
const PASSWORD_USER_ID = "password-shared-user";

/**
 * Returns a 403 response if the current session is the shared password user
 * AND the version-unlock cookie is missing/invalid. Returns null otherwise
 * (caller may proceed). Use at the top of route handlers that expose version
 * management or checkpoint data.
 */
export async function ensureSharedUserVersionUnlocked(
  request: NextRequest,
): Promise<NextResponse | null> {
  const session = await auth();
  if (session?.user?.id !== PASSWORD_USER_ID) return null;
  const ok = await verifyVersionUnlockCookie(
    request.cookies.get(VERSION_UNLOCK_COOKIE)?.value,
  );
  if (ok) return null;
  return NextResponse.json(
    { error: "UnlockRequired", message: "Version unlock required" },
    { status: 403 },
  );
}

function getSecret(): string {
  const s = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
  if (!s) {
    throw new Error(
      "NEXTAUTH_SECRET or AUTH_SECRET is required for version unlock",
    );
  }
  return s;
}

export async function versionUnlockToken(): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode("version-unlocked:v1"),
  );
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyVersionUnlockCookie(
  value: string | undefined,
): Promise<boolean> {
  if (!value) return false;
  const expected = await versionUnlockToken();
  if (value.length !== expected.length) return false;
  let eq = 0;
  for (let i = 0; i < value.length; i++) {
    eq |= value.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return eq === 0;
}
