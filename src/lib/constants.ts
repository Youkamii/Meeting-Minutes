import type { Stage, Role, UserStatus } from "@/types";

/**
 * Canonical stage definitions used across the app.
 */
export const STAGES: readonly Stage[] = [
  "inbound",
  "funnel",
  "pipeline",
  "proposal",
  "contract",
  "build",
  "maintenance",
] as const;

export const STAGE_LABELS: Readonly<Record<Stage, string>> = {
  inbound: "Inbound(초도미팅)",
  funnel: "Funnel",
  pipeline: "Pipeline",
  proposal: "제안",
  contract: "계약",
  build: "구축",
  maintenance: "유지보수",
};

export const VALID_STAGES_SET = new Set<string>(STAGES);

export function isValidStage(value: string): value is Stage {
  return VALID_STAGES_SET.has(value);
}

// User enums
export const VALID_ROLES: readonly Role[] = ["admin", "user"] as const;
export const VALID_STATUSES: readonly UserStatus[] = ["pending", "approved", "rejected"] as const;

export function isValidRole(value: string): value is Role {
  return (VALID_ROLES as readonly string[]).includes(value);
}

export function isValidStatus(value: string): value is UserStatus {
  return (VALID_STATUSES as readonly string[]).includes(value);
}
