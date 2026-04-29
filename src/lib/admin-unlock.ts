export const ADMIN_UNLOCK_COOKIE = "admin_unlock";

function getSecret(): string {
  const s = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
  if (!s) {
    throw new Error(
      "NEXTAUTH_SECRET or AUTH_SECRET is required for admin unlock",
    );
  }
  return s;
}

export async function adminUnlockToken(): Promise<string> {
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
    new TextEncoder().encode("admin-unlocked:v1"),
  );
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyAdminUnlockCookie(
  value: string | undefined,
): Promise<boolean> {
  if (!value) return false;
  const expected = await adminUnlockToken();
  if (value.length !== expected.length) return false;
  let eq = 0;
  for (let i = 0; i < value.length; i++) {
    eq |= value.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return eq === 0;
}
