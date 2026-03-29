"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface TimerProps {
  /** Duration in minutes */
  duration: number;
  /** Whether the timer is running */
  isRunning: boolean;
  /** Called to start/stop the timer */
  onToggle?: (running: boolean) => void;
  /** Called when timer completes */
  onComplete?: () => void;
  /** Compact display */
  compact?: boolean;
}

function formatTimer(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function Timer({
  duration,
  isRunning,
  onToggle,
  onComplete,
  compact = false,
}: TimerProps) {
  const totalSeconds = duration * 60;
  const [elapsed, setElapsed] = useState(0);
  const bellRef = useRef<HTMLAudioElement | null>(null);
  const hasPlayedBell = useRef(false);

  useEffect(() => {
    bellRef.current = new Audio("/sounds/bell.wav");
    bellRef.current.volume = 0.6;
  }, []);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (next >= totalSeconds && !hasPlayedBell.current) {
          hasPlayedBell.current = true;
          bellRef.current?.play().catch(() => {});
          onComplete?.();
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, totalSeconds, onComplete]);

  const reset = useCallback(() => {
    setElapsed(0);
    hasPlayedBell.current = false;
  }, []);

  const remaining = Math.max(0, totalSeconds - elapsed);
  const progress = totalSeconds > 0 ? Math.min(elapsed / totalSeconds, 1) : 0;
  const isComplete = elapsed >= totalSeconds;

  function handleClick() {
    if (isComplete) {
      reset();
      return;
    }
    onToggle?.(!isRunning);
  }

  if (compact) {
    return (
      <button
        onClick={handleClick}
        className="flex items-center gap-2 rounded-full px-2 py-1 transition-colors hover:bg-accent/10"
      >
        <span className="text-xs tabular-nums text-ink/40">
          {isComplete ? "Reset" : formatTimer(remaining)}
        </span>
        <div className="h-0.5 w-16 overflow-hidden rounded-full bg-edge">
          <div
            className="h-full rounded-full bg-accent transition-all duration-1000"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        {!isRunning && !isComplete && (
          <span className="text-xs text-accent">▶</span>
        )}
        {isRunning && (
          <span className="text-xs text-ink/30">⏸</span>
        )}
      </button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleClick}
        className="relative flex h-16 w-16 items-center justify-center focus:outline-none"
      >
        <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-edge"
          />
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray={`${2 * Math.PI * 28}`}
            strokeDashoffset={`${2 * Math.PI * 28 * (1 - progress)}`}
            strokeLinecap="round"
            className="text-accent transition-all duration-1000"
          />
        </svg>
        <span className="absolute text-sm tabular-nums font-light text-ink/60">
          {isComplete ? "Reset" : formatTimer(remaining)}
        </span>
      </button>
      <span className="text-xs text-ink/30">
        {isComplete ? "Done" : isRunning ? "Tap to pause" : "Tap to start"}
      </span>
    </div>
  );
}
