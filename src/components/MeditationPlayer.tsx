"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MEDITATION_TYPES } from "@/lib/meditationTypes";
import BreathGuide from "@/components/BreathGuide";
import AudioPlayer from "@/components/AudioPlayer";
import Timer from "@/components/Timer";
import type { Meditation } from "@/lib/types";

interface MeditationPlayerProps {
  meditation: Meditation;
  voiceId: string;
  elevenLabsKey?: string;
  onBack: () => void;
  onMeditationUpdate: (updated: Meditation) => void;
}

/** Split script into segments for display and highlighting */
function parseScript(script: string): ScriptSegment[] {
  const parts = script.split(/(\[(?:pause \d+s|breathe|bell)\])/g);
  const segments: ScriptSegment[] = [];

  for (const part of parts) {
    if (!part.trim()) continue;

    if (/^\[pause \d+s\]$/.test(part)) {
      segments.push({ type: "pause", text: part, seconds: Number(part.match(/\d+/)?.[0]) });
    } else if (part === "[breathe]") {
      segments.push({ type: "breathe", text: part });
    } else if (part === "[bell]") {
      segments.push({ type: "bell", text: part });
    } else {
      // Split text into words for highlighting
      const words = part.split(/(\s+)/);
      for (const word of words) {
        if (word.trim()) {
          segments.push({ type: "word", text: word });
        } else if (word) {
          segments.push({ type: "space", text: word });
        }
      }
    }
  }

  return segments;
}

interface ScriptSegment {
  type: "word" | "space" | "pause" | "breathe" | "bell";
  text: string;
  seconds?: number;
}

const SPEEDS = [0.75, 1, 1.25] as const;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function MeditationPlayer({
  meditation,
  voiceId,
  elevenLabsKey,
  onBack,
  onMeditationUpdate,
}: MeditationPlayerProps) {
  const typeInfo = MEDITATION_TYPES[meditation.type];

  // Audio state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bellRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speedIndex, setSpeedIndex] = useState(1);
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);

  // Generation state
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  // UI state
  const [showBreathGuide, setShowBreathGuide] = useState(false);
  const [breathActive, setBreathActive] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // Script
  const segments = useRef(parseScript(meditation.script)).current;
  const scriptContainerRef = useRef<HTMLDivElement>(null);

  const hasAudio = !!meditation.audioBase64;
  const canGenerateAudio = !!elevenLabsKey;

  // Load bell sound
  useEffect(() => {
    bellRef.current = new Audio("/sounds/bell.wav");
    bellRef.current.volume = 0.5;
  }, []);

  // Load audio when available
  useEffect(() => {
    if (!meditation.audioBase64) {
      setIsAudioLoaded(false);
      return;
    }

    const audio = new Audio(`data:audio/mpeg;base64,${meditation.audioBase64}`);

    audio.addEventListener("loadedmetadata", () => {
      setDuration(audio.duration);
      setIsAudioLoaded(true);
    });
    audio.addEventListener("timeupdate", () => setCurrentTime(audio.currentTime));
    audio.addEventListener("ended", () => {
      setIsPlaying(false);
      setCurrentTime(0);
      bellRef.current?.play().catch(() => {});
    });

    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.removeAttribute("src");
    };
  }, [meditation.audioBase64]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !isAudioLoaded) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
      setTimerRunning(true);
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, isAudioLoaded]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const time = parseFloat(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  }, []);

  const cycleSpeed = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const next = (speedIndex + 1) % SPEEDS.length;
    setSpeedIndex(next);
    audio.playbackRate = SPEEDS[next];
  }, [speedIndex]);

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

  // Auto-hide controls after inactivity
  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true);
      return;
    }

    setShowControls(true);
    const timeout = setTimeout(() => setShowControls(false), 4000);
    return () => clearTimeout(timeout);
  }, [isPlaying]);

  const handleInteraction = useCallback(() => {
    setShowControls(true);
  }, []);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-cream transition-colors aura:bg-[#F8F4FF]"
      onMouseMove={handleInteraction}
      onTouchStart={handleInteraction}
    >
      {/* Top bar */}
      <div
        className={`flex items-center justify-between px-6 py-4 transition-opacity duration-500 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-charcoal/40 transition-colors hover:text-charcoal/70"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
            <path d="M19 12H5m0 0l7 7m-7-7l7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>

        <div className="flex items-center gap-3">
          {/* Breath guide toggle */}
          <button
            onClick={() => {
              setShowBreathGuide(!showBreathGuide);
              if (showBreathGuide) setBreathActive(false);
            }}
            className={`rounded-full px-3 py-1.5 text-xs transition-all ${
              showBreathGuide
                ? "bg-sage/20 text-sage"
                : "text-charcoal/30 hover:text-charcoal/50"
            }`}
          >
            Breathe
          </button>

          {/* Timer toggle */}
          <button
            onClick={() => {
              setShowTimer(!showTimer);
              if (showTimer) setTimerRunning(false);
            }}
            className={`rounded-full px-3 py-1.5 text-xs transition-all ${
              showTimer
                ? "bg-sage/20 text-sage"
                : "text-charcoal/30 hover:text-charcoal/50"
            }`}
          >
            Timer
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 flex-col items-center overflow-hidden px-6">
        {/* Header */}
        <div className="mb-6 text-center">
          <span className="mb-2 inline-block rounded-full bg-sage/10 px-2.5 py-0.5 text-xs text-sage">
            {typeInfo.name}
          </span>
          <h2 className="font-display text-3xl font-light text-charcoal sm:text-4xl">
            {meditation.title}
          </h2>
          <p className="mt-2 text-sm text-charcoal/40">
            {meditation.capacity}
          </p>
        </div>

        {/* Breath guide overlay */}
        {showBreathGuide && (
          <div className="mb-6 fade-in">
            <BreathGuide
              active={breathActive}
              compact
              onToggle={setBreathActive}
            />
          </div>
        )}

        {/* Timer overlay */}
        {showTimer && (
          <div className="mb-6 fade-in">
            <Timer
              duration={meditation.duration}
              isRunning={timerRunning}
              compact
              onToggle={setTimerRunning}
              onComplete={() => {
                bellRef.current?.play().catch(() => {});
                setTimerRunning(false);
              }}
            />
          </div>
        )}

        {/* Script text */}
        <div
          ref={scriptContainerRef}
          className="flex-1 overflow-y-auto pb-32 scrollbar-hide"
          style={{ maxWidth: "36rem" }}
        >
          <div className="font-display text-lg font-light leading-[2] text-charcoal/80 sm:text-xl sm:leading-[2.1]">
            {segments.map((seg, i) => {
              if (seg.type === "pause") {
                return (
                  <span
                    key={i}
                    className="my-6 block text-center text-xs tracking-widest text-sage/50"
                  >
                    · · · {seg.seconds}s · · ·
                  </span>
                );
              }
              if (seg.type === "breathe") {
                return (
                  <span
                    key={i}
                    className="my-6 block text-center text-xs tracking-widest text-sage"
                  >
                    ○ breathe ○
                  </span>
                );
              }
              if (seg.type === "bell") {
                return (
                  <span
                    key={i}
                    className="my-8 block text-center text-sm tracking-widest text-clay"
                  >
                    ◊
                  </span>
                );
              }
              if (seg.type === "space") {
                return <span key={i}>{seg.text}</span>;
              }
              // word
              return (
                <span key={i} className="transition-colors duration-200">
                  {seg.text}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom audio controls */}
      <div
        className={`border-t border-mist/50 bg-cream/90 px-6 py-4 backdrop-blur-sm transition-all duration-500 ${
          showControls || !isPlaying ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
        }`}
      >
        {hasAudio ? (
          <div className="mx-auto flex max-w-lg items-center gap-4">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              disabled={!isAudioLoaded}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-charcoal text-cream transition-all hover:bg-deep disabled:opacity-30"
            >
              {isPlaying ? (
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 h-5 w-5">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Seekbar */}
            <div className="flex flex-1 flex-col gap-1">
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                className="h-1 w-full cursor-pointer appearance-none rounded-full bg-mist accent-sage"
                style={{
                  background: `linear-gradient(to right, var(--sage) ${progress}%, ${
                    "var(--mist)"
                  } ${progress}%)`,
                }}
              />
              <div className="flex justify-between text-xs tabular-nums text-charcoal/30">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Speed */}
            <button
              onClick={cycleSpeed}
              className="shrink-0 rounded-full border border-mist px-2.5 py-1 text-xs text-charcoal/40 transition-colors hover:border-sage hover:text-charcoal/60"
            >
              {SPEEDS[speedIndex]}x
            </button>
          </div>
        ) : (
          <div className="mx-auto max-w-lg space-y-3">
            {canGenerateAudio && (
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
                  <p className="text-center text-xs text-red-500/70">{audioError}</p>
                )}
              </div>
            )}
            <AudioPlayer script={meditation.script} />
          </div>
        )}
      </div>
    </div>
  );
}
