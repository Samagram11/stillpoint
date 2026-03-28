"use client";

import { MEDITATION_TYPES } from "@/lib/meditationTypes";
import type { Meditation } from "@/lib/types";

interface MeditationReaderProps {
  meditation: Meditation;
  onBack: () => void;
}

/** Render meditation script with visual markers for pauses, breaths, and bells */
function renderScript(script: string): React.ReactNode[] {
  const parts = script.split(/(\[(?:pause \d+s|breathe|bell)\])/g);

  return parts.map((part, i) => {
    if (/^\[pause \d+s\]$/.test(part)) {
      const seconds = part.match(/\d+/)?.[0];
      return (
        <span
          key={i}
          className="my-4 block text-center text-xs tracking-widest text-sage/60"
        >
          · · · {seconds}s · · ·
        </span>
      );
    }
    if (part === "[breathe]") {
      return (
        <span
          key={i}
          className="my-4 block text-center text-xs tracking-widest text-sage"
        >
          ○ breathe ○
        </span>
      );
    }
    if (part === "[bell]") {
      return (
        <span
          key={i}
          className="my-6 block text-center text-sm tracking-widest text-clay"
        >
          🔔
        </span>
      );
    }
    if (!part.trim()) return null;

    return (
      <span key={i} className="leading-[1.9]">
        {part}
      </span>
    );
  });
}

export default function MeditationReader({
  meditation,
  onBack,
}: MeditationReaderProps) {
  const typeInfo = MEDITATION_TYPES[meditation.type];

  return (
    <div className="fade-in">
      <button
        onClick={onBack}
        className="mb-8 text-sm text-charcoal/30 transition-colors hover:text-charcoal/60"
      >
        ← Back to meditations
      </button>

      <div className="mb-8">
        <span className="mb-2 inline-block rounded-full bg-sage/10 px-2.5 py-0.5 text-xs text-sage">
          {typeInfo.name}
        </span>
        <h2 className="font-display text-4xl font-light text-charcoal">
          {meditation.title}
        </h2>
        <p className="mt-2 text-sm text-charcoal/50">{meditation.capacity}</p>
      </div>

      <div className="font-display text-lg font-light text-charcoal/80">
        {renderScript(meditation.script)}
      </div>

      <div className="mt-12 border-t border-mist pt-6">
        <button
          onClick={onBack}
          className="text-sm text-charcoal/30 transition-colors hover:text-charcoal/60"
        >
          ← Back to meditations
        </button>
      </div>
    </div>
  );
}
