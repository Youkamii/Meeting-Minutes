/**
 * Admin role check helper.
 * Currently returns true for all requests (no auth yet).
 * Structured for future integration with a real auth provider.
 */
export function isAdmin(_request?: Request): boolean {
  // TODO: integrate with real auth provider
  return true;
}

export function requireAdmin(request?: Request): void {
  if (!isAdmin(request)) {
    throw new Error("Forbidden: admin role required");
  }
}
