/** Legacy type enum — kept for backward compatibility with cached data */
export type LegacyMeditationType =
  | "anchor"
  | "release"
  | "bridge"
  | "body"
  | "thread"
  | "ground";

/** Structural approach: how the meditation works (not what it addresses) */
export type MeditationApproach =
  | "grounding"
  | "somatic"
  | "visualization"
  | "compassion"
  | "spacious";

export interface Meditation {
  id: string;
  title: string;
  approach: MeditationApproach;
  capacity: string;
  script: string;
  duration: number; // minutes
  createdAt: string;
  audioBase64?: string;
  voiceId?: string;
  /** @deprecated Legacy field from cached data — use `approach` instead */
  type?: LegacyMeditationType;
}

export interface ApiKeyConfig {
  anthropicKey: string;
  elevenLabsKey?: string;
}

export interface ProcessingState {
  stage: "idle" | "parsing" | "extracting" | "generating" | "complete" | "error";
  message: string;
  progress?: number;
}

export interface Voice {
  id: string;
  name: string;
  description: string;
  previewUrl?: string;
}
