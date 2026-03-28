export type MeditationType =
  | "anchor"
  | "release"
  | "bridge"
  | "body"
  | "thread"
  | "ground";

export interface ExtractedCapacity {
  id: string;
  capacity: string;
  description: string;
  recommendedType: MeditationType;
}

export interface Meditation {
  id: string;
  title: string;
  type: MeditationType;
  capacity: string;
  script: string;
  duration: number; // minutes
  createdAt: string;
  audioBase64?: string;
  voiceId?: string;
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
