"use client";

import { useSession } from "next-auth/react";

/**
 * Client hook: does the current user have edit permission?
 * Admins always can edit; regular users only if granted `canEdit`.
 * Read-only users (shared password login, un-promoted accounts) get `false`.
 */
export function useCanEdit(): boolean {
  const { data: session } = useSession();
  return session?.user?.role === "admin" || session?.user?.canEdit === true;
}
