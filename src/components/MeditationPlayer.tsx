"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MEDITATION_APPROACHES, LEGACY_MEDITATION_TYPES } from "@/lib/meditationTypes";
import type { LegacyMeditationType, Voice } from "@/lib/types";
import AuraBackground from "@/components/AuraBackground";
import CosmicBackground from "@/components/CosmicBackground";
import SunnyBackground from "@/components/SunnyBackground";
import { getStoredTheme, type Theme } from "@/components/ThemeSelector";
import type { Meditation } from "@/lib/types";

const ALLOWED_BROWSER_VOICES = ["Moira", "Karen", "Daniel", "Rishi", "Tessa"];

interface MeditationPlayerProps {
  meditation: Meditation;
  elevenLabsKey?: string;
  onBack: () => void;
  onMeditationUpdate: (updated: Meditation) => void;
}

// ── Sentence-based script parsing for teleprompter ──

interface SentenceSegment {
  type: "sentence";
  text: string;
  wordCount: number;
  sentenceIndex: number;
}

interface MarkerSegment {
  type: "pause" | "breathe" | "bell";
  text: string;
  seconds?: number;
}

type TeleprompterSegment = SentenceSegment | MarkerSegment;

function parseSentences(script: string): TeleprompterSegment[] {
  const parts = script.split(/(\[(?:pause \d+s|breathe|bell)\])/g);
  const segments: TeleprompterSegment[] = [];
  let sentenceIndex = 0;

  for (const part of parts) {
    if (!part.trim()) continue;

    if (/^\[pause \d+s\]$/.test(part)) {
      segments.push({ type: "pause", text: part, seconds: Number(part.match(/\d+/)?.[0]) });
    } else if (part === "[breathe]") {
      segments.push({ type: "breathe", text: part });
    } else if (part === "[bell]") {
      segments.push({ type: "bell", text: part });
    } else {
      // Split into sentences on . ! ? followed by space or end of string
      const sentences = part.split(/(?<=[.!?])\s+/).filter((s) => s.trim());
      for (const sentence of sentences) {
        const wordCount = sentence.trim().split(/\s+/).length;
        segments.push({
          type: "sentence",
          text: sentence.trim(),
          wordCount,
          sentenceIndex,
        });
        sentenceIndex++;
      }
    }
  }

  return segments;
}

/** Strip meditation markers from script for speech synthesis */
function cleanScriptForSpeech(script: string): string {
  return script
    .replace(/\[pause (\d+)s\]/g, (_m, s) => ", " + ".".repeat(Number(s)) + " ")
    .replace(/\[breathe\]/g, ", ... breathe ... ")
    .replace(/\[bell\]/g, "")
    .trim();
}

interface UnifiedVoice {
  id: string;
  name: string;
  type: "elevenlabs" | "webspeech";
  nativeVoice?: SpeechSynthesisVoice;
}

const SPEEDS = [0.75, 1, 1.25] as const;
const WORDS_PER_SECOND = 3.0; // ~180 wpm — comfortable reading pace

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function MeditationPlayer({
  meditation,
  elevenLabsKey,
  onBack,
  onMeditationUpdate,
}: MeditationPlayerProps) {
  const displayInfo = meditation.approach
    ? MEDITATION_APPROACHES[meditation.approach]
    : meditation.type
      ? LEGACY_MEDITATION_TYPES[meditation.type as LegacyMeditationType] ?? { name: "Meditation" }
      : { name: "Meditation" };

  // Audio state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bellRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speedIndex, setSpeedIndex] = useState(1);
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);

  // Voice state
  const [voices, setVoices] = useState<UnifiedVoice[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState("");
  const [voicesLoaded, setVoicesLoaded] = useState(false);

  // Generation state
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  // Web Speech state
  const [isWebSpeechPlaying, setIsWebSpeechPlaying] = useState(false);

  // Teleprompter state
  const [activeSentenceIndex, setActiveSentenceIndex] = useState(-1);
  const [isReading, setIsReading] = useState(false);
  const readingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // UI state
  const [showControls, setShowControls] = useState(true);
  const [theme, setTheme] = useState<Theme>("minimalist");

  // Script — sentence-based for teleprompter
  const teleprompterSegments = useRef(parseSentences(meditation.script)).current;
  const scriptContainerRef = useRef<HTMLDivElement>(null);

  // Derived: only sentence segments (for timing calculations)
  const sentences = teleprompterSegments.filter(
    (s): s is SentenceSegment => s.type === "sentence"
  );
  const totalSentences = sentences.length;

  // Don't send sentinel values as real API keys — server routes use process.env
  const realApiKey = elevenLabsKey && elevenLabsKey !== "server-provided" ? elevenLabsKey : undefined;

  const selectedVoice = voices.find((v) => v.id === selectedVoiceId);
  const isElevenLabs = selectedVoice?.type === "elevenlabs";
  const hasAudio = !!meditation.audioBase64;
  const audioMatchesVoice = hasAudio && meditation.voiceId === selectedVoiceId;

  // Track theme
  useEffect(() => {
    setTheme(getStoredTheme());
    function handleThemeChange(e: Event) {
      setTheme((e as CustomEvent).detail as Theme);
    }
    window.addEventListener("theme-change", handleThemeChange);
    return () => window.removeEventListener("theme-change", handleThemeChange);
  }, []);

  // Load bell sound
  useEffect(() => {
    bellRef.current = new Audio("/sounds/bell.wav");
    bellRef.current.volume = 0.5;
  }, []);

  // Fetch voices — ElevenLabs if key provided, otherwise Web Speech
  useEffect(() => {
    let cancelled = false;

    async function loadVoices() {
      if (elevenLabsKey) {
        try {
          const res = await fetch("/api/voices", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ apiKey: realApiKey }),
          });
          if (res.ok && !cancelled) {
            const data = await res.json();
            if (data.voices?.length > 0) {
              const mapped: UnifiedVoice[] = data.voices.map((v: Voice) => ({
                id: v.id,
                name: v.name,
                type: "elevenlabs" as const,
              }));
              setVoices(mapped);
              setSelectedVoiceId(mapped[0].id);
              setVoicesLoaded(true);
              return;
            }
          }
        } catch {
          // Fall through to web speech
        }
      }

      // Web Speech fallback
      if (typeof window === "undefined" || !window.speechSynthesis) {
        if (!cancelled) setVoicesLoaded(true);
        return;
      }

      function loadBrowserVoices() {
        if (cancelled) return;
        const available = speechSynthesis.getVoices().filter((v) =>
          ALLOWED_BROWSER_VOICES.some((name) => v.name.includes(name))
        );
        const mapped: UnifiedVoice[] = available.map((v) => ({
          id: `webspeech:${v.name}`,
          name: v.name.replace(/\(.*\)/, "").trim(),
          type: "webspeech" as const,
          nativeVoice: v,
        }));
        if (mapped.length > 0) {
          setVoices(mapped);
          setSelectedVoiceId(mapped[0].id);
        }
        setVoicesLoaded(true);
      }

      loadBrowserVoices();
      speechSynthesis.addEventListener("voiceschanged", loadBrowserVoices);
      return () => speechSynthesis.removeEventListener("voiceschanged", loadBrowserVoices);
    }

    loadVoices();
    return () => { cancelled = true; };
  }, [elevenLabsKey]);

  // Load ElevenLabs audio when available
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
      setActiveSentenceIndex(-1);
      bellRef.current?.play().catch(() => {});
    });

    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.removeAttribute("src");
    };
  }, [meditation.audioBase64]);

  // ── Teleprompter: ElevenLabs audio time-based sentence sync ──
  useEffect(() => {
    if (!isPlaying || !isElevenLabs || !audioMatchesVoice || duration === 0) return;

    // Estimate sentence timings proportionally by word count
    const totalWords = sentences.reduce((sum, s) => sum + s.wordCount, 0);
    let cumWords = 0;
    const timings = sentences.map((s) => {
      const start = (cumWords / totalWords) * duration;
      cumWords += s.wordCount;
      const end = (cumWords / totalWords) * duration;
      return { start, end, index: s.sentenceIndex };
    });

    const interval = setInterval(() => {
      const t = audioRef.current?.currentTime ?? 0;
      const active = timings.find((tm) => t >= tm.start && t < tm.end);
      if (active) {
        setActiveSentenceIndex(active.index);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [isPlaying, isElevenLabs, audioMatchesVoice, duration, sentences]);

  // ── Teleprompter: reading mode auto-advance ──
  useEffect(() => {
    if (!isReading) return;

    function advanceSentence(idx: number) {
      if (idx >= totalSentences) {
        // Done reading
        setIsReading(false);
        setIsPlaying(false);
        setActiveSentenceIndex(-1);
        bellRef.current?.play().catch(() => {});
        return;
      }

      setActiveSentenceIndex(sentences[idx].sentenceIndex);

      // Check if next teleprompter segment after this sentence is a marker
      const teleIdx = teleprompterSegments.findIndex(
        (s) => s.type === "sentence" && (s as SentenceSegment).sentenceIndex === sentences[idx].sentenceIndex
      );
      let extraDelay = 0;
      // Look ahead for pause/breathe markers before the next sentence
      for (let i = teleIdx + 1; i < teleprompterSegments.length; i++) {
        const seg = teleprompterSegments[i];
        if (seg.type === "sentence") break;
        if (seg.type === "pause" && seg.seconds) extraDelay += seg.seconds * 1000;
        if (seg.type === "breathe") extraDelay += 4000;
      }

      const readTime = (sentences[idx].wordCount / WORDS_PER_SECOND) * 1000;
      readingTimerRef.current = setTimeout(
        () => advanceSentence(idx + 1),
        readTime + extraDelay
      );
    }

    advanceSentence(0);

    return () => {
      if (readingTimerRef.current) clearTimeout(readingTimerRef.current);
    };
  }, [isReading, totalSentences, sentences, teleprompterSegments]);

  // ── Teleprompter: auto-scroll active sentence into view ──
  useEffect(() => {
    if (activeSentenceIndex < 0) return;
    const el = scriptContainerRef.current?.querySelector(
      `[data-sentence="${activeSentenceIndex}"]`
    );
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeSentenceIndex]);

  // Generate ElevenLabs audio
  const generateAudio = useCallback(async (voiceId: string) => {
    setIsGeneratingAudio(true);
    setAudioError(null);

    try {
      const response = await fetch("/api/generate-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          script: meditation.script,
          voiceId,
          apiKey: realApiKey,
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
  }, [meditation, elevenLabsKey, onMeditationUpdate]);

  // Unified play/pause
  const togglePlay = useCallback(() => {
    // If reading mode is active, stop it
    if (isReading) {
      setIsReading(false);
      setIsPlaying(false);
      setActiveSentenceIndex(-1);
      if (readingTimerRef.current) clearTimeout(readingTimerRef.current);
      return;
    }

    if (!selectedVoice) {
      // No voice available — start reading mode
      setIsReading(true);
      setIsPlaying(true);
      return;
    }

    if (selectedVoice.type === "elevenlabs") {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
        return;
      }

      if (audioMatchesVoice && isAudioLoaded) {
        audioRef.current?.play();
        setIsPlaying(true);
      } else if (!isGeneratingAudio) {
        generateAudio(selectedVoice.id);
      }
    } else {
      // Web Speech mode
      if (isWebSpeechPlaying) {
        speechSynthesis.cancel();
        setIsWebSpeechPlaying(false);
        setIsPlaying(false);
        setActiveSentenceIndex(-1);
        return;
      }

      const cleaned = cleanScriptForSpeech(meditation.script);
      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.rate = 0.85;
      utterance.pitch = 0.95;
      utterance.volume = 1;

      if (selectedVoice.nativeVoice) {
        utterance.voice = selectedVoice.nativeVoice;
      }

      // Web Speech boundary events for teleprompter
      // Build a mapping from character offset to sentence index
      const charToSentence: Array<{ charStart: number; charEnd: number; sentenceIndex: number }> = [];
      let charOffset = 0;
      const cleanedSentences = cleaned.split(/(?<=[.!?])\s+/).filter((s) => s.trim());
      for (let i = 0; i < cleanedSentences.length && i < totalSentences; i++) {
        const start = charOffset;
        charOffset += cleanedSentences[i].length + 1; // +1 for space
        charToSentence.push({ charStart: start, charEnd: charOffset, sentenceIndex: i });
      }

      utterance.onboundary = (event) => {
        const ci = event.charIndex;
        const match = charToSentence.find((m) => ci >= m.charStart && ci < m.charEnd);
        if (match) {
          setActiveSentenceIndex(match.sentenceIndex);
        }
      };

      utterance.onend = () => {
        setIsWebSpeechPlaying(false);
        setIsPlaying(false);
        setActiveSentenceIndex(-1);
        bellRef.current?.play().catch(() => {});
      };

      speechSynthesis.speak(utterance);
      setIsWebSpeechPlaying(true);
      setIsPlaying(true);
      setActiveSentenceIndex(0);
    }
  }, [selectedVoice, isPlaying, isReading, isWebSpeechPlaying, audioMatchesVoice, isAudioLoaded, isGeneratingAudio, generateAudio, meditation.script, totalSentences]);

  // Auto-play after ElevenLabs audio generation completes
  useEffect(() => {
    if (isAudioLoaded && isGeneratingAudio === false && audioMatchesVoice && !isPlaying) {
      audioRef.current?.play();
      setIsPlaying(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAudioLoaded]);

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

  // Stop web speech / reading when voice changes
  const handleVoiceChange = useCallback((newVoiceId: string) => {
    if (isWebSpeechPlaying) {
      speechSynthesis.cancel();
      setIsWebSpeechPlaying(false);
      setIsPlaying(false);
    }
    if (isReading) {
      setIsReading(false);
      setIsPlaying(false);
      if (readingTimerRef.current) clearTimeout(readingTimerRef.current);
    }
    setActiveSentenceIndex(-1);
    setSelectedVoiceId(newVoiceId);
  }, [isWebSpeechPlaying, isReading]);

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
  const showSeekbar = isElevenLabs && audioMatchesVoice;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-surface transition-colors"
      onMouseMove={handleInteraction}
      onTouchStart={handleInteraction}
    >
      {theme === "aura" && <AuraBackground />}
      {theme === "cosmic" && <CosmicBackground />}
      {theme === "sunny" && <SunnyBackground />}

      {/* Top bar */}
      <div
        className={`flex items-center justify-between px-6 py-4 transition-opacity duration-500 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-ink/40 transition-colors hover:text-ink/70"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
            <path d="M19 12H5m0 0l7 7m-7-7l7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>

        {/* Voice dropdown */}
        {voicesLoaded && voices.length > 0 && (
          <select
            value={selectedVoiceId}
            onChange={(e) => handleVoiceChange(e.target.value)}
            className="rounded-lg border border-edge bg-white/40 px-3 py-1.5 text-xs text-ink/60 backdrop-blur-sm transition-colors focus:border-accent focus:outline-none"
          >
            {voices.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Main content area */}
      <div className="flex flex-1 flex-col items-center overflow-hidden px-6">
        {/* Header */}
        <div className="mb-6 text-center">
          <span className="mb-2 inline-block rounded-full bg-accent/10 px-2.5 py-0.5 text-xs text-accent">
            {displayInfo.name}
          </span>
          <h2 className="font-display text-3xl font-light text-ink sm:text-4xl">
            {meditation.title}
          </h2>
          <p className="mt-2 text-sm text-ink/40">
            {meditation.capacity}
          </p>
        </div>

        {/* Script text — teleprompter with sentence highlighting */}
        <div
          ref={scriptContainerRef}
          className="flex-1 overflow-y-auto pb-32 scrollbar-hide"
          style={{ maxWidth: "36rem" }}
        >
          <div className="font-display text-lg font-light leading-[2] sm:text-xl sm:leading-[2.1]">
            {teleprompterSegments.map((seg, i) => {
              if (seg.type === "pause") {
                return (
                  <span
                    key={i}
                    className="my-6 block text-center text-xs tracking-widest text-accent/50"
                  >
                    · · · {seg.seconds}s · · ·
                  </span>
                );
              }
              if (seg.type === "breathe") {
                return (
                  <span
                    key={i}
                    className="my-6 block text-center text-xs tracking-widest text-accent"
                  >
                    ○ breathe ○
                  </span>
                );
              }
              if (seg.type === "bell") {
                return (
                  <span
                    key={i}
                    className="my-8 block text-center text-sm tracking-widest text-warm"
                  >
                    ◊
                  </span>
                );
              }
              // Sentence
              if (seg.type !== "sentence") return null;
              const si = seg.sentenceIndex;
              const isActive = activeSentenceIndex >= 0;
              let colorClass = "text-ink/80"; // default: no teleprompter active
              if (isActive) {
                if (si === activeSentenceIndex) {
                  colorClass = "text-ink";
                } else if (si < activeSentenceIndex) {
                  colorClass = "text-ink/30";
                } else {
                  colorClass = "text-ink/50";
                }
              }

              return (
                <span
                  key={i}
                  data-sentence={si}
                  className={`transition-colors duration-500 ${colorClass}`}
                >
                  {seg.text}{" "}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom audio controls */}
      <div
        className={`border-t border-edge/50 bg-surface/90 px-6 py-4 backdrop-blur-sm transition-all duration-500 ${
          showControls || !isPlaying ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
        }`}
      >
        <div className="mx-auto flex max-w-lg items-center gap-4">
          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            disabled={isGeneratingAudio}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink text-surface transition-all hover:bg-emphasis disabled:opacity-30"
          >
            {isGeneratingAudio ? (
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 animate-spin">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="31.4" strokeDashoffset="10" strokeLinecap="round" />
              </svg>
            ) : isPlaying ? (
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

          {showSeekbar ? (
            <>
              {/* Seekbar — only for ElevenLabs audio */}
              <div className="flex flex-1 flex-col gap-1">
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  step={0.1}
                  value={currentTime}
                  onChange={handleSeek}
                  className="h-1 w-full cursor-pointer appearance-none rounded-full bg-edge accent-accent"
                  style={{
                    background: `linear-gradient(to right, var(--accent) ${progress}%, var(--edge) ${progress}%)`,
                  }}
                />
                <div className="flex justify-between text-xs tabular-nums text-ink/30">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Speed */}
              <button
                onClick={cycleSpeed}
                className="shrink-0 rounded-full border border-edge px-2.5 py-1 text-xs text-ink/40 transition-colors hover:border-accent hover:text-ink/60"
              >
                {SPEEDS[speedIndex]}x
              </button>
            </>
          ) : (
            <div className="flex-1">
              <p className="text-xs text-ink/40">
                {isGeneratingAudio
                  ? "Generating audio..."
                  : isReading
                    ? "Reading..."
                    : isPlaying
                      ? `Playing with ${selectedVoice?.name ?? "browser voice"}...`
                      : voices.length > 0
                        ? "Press play to listen"
                        : "Press play to read"}
              </p>
              {audioError && (
                <p className="mt-1 text-xs text-red-500/70">{audioError}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
