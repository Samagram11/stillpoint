"use client";

import { useState, useEffect } from "react";
import type { Voice } from "@/lib/types";

interface VoiceSelectorProps {
  selectedVoiceId: string;
  onSelect: (voiceId: string) => void;
  elevenLabsKey?: string;
}

export default function VoiceSelector({
  selectedVoiceId,
  onSelect,
  elevenLabsKey,
}: VoiceSelectorProps) {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customId, setCustomId] = useState("");

  // Try to fetch voices, but gracefully fall back if it fails
  useEffect(() => {
    async function fetchVoices() {
      try {
        const res = await fetch("/api/voices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey: elevenLabsKey }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.voices?.length > 0) {
            setVoices(data.voices);
            // Auto-select first if nothing selected
            if (!selectedVoiceId) {
              onSelect(data.voices[0].id);
            }
          }
        }
      } catch {
        // Voice fetching is optional — fall back to custom ID input
      } finally {
        setLoaded(true);
      }
    }

    fetchVoices();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elevenLabsKey]);

  // If no voice selected yet and fetch didn't return any, auto-select default
  useEffect(() => {
    if (loaded && voices.length === 0 && !selectedVoiceId) {
      // ElevenLabs default "Rachel" — works for TTS even if voice listing fails
      onSelect("21m00Tcm4TlvDq8ikWAM");
    }
  }, [loaded, voices.length, selectedVoiceId, onSelect]);

  if (!loaded) {
    return <div className="text-xs text-charcoal/30 dark:text-cream/30">Loading voices...</div>;
  }

  const isCustomSelected =
    selectedVoiceId && !voices.some((v) => v.id === selectedVoiceId);

  return (
    <div className="fade-in space-y-3">
      <label className="block text-xs font-medium text-charcoal/50 dark:text-cream/50">
        Voice
      </label>

      <div className="flex flex-wrap gap-2">
        {voices.map((voice) => (
          <button
            key={voice.id}
            onClick={() => onSelect(voice.id)}
            className={`rounded-full border px-3 py-1.5 text-xs transition-all ${
              selectedVoiceId === voice.id
                ? "border-sage bg-sage/10 text-sage dark:bg-sage/20"
                : "border-mist text-charcoal/40 hover:border-sage/40 hover:text-charcoal/60 dark:border-cream/10 dark:text-cream/40 dark:hover:text-cream/60"
            }`}
            title={voice.description}
          >
            {voice.name}
          </button>
        ))}

        {/* If no voices loaded, show a default option */}
        {voices.length === 0 && (
          <span className="rounded-full border border-sage bg-sage/10 px-3 py-1.5 text-xs text-sage">
            Default voice
          </span>
        )}

        <button
          onClick={() => setShowCustom(!showCustom)}
          className={`rounded-full border px-3 py-1.5 text-xs transition-all ${
            isCustomSelected && customId
              ? "border-sage bg-sage/10 text-sage dark:bg-sage/20"
              : "border-mist text-charcoal/40 hover:border-sage/40 hover:text-charcoal/60 dark:border-cream/10 dark:text-cream/40 dark:hover:text-cream/60"
          }`}
        >
          Custom ID
        </button>
      </div>

      {showCustom && (
        <div className="fade-in flex gap-2">
          <input
            type="text"
            value={customId}
            onChange={(e) => setCustomId(e.target.value)}
            placeholder="ElevenLabs Voice ID"
            className="flex-1 rounded-lg border border-mist bg-white/50 px-3 py-2 text-xs transition-colors placeholder:text-charcoal/30 focus:border-sage focus:outline-none dark:border-cream/10 dark:bg-cream/5 dark:text-cream dark:placeholder:text-cream/30"
          />
          <button
            onClick={() => {
              if (customId.trim()) onSelect(customId.trim());
            }}
            disabled={!customId.trim()}
            className="rounded-lg bg-charcoal px-3 py-2 text-xs text-cream transition-all hover:bg-deep disabled:opacity-30 dark:bg-cream dark:text-deep dark:hover:bg-cream/80"
          >
            Use
          </button>
        </div>
      )}
    </div>
  );
}
