import type { Stage } from "@/types";

/**
 * Canonical stage definitions used across the app.
 */
export const STAGES: Stage[] = [
  "inbound",
  "funnel",
  "pipeline",
  "proposal",
  "contract",
  "build",
  "maintenance",
];

export const STAGE_LABELS: Record<Stage, string> = {
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
