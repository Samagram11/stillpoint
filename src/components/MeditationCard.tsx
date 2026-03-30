"use client";

import { MEDITATION_APPROACHES, LEGACY_MEDITATION_TYPES } from "@/lib/meditationTypes";
import type { Meditation, LegacyMeditationType } from "@/lib/types";

interface MeditationCardProps {
  meditation: Meditation;
  onSelect: (meditation: Meditation) => void;
}

function getDisplayInfo(meditation: Meditation): { name: string } {
  if (meditation.approach) {
    return MEDITATION_APPROACHES[meditation.approach];
  }
  // Legacy cached data fallback
  if (meditation.type) {
    return LEGACY_MEDITATION_TYPES[meditation.type as LegacyMeditationType] ?? { name: "Meditation" };
  }
  return { name: "Meditation" };
}

export default function MeditationCard({
  meditation,
  onSelect,
}: MeditationCardProps) {
  const displayInfo = getDisplayInfo(meditation);

  return (
    <button
      onClick={() => onSelect(meditation)}
      className="fade-in group w-full rounded-xl border border-edge bg-white/40 p-6 text-left transition-all hover:border-accent/50 hover:bg-white/60 aura-glass"
    >
      <div className="mb-3 flex items-start justify-between">
        <h3 className="font-display text-2xl font-light text-ink">
          {meditation.title}
        </h3>
        <span className="ml-3 shrink-0 rounded-full bg-accent/10 px-2.5 py-0.5 text-xs text-accent">
          {displayInfo.name}
        </span>
      </div>

      <p className="text-sm leading-relaxed text-ink/50">
        {meditation.capacity}
      </p>

      <div className="mt-4 text-xs text-ink/30">
        {meditation.duration} min
      </div>
    </button>
  );
}
