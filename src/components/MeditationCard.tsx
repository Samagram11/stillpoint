"use client";

import { MEDITATION_TYPES } from "@/lib/meditationTypes";
import type { Meditation } from "@/lib/types";

interface MeditationCardProps {
  meditation: Meditation;
  onSelect: (meditation: Meditation) => void;
}

export default function MeditationCard({
  meditation,
  onSelect,
}: MeditationCardProps) {
  const typeInfo = MEDITATION_TYPES[meditation.type];

  return (
    <button
      onClick={() => onSelect(meditation)}
      className="fade-in group w-full rounded-xl border border-mist bg-white/40 p-6 text-left transition-all hover:border-sage/50 hover:bg-white/60 aura:aura-glass"
    >
      <div className="mb-3 flex items-start justify-between">
        <h3 className="font-display text-2xl font-light text-charcoal">
          {meditation.title}
        </h3>
        <span className="ml-3 shrink-0 rounded-full bg-sage/10 px-2.5 py-0.5 text-xs text-sage">
          {typeInfo.name}
        </span>
      </div>

      <p className="text-sm leading-relaxed text-charcoal/50">
        {meditation.capacity}
      </p>

      <div className="mt-4 flex items-center gap-3 text-xs text-charcoal/30">
        <span>{meditation.duration} min</span>
        <span>·</span>
        <span className="transition-colors group-hover:text-sage">
          Read meditation →
        </span>
      </div>
    </button>
  );
}
