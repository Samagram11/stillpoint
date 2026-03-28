"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface AudioPlayerBaseProps {
  contentType?: string;
}

interface Base64AudioProps extends AudioPlayerBaseProps {
  audioBase64: string;
  script?: never;
}

interface WebSpeechProps extends AudioPlayerBaseProps {
  audioBase64?: never;
  script: string;
}

type AudioPlayerProps = Base64AudioProps | WebSpeechProps;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const SPEEDS = [0.75, 1, 1.25] as const;

/** Strip meditation markers from script for speech synthesis */
function cleanScriptForSpeech(script: string): string {
  return script
    .replace(/\[pause (\d+)s\]/g, (_m, s) => ", " + ".".repeat(Number(s)) + " ")
    .replace(/\[breathe\]/g, ", ... breathe ... ")
    .replace(/\[bell\]/g, "")
    .trim();
}

export default function AudioPlayer(props: AudioPlayerProps) {
  // ElevenLabs base64 audio mode
  if (props.audioBase64) {
    return <Base64Player audioBase64={props.audioBase64} contentType={props.contentType} />;
  }

  // Web Speech API fallback
  return <WebSpeechPlayer script={props.script!} />;
}

function Base64Player({
  audioBase64,
  contentType = "audio/mpeg",
}: {
  audioBase64: string;
  contentType?: string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speedIndex, setSpeedIndex] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const audio = new Audio(`data:${contentType};base64,${audioBase64}`);

    audio.addEventListener("loadedmetadata", () => {
      setDuration(audio.duration);
      setIsLoaded(true);
    });
    audio.addEventListener("timeupdate", () => setCurrentTime(audio.currentTime));
    audio.addEventListener("ended", () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });

    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.removeAttribute("src");
    };
  }, [audioBase64, contentType]);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio || !isLoaded) return;
    if (isPlaying) audio.pause();
    else audio.play();
    setIsPlaying(!isPlaying);
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const audio = audioRef.current;
    if (!audio) return;
    const time = parseFloat(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  }

  function cycleSpeed() {
    const audio = audioRef.current;
    if (!audio) return;
    const next = (speedIndex + 1) % SPEEDS.length;
    setSpeedIndex(next);
    audio.playbackRate = SPEEDS[next];
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <PlayerShell
      isPlaying={isPlaying}
      disabled={!isLoaded}
      currentTime={currentTime}
      duration={duration}
      progress={progress}
      speedIndex={speedIndex}
      onTogglePlay={togglePlay}
      onSeek={handleSeek}
      onCycleSpeed={cycleSpeed}
    />
  );
}

function WebSpeechPlayer({ script }: { script: string }) {
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [supported, setSupported] = useState(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setSupported(false);
      return;
    }

    function loadVoices() {
      const available = speechSynthesis.getVoices().filter(
        (v) => v.lang.startsWith("en")
      );
      setVoices(available);
    }

    loadVoices();
    speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => speechSynthesis.removeEventListener("voiceschanged", loadVoices);
  }, []);

  const togglePlay = useCallback(() => {
    if (!supported) return;

    if (isPlaying) {
      speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    const cleaned = cleanScriptForSpeech(script);
    const utterance = new SpeechSynthesisUtterance(cleaned);
    utterance.rate = 0.85; // Slow, meditative pace
    utterance.pitch = 0.95; // Slightly lower pitch
    utterance.volume = 1;

    if (voices.length > 0 && voices[selectedVoiceIndex]) {
      utterance.voice = voices[selectedVoiceIndex];
    }

    utterance.onend = () => setIsPlaying(false);
    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
    setIsPlaying(true);
  }, [isPlaying, script, supported, voices, selectedVoiceIndex]);

  if (!supported) {
    return (
      <p className="text-center text-xs text-charcoal/30">
        Audio playback not supported in this browser.
      </p>
    );
  }

  return (
    <div className="fade-in space-y-3">
      <div className="rounded-xl border border-mist bg-white/40 p-4">
        <div className="flex items-center gap-4">
          <button
            onClick={togglePlay}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-charcoal text-cream transition-all hover:bg-deep"
          >
            {isPlaying ? (
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 h-4 w-4">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          <div className="flex-1">
            <p className="text-xs text-charcoal/40">
              {isPlaying ? "Playing with browser voice..." : "Browser text-to-speech"}
            </p>
          </div>

          {voices.length > 1 && (
            <select
              value={selectedVoiceIndex}
              onChange={(e) => {
                setSelectedVoiceIndex(Number(e.target.value));
                if (isPlaying) {
                  speechSynthesis.cancel();
                  setIsPlaying(false);
                }
              }}
              className="rounded-lg border border-mist bg-white/50 px-2 py-1 text-xs text-charcoal/60"
            >
              {voices.map((v, i) => (
                <option key={v.name} value={i}>
                  {v.name.replace(/\(.*\)/, "").trim()}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
      <p className="text-center text-xs text-charcoal/25">
        Add an ElevenLabs paid key for higher-quality voices
      </p>
    </div>
  );
}

/** Shared player UI shell for the base64 player */
function PlayerShell({
  isPlaying,
  disabled,
  currentTime,
  duration,
  progress,
  speedIndex,
  onTogglePlay,
  onSeek,
  onCycleSpeed,
}: {
  isPlaying: boolean;
  disabled: boolean;
  currentTime: number;
  duration: number;
  progress: number;
  speedIndex: number;
  onTogglePlay: () => void;
  onSeek: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCycleSpeed: () => void;
}) {
  return (
    <div className="fade-in rounded-xl border border-mist bg-white/40 p-4">
      <div className="flex items-center gap-4">
        <button
          onClick={onTogglePlay}
          disabled={disabled}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-charcoal text-cream transition-all hover:bg-deep disabled:opacity-30"
        >
          {isPlaying ? (
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 h-4 w-4">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <div className="flex flex-1 flex-col gap-1">
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={currentTime}
            onChange={onSeek}
            className="h-1 w-full cursor-pointer appearance-none rounded-full bg-mist accent-sage"
            style={{
              background: `linear-gradient(to right, var(--sage) ${progress}%, var(--mist) ${progress}%)`,
            }}
          />
          <div className="flex justify-between text-xs text-charcoal/30">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <button
          onClick={onCycleSpeed}
          className="shrink-0 rounded-full border border-mist px-2.5 py-1 text-xs text-charcoal/40 transition-colors hover:border-sage hover:text-charcoal/60"
        >
          {SPEEDS[speedIndex]}x
        </button>
      </div>
    </div>
  );
}
