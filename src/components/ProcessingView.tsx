"use client";

import { useEffect, useState } from "react";
import type { ProcessingState } from "@/lib/types";

const STAGE_MESSAGES: Record<ProcessingState["stage"], string> = {
  idle: "",
  parsing: "Reading your story...",
  extracting: "Understanding what you need...",
  generating: "Writing your meditations...",
  complete: "Your meditations are ready.",
  error: "Something went wrong.",
};

interface ProcessingViewProps {
  state: ProcessingState;
  onRetry?: () => void;
}

export default function ProcessingView({ state, onRetry }: ProcessingViewProps) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    if (state.stage === "complete" || state.stage === "error" || state.stage === "idle") {
      setDots("");
      return;
    }

    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 600);

    return () => clearInterval(interval);
  }, [state.stage]);

  const isActive =
    state.stage === "parsing" ||
    state.stage === "extracting" ||
    state.stage === "generating";

  return (
    <div className="fade-in flex flex-col items-center py-12">
      {/* Breathing circle */}
      <div
        className={`h-28 w-28 rounded-full transition-all duration-1000 ${
          state.stage === "error"
            ? "bg-red-200/40"
            : state.stage === "complete"
              ? "bg-accent/30"
              : "bg-accent/20 breathing-circle"
        }`}
      />

      {/* Stage message */}
      <p className="mt-8 font-display text-xl font-light text-ink/70">
        {state.message || STAGE_MESSAGES[state.stage]}
        {isActive && <span className="inline-block w-6 text-left">{dots}</span>}
      </p>

      {/* Progress stages */}
      {isActive && (
        <div className="mt-8 flex items-center gap-3">
          {(["parsing", "extracting", "generating"] as const).map((stage) => {
            const isCurrentOrPast =
              ["parsing", "extracting", "generating"].indexOf(state.stage) >=
              ["parsing", "extracting", "generating"].indexOf(stage);

            return (
              <div
                key={stage}
                className={`h-1.5 w-12 rounded-full transition-all duration-500 ${
                  isCurrentOrPast ? "bg-accent" : "bg-edge"
                }`}
              />
            );
          })}
        </div>
      )}

      {/* Warnings or errors */}
      {state.stage === "error" && (
        <div className="mt-6 text-center">
          <p className="text-sm text-red-500/70">{state.message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-4 rounded-lg border border-edge px-4 py-2 text-sm text-ink/60 transition-colors hover:border-accent hover:text-ink"
            >
              Try again
            </button>
          )}
        </div>
      )}

      {/* Complete state */}
      {state.stage === "complete" && (
        <p className="mt-2 text-sm text-ink/40">
          Scroll down to see your meditations.
        </p>
      )}
    </div>
  );
}
