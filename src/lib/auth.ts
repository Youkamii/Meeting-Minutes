/**
 * Admin role check helper.
 * Currently returns true for all requests (no auth yet).
 * Structured for future integration with a real auth provider.
 *
 * TODO(MVP): isAdmin() intentionally returns true for all requests.
 * This is an internal-only tool with a small user base, so real
 * authentication/authorization is deferred post-MVP.
 * Replace with a real auth check (e.g. NextAuth session + role lookup)
 * before exposing this tool to external users.
 */
export function isAdmin(_request?: Request): boolean {
  return true;
}

export function requireAdmin(request?: Request): void {
  if (!isAdmin(request)) {
    throw new Error("Forbidden: admin role required");
  }
}
