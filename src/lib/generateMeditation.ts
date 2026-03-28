import { MEDITATION_TYPES } from "./meditationTypes";
import type { MeditationType } from "./types";

/**
 * Maps extracted capacities to the best-fit meditation types.
 * Returns up to 5-6 types, prioritizing primary capacities.
 */

interface CapacityItem {
  capacity: string;
  description: string;
  evidence: string;
  intensity: "high" | "medium" | "low";
}

export interface ExtractionResult {
  primary_capacities: CapacityItem[];
  secondary_capacities: CapacityItem[];
  emotional_tone: string;
  body_context: string;
  strength_signals: string;
}

interface MeditationAssignment {
  type: MeditationType;
  capacities: CapacityItem[];
}

/** Keywords that signal a good fit for each meditation type */
const TYPE_SIGNALS: Record<MeditationType, RegExp> = {
  anchor:
    /overwhelm|chaos|fragment|scatter|multiple.*stress|too much|spinning|unground/i,
  release:
    /control|grip|circular|ruminat|loop|fix.*unfix|let.*go|holding|clench/i,
  bridge:
    /transition|between|identity|uncertain|liminal|change|next.*chapter|unknown/i,
  body: /body|heal|recover|physical|pain|fatigue|illness|surgery|chronic|patience.*body/i,
  thread:
    /distance|connect|miss|apart|far.*away|separated|caretake.*afar|loved.*one/i,
  ground:
    /self.*trust|doubt|imposter|confiden|competenc|capab|agency|worth|prov/i,
};

export function assignMeditationTypes(
  extraction: ExtractionResult
): MeditationAssignment[] {
  const allCapacities = [
    ...extraction.primary_capacities,
    ...extraction.secondary_capacities,
  ];

  const scores = new Map<MeditationType, { score: number; caps: CapacityItem[] }>();

  // Initialize all types
  for (const type of Object.keys(MEDITATION_TYPES) as MeditationType[]) {
    scores.set(type, { score: 0, caps: [] });
  }

  // Score each type based on capacity keyword matches
  for (const cap of allCapacities) {
    const text = `${cap.capacity} ${cap.description} ${cap.evidence}`;
    const isPrimary = extraction.primary_capacities.includes(cap);
    const intensityBoost = cap.intensity === "high" ? 2 : cap.intensity === "medium" ? 1 : 0;

    for (const [type, pattern] of Object.entries(TYPE_SIGNALS)) {
      if (pattern.test(text)) {
        const entry = scores.get(type as MeditationType)!;
        entry.score += (isPrimary ? 3 : 1) + intensityBoost;
        entry.caps.push(cap);
      }
    }
  }

  // Also check body_context and emotional_tone for body/anchor signals
  if (extraction.body_context && extraction.body_context.length > 10) {
    const bodyEntry = scores.get("body")!;
    bodyEntry.score += 2;
  }

  if (/overwhelm|too much|spinning|chaos/i.test(extraction.emotional_tone)) {
    const anchorEntry = scores.get("anchor")!;
    anchorEntry.score += 2;
  }

  // Sort by score, take top 5-6
  const ranked = [...scores.entries()]
    .sort((a, b) => b[1].score - a[1].score)
    .filter(([, v]) => v.score > 0)
    .slice(0, 6);

  // Ensure at least 3 meditations — fill with general-purpose types if needed
  if (ranked.length < 3) {
    const usedTypes = new Set(ranked.map(([t]) => t));
    const fallbacks: MeditationType[] = ["anchor", "release", "ground"];
    for (const fb of fallbacks) {
      if (ranked.length >= 3) break;
      if (!usedTypes.has(fb)) {
        ranked.push([fb, { score: 0, caps: [] }]);
        usedTypes.add(fb);
      }
    }
  }

  return ranked.map(([type, data]) => ({
    type,
    capacities: data.caps,
  }));
}
