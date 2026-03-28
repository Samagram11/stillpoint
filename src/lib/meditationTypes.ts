import type { MeditationType } from "./types";

interface MeditationTypeInfo {
  type: MeditationType;
  name: string;
  tagline: string;
  description: string;
  approach: string;
}

export const MEDITATION_TYPES: Record<MeditationType, MeditationTypeInfo> = {
  anchor: {
    type: "anchor",
    name: "The Anchor",
    tagline: "Stability amidst chaos",
    description:
      "Sensory grounding, breath stabilization, and finding the still point within.",
    approach:
      "Sensory grounding → breath stabilization → finding the still point.",
  },
  release: {
    type: "release",
    name: "The Release",
    tagline: "Surrendering control",
    description:
      "Noticing what you're gripping, feeling the cost of holding, and practicing letting go.",
    approach:
      "Noticing what you're gripping → cost of holding → practicing release → discovering what remains.",
  },
  bridge: {
    type: "bridge",
    name: "The Bridge",
    tagline: "Tolerating transition",
    description:
      "Honoring what was, sitting with not-knowing, and sensing what's forming.",
    approach:
      "Honoring what was → sitting with not-knowing → sensing what's forming.",
  },
  body: {
    type: "body",
    name: "The Body",
    tagline: "Patience with healing",
    description:
      "Gentle body awareness, gratitude for function, and trusting the timeline.",
    approach:
      "Gentle body awareness → gratitude for function → honoring limits → trusting the timeline.",
  },
  thread: {
    type: "thread",
    name: "The Thread",
    tagline: "Connection across distance",
    description:
      "Feeling connection as energy, sending intention, and trusting the thread.",
    approach:
      "Feeling connection as energy → sending intention → trusting the thread.",
  },
  ground: {
    type: "ground",
    name: "The Ground",
    tagline: "Self-trust",
    description:
      "Settling into your body, remembering capability, and carrying it as fact.",
    approach:
      "Settling into your body → remembering a time you surprised yourself → carrying it as fact.",
  },
};
