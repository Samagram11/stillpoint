import type { MeditationApproach } from "./types";

/**
 * Extraction result from the /api/extract-themes route.
 * Flat capacity list with LLM-assigned approaches — no regex matching needed.
 */

export interface CapacityItem {
  capacity: string;
  description: string;
  evidence: string;
  intensity: "high" | "medium" | "low";
  meditation_seed: string;
  recommended_approach: MeditationApproach;
  approach_rationale: string;
}

export interface ExtractionResult {
  capacities: CapacityItem[];
  emotional_tone: string;
  body_context: string;
  strength_signals: string;
}

/** Intensity sort order */
const INTENSITY_ORDER: Record<string, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

/**
 * Select the top capacities for meditation generation.
 * Sorts by intensity, caps at maxCount.
 */
export function selectCapacities(
  extraction: ExtractionResult,
  maxCount = 5
): CapacityItem[] {
  return [...extraction.capacities]
    .sort((a, b) => (INTENSITY_ORDER[a.intensity] ?? 2) - (INTENSITY_ORDER[b.intensity] ?? 2))
    .slice(0, maxCount);
}
