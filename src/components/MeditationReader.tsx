"use client";

import { useState, useCallback } from "react";
import { MEDITATION_TYPES } from "@/lib/meditationTypes";
import AudioPlayer from "@/components/AudioPlayer";
import type { Meditation } from "@/lib/types";

interface MeditationReaderProps {
  meditation: Meditation;
  voiceId: string;
  elevenLabsKey?: string;
  onBack: () => void;
  onMeditationUpdate: (updated: Meditation) => void;
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
  voiceId,
  elevenLabsKey,
  onBack,
  onMeditationUpdate,
}: MeditationReaderProps) {
  const typeInfo = MEDITATION_TYPES[meditation.type];
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  const hasAudio = !!meditation.audioBase64;
  const canGenerateAudio = !!elevenLabsKey || hasAudio;

  const generateAudio = useCallback(async () => {
    setIsGeneratingAudio(true);
    setAudioError(null);

    try {
      const response = await fetch("/api/generate-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          script: meditation.script,
          voiceId,
          apiKey: elevenLabsKey,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        setAudioError(err.error ?? "Failed to generate audio.");
        return;
      }

      const result = await response.json();

      // Update meditation with audio
      onMeditationUpdate({
        ...meditation,
        audioBase64: result.audioBase64,
        voiceId,
      });
    } catch {
      setAudioError("Network error generating audio.");
    } finally {
      setIsGeneratingAudio(false);
    }
  }, [meditation, voiceId, elevenLabsKey, onMeditationUpdate]);

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

      {/* Audio section */}
      <div className="mb-8">
        {hasAudio ? (
          <AudioPlayer audioBase64={meditation.audioBase64!} />
        ) : canGenerateAudio ? (
          <div className="space-y-2">
            <button
              onClick={generateAudio}
              disabled={isGeneratingAudio}
              className="w-full rounded-xl border border-mist bg-white/40 px-4 py-3 text-sm text-charcoal/60 transition-all hover:border-sage hover:text-charcoal disabled:opacity-50"
            >
              {isGeneratingAudio
                ? "Generating audio..."
                : "Generate with ElevenLabs voice"}
            </button>
            {audioError && (
              <p className="text-center text-xs text-red-500/70">
                {audioError}
              </p>
            )}
            <div className="pt-2">
              <p className="mb-2 text-center text-xs text-charcoal/30">or listen with browser voice</p>
              <AudioPlayer script={meditation.script} />
            </div>
          </div>
        ) : (
          <AudioPlayer script={meditation.script} />
        )}
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
