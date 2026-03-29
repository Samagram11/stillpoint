import type { MeditationApproach, LegacyMeditationType } from "./types";

interface MeditationApproachInfo {
  approach: MeditationApproach;
  name: string;
  tagline: string;
  description: string;
  technique: string;
}

export const MEDITATION_APPROACHES: Record<MeditationApproach, MeditationApproachInfo> = {
  grounding: {
    approach: "grounding",
    name: "Grounding",
    tagline: "Present-moment anchoring",
    description:
      "Uses sensory awareness and breath to establish present-moment stability.",
    technique:
      "Noticing physical contact points, sounds, breath rhythm. Anchoring attention in what is real and here.",
  },
  somatic: {
    approach: "somatic",
    name: "Somatic",
    tagline: "Body awareness",
    description:
      "Moves attention through the body. Emphasizes sensation over narrative.",
    technique:
      "Progressive body scan, focused attention on specific areas, noticing tension and ease without judgment.",
  },
  visualization: {
    approach: "visualization",
    name: "Visualization",
    tagline: "Guided imagery",
    description:
      "Uses guided imagery and metaphor. The imagery emerges from the capacity being built.",
    technique:
      "Creating inner landscapes, working with metaphor, transforming felt experience through imagination.",
  },
  compassion: {
    approach: "compassion",
    name: "Compassion",
    tagline: "Directed warmth",
    description:
      "Directs warmth and kindness inward. Tender, not performative.",
    technique:
      "Self-directed kindness, warmth toward difficulty, softening around hard edges.",
  },
  spacious: {
    approach: "spacious",
    name: "Spacious Awareness",
    tagline: "Making room",
    description:
      "Creates room for what is, without trying to change it. Emphasizes non-doing and acceptance.",
    technique:
      "Open awareness, widening attention, letting thoughts and feelings exist without engagement or resistance.",
  },
};

/** Map legacy meditation types to the nearest approach for backward compat */
export const LEGACY_TO_APPROACH: Record<LegacyMeditationType, MeditationApproach> = {
  anchor: "grounding",
  release: "visualization",
  bridge: "spacious",
  body: "somatic",
  thread: "compassion",
  ground: "grounding",
};

interface LegacyTypeInfo {
  name: string;
  tagline: string;
}

/** Legacy type display info — only used for rendering old cached meditations */
export const LEGACY_MEDITATION_TYPES: Record<LegacyMeditationType, LegacyTypeInfo> = {
  anchor: { name: "The Anchor", tagline: "Stability amidst chaos" },
  release: { name: "The Release", tagline: "Surrendering control" },
  bridge: { name: "The Bridge", tagline: "Tolerating transition" },
  body: { name: "The Body", tagline: "Patience with healing" },
  thread: { name: "The Thread", tagline: "Connection across distance" },
  ground: { name: "The Ground", tagline: "Self-trust" },
};
