"use client";

import { useState, useEffect, useCallback } from "react";

type BreathPhase = "idle" | "inhale" | "hold1" | "exhale" | "hold2";

const PHASE_DURATIONS: Record<Exclude<BreathPhase, "idle">, number> = {
  inhale: 4,
  hold1: 4,
  exhale: 4,
  hold2: 4,
};

const PHASE_LABELS: Record<BreathPhase, string> = {
  idle: "Begin",
  inhale: "Breathe in",
  hold1: "Hold",
  exhale: "Breathe out",
  hold2: "Hold",
};

interface BreathGuideProps {
  /** Whether the guide is actively running */
  active?: boolean;
  /** Compact mode for embedding in player */
  compact?: boolean;
  onToggle?: (active: boolean) => void;
}

export default function BreathGuide({
  active: controlledActive,
  compact = false,
  onToggle,
}: BreathGuideProps) {
  const [internalActive, setInternalActive] = useState(false);
  const active = controlledActive ?? internalActive;

  const [phase, setPhase] = useState<BreathPhase>("idle");
  const [countdown, setCountdown] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);

  const toggle = useCallback(() => {
    const next = !active;
    if (onToggle) onToggle(next);
    else setInternalActive(next);

    if (next) {
      setPhase("inhale");
      setCountdown(PHASE_DURATIONS.inhale);
      setCycleCount(0);
    } else {
      setPhase("idle");
      setCountdown(0);
    }
  }, [active, onToggle]);

  useEffect(() => {
    if (!active || phase === "idle") return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Advance to next phase
          if (phase === "inhale") {
            setPhase("hold1");
            return PHASE_DURATIONS.hold1;
          } else if (phase === "hold1") {
            setPhase("exhale");
            return PHASE_DURATIONS.exhale;
          } else if (phase === "exhale") {
            setPhase("hold2");
            return PHASE_DURATIONS.hold2;
          } else {
            // hold2 complete — new cycle
            setPhase("inhale");
            setCycleCount((c) => c + 1);
            return PHASE_DURATIONS.inhale;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [active, phase]);

  // Circle scale based on phase
  const getScale = () => {
    if (phase === "idle") return 1;
    if (phase === "inhale") {
      const progress = 1 - countdown / PHASE_DURATIONS.inhale;
      return 1 + progress * 0.4;
    }
    if (phase === "hold1") return 1.4;
    if (phase === "exhale") {
      const progress = 1 - countdown / PHASE_DURATIONS.exhale;
      return 1.4 - progress * 0.4;
    }
    // hold2
    return 1;
  };

  const getOpacity = () => {
    if (phase === "idle") return 0.3;
    if (phase === "inhale") return 0.4 + (1 - countdown / PHASE_DURATIONS.inhale) * 0.4;
    if (phase === "hold1") return 0.8;
    if (phase === "exhale") return 0.8 - (1 - countdown / PHASE_DURATIONS.exhale) * 0.4;
    // hold2
    return 0.4;
  };

  const circleSize = compact ? "h-20 w-20" : "h-32 w-32";
  const textSize = compact ? "text-xs" : "text-sm";
  const countdownSize = compact ? "text-lg" : "text-2xl";

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={toggle}
        className="group relative flex items-center justify-center focus:outline-none"
        aria-label={active ? "Stop breathing guide" : "Start breathing guide"}
      >
        <div
          className={`${circleSize} rounded-full bg-sage transition-all duration-1000 ease-in-out`}
          style={{
            transform: `scale(${getScale()})`,
            opacity: getOpacity(),
          }}
        />
        <div className="absolute flex flex-col items-center">
          {phase === "idle" ? (
            <span className={`${textSize} text-charcoal/60`}>
              Box
            </span>
          ) : (
            <span className={`${countdownSize} font-light text-charcoal/80`}>
              {countdown}
            </span>
          )}
        </div>
      </button>

      <span className={`${textSize} font-light tracking-wide text-charcoal/50`}>
        {PHASE_LABELS[phase]}
        {active && cycleCount > 0 && phase === "inhale" && countdown === PHASE_DURATIONS.inhale && (
          <span className="ml-2 text-charcoal/30">· cycle {cycleCount + 1}</span>
        )}
      </span>
    </div>
  );
}
