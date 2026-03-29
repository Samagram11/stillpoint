"use client";

import { useState, useEffect, useCallback } from "react";
import ApiKeySetup from "@/components/ApiKeySetup";
import UploadZone from "@/components/UploadZone";
import ProcessingView from "@/components/ProcessingView";
import MeditationCard from "@/components/MeditationCard";
import MeditationPlayer from "@/components/MeditationPlayer";
import VoiceSelector from "@/components/VoiceSelector";
import ThemeSelector from "@/components/ThemeSelector";
import AuraBackground from "@/components/AuraBackground";
import CosmicBackground from "@/components/CosmicBackground";
import SunnyBackground from "@/components/SunnyBackground";
import { getStoredTheme, type Theme } from "@/components/ThemeSelector";
import type { ApiKeyConfig, ProcessingState, Meditation, MeditationApproach } from "@/lib/types";
// voices.ts kept for reference; VoiceSelector now fetches live from ElevenLabs API
import { parseExport } from "@/lib/parseExport";
import { formatExcerptsForExtraction } from "@/lib/extractCapacities";
import {
  selectCapacities,
  type ExtractionResult,
} from "@/lib/generateMeditation";

type Step = "keys" | "upload" | "processing" | "gallery" | "reader";

export default function Home() {
  const [step, setStep] = useState<Step>("keys");
  const [apiKeys, setApiKeys] = useState<ApiKeyConfig | null>(null);
  const [processing, setProcessing] = useState<ProcessingState>({
    stage: "idle",
    message: "",
  });
  const [meditations, setMeditations] = useState<Meditation[]>([]);
  const [selectedMeditation, setSelectedMeditation] =
    useState<Meditation | null>(null);
  const [serverHasKeys, setServerHasKeys] = useState(false);
  const [selectedVoiceId, setSelectedVoiceId] = useState("");
  const [hasElevenLabsKey, setHasElevenLabsKey] = useState(false);
  const [theme, setTheme] = useState<Theme>("minimalist");
  const [importDate, setImportDate] = useState<string | null>(null);

  // Listen for theme changes
  useEffect(() => {
    function handleThemeChange(e: Event) {
      setTheme((e as CustomEvent).detail as Theme);
    }
    window.addEventListener("theme-change", handleThemeChange);
    return () => window.removeEventListener("theme-change", handleThemeChange);
  }, []);

  // Restore state from localStorage on mount + check server config
  useEffect(() => {
    setTheme(getStoredTheme());

    async function init() {
      // Check if server has API keys configured (personal deploy)
      try {
        const configRes = await fetch("/api/config");
        if (configRes.ok) {
          const config = await configRes.json();
          if (config.hasAnthropicKey) {
            setServerHasKeys(true);
            if (config.hasElevenLabsKey) setHasElevenLabsKey(true);
            // Server has keys — skip BYOK, use a placeholder config
            setApiKeys({ anthropicKey: "server-provided" });

            // Check for cached meditations
            const storedMeditations = localStorage.getItem(
              "stillpoint-meditations"
            );
            if (storedMeditations) {
              const parsed = JSON.parse(storedMeditations) as Meditation[];
              if (parsed.length > 0) {
                setMeditations(parsed);
                setImportDate(localStorage.getItem("stillpoint-import-date"));
                setStep("gallery");
                return;
              }
            }

            setStep("upload");
            return;
          }
        }
      } catch {
        // Config endpoint unavailable — fall through to BYOK
      }

      // BYOK mode: check localStorage for saved keys
      const storedKeys = localStorage.getItem("stillpoint-keys");
      if (storedKeys) {
        try {
          const config = JSON.parse(storedKeys) as ApiKeyConfig;
          if (config.anthropicKey) {
            setApiKeys(config);
            if (config.elevenLabsKey) setHasElevenLabsKey(true);

            const storedMeditations = localStorage.getItem(
              "stillpoint-meditations"
            );
            if (storedMeditations) {
              const parsed = JSON.parse(storedMeditations) as Meditation[];
              if (parsed.length > 0) {
                setMeditations(parsed);
                setImportDate(localStorage.getItem("stillpoint-import-date"));
                setStep("gallery");
                return;
              }
            }

            setStep("upload");
          }
        } catch {
          // Corrupted — start fresh
        }
      }
    }

    init();
  }, []);

  const generateMeditations = useCallback(
    async (
      extraction: ExtractionResult,
      keys: ApiKeyConfig
    ): Promise<void> => {
      setProcessing({
        stage: "generating",
        message: "Writing your meditations...",
      });

      const capacities = selectCapacities(extraction, 5);
      const generated: Meditation[] = [];

      // Generate meditations sequentially to avoid rate limits
      for (const cap of capacities) {
        try {
          const response = await fetch("/api/generate-meditation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              apiKey: keys.anthropicKey,
              approach: cap.recommended_approach,
              capacity: cap.capacity,
              capacityDescription: cap.description,
              meditationSeed: cap.meditation_seed,
              emotionalTone: extraction.emotional_tone,
              bodyContext: extraction.body_context,
              strengthSignals: extraction.strength_signals,
            }),
          });

          if (!response.ok) {
            const err = await response.json();
            if (err.error?.includes("Invalid Anthropic API key")) {
              setProcessing({ stage: "error", message: err.error });
              return;
            }
            continue;
          }

          const result = await response.json();

          generated.push({
            id: `${cap.recommended_approach}-${Date.now()}`,
            title: result.title,
            approach: cap.recommended_approach as MeditationApproach,
            capacity: result.description,
            script: result.script,
            duration: 5,
            createdAt: new Date().toISOString(),
          });

          setProcessing({
            stage: "generating",
            message: `Writing your meditations... (${generated.length}/${capacities.length})`,
          });
        } catch {
          continue;
        }
      }

      if (generated.length === 0) {
        setProcessing({
          stage: "error",
          message: "Could not generate any meditations. Please try again.",
        });
        return;
      }

      // Cache meditations and import timestamp
      localStorage.setItem(
        "stillpoint-meditations",
        JSON.stringify(generated)
      );
      const now = new Date().toISOString();
      localStorage.setItem("stillpoint-import-date", now);

      setMeditations(generated);
      setImportDate(now);
      setProcessing({ stage: "complete", message: "Your meditations are ready." });
      setStep("gallery");
    },
    []
  );

  const runPipeline = useCallback(
    async (rawData: Record<string, unknown>[]) => {
      if (!apiKeys) return;

      setStep("processing");

      // Stage 1: Parse
      setProcessing({ stage: "parsing", message: "Reading your story..." });
      const parsed = parseExport(rawData);

      if (parsed.excerpts.length === 0) {
        setProcessing({
          stage: "error",
          message:
            parsed.warnings[0] ?? "No usable conversation content found.",
        });
        return;
      }

      // Stage 2: Extract themes
      setProcessing({
        stage: "extracting",
        message: "Understanding what you need...",
      });

      try {
        const formatted = formatExcerptsForExtraction(parsed.excerpts);
        const response = await fetch("/api/extract-themes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            excerpts: formatted,
            apiKey: apiKeys.anthropicKey,
          }),
        });

        if (!response.ok) {
          const err = await response.json();
          setProcessing({
            stage: "error",
            message: err.error ?? "Failed to extract themes.",
          });
          return;
        }

        const extraction = (await response.json()) as ExtractionResult;
        localStorage.setItem(
          "stillpoint-extraction",
          JSON.stringify(extraction)
        );

        // Stage 3: Generate meditations
        await generateMeditations(extraction, apiKeys);
      } catch {
        setProcessing({
          stage: "error",
          message:
            "Network error. Please check your connection and try again.",
        });
      }
    },
    [apiKeys, generateMeditations]
  );

  function handleKeysComplete(config: ApiKeyConfig) {
    setApiKeys(config);
    setStep("upload");
  }

  function handleFileLoaded(data: Record<string, unknown>[]) {
    runPipeline(data);
  }

  function handleRetry() {
    setStep("upload");
  }

  function handleClearData() {
    localStorage.removeItem("stillpoint-keys");
    localStorage.removeItem("stillpoint-conversations");
    localStorage.removeItem("stillpoint-meditations");
    localStorage.removeItem("stillpoint-extraction");
    localStorage.removeItem("stillpoint-import-date");
    setMeditations([]);
    setImportDate(null);
    setSelectedMeditation(null);
    setProcessing({ stage: "idle", message: "" });

    if (serverHasKeys) {
      // Server has keys — just go back to upload
      setStep("upload");
    } else {
      setApiKeys(null);
      setStep("keys");
    }
  }

  function handleSelectMeditation(meditation: Meditation) {
    setSelectedMeditation(meditation);
    setStep("reader");
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center">
      {theme === "aura" && <AuraBackground />}
      {theme === "cosmic" && <CosmicBackground />}
      {theme === "sunny" && <SunnyBackground />}

      {/* Header — always visible except in player */}
      {step !== "reader" && (
        <div className="mb-8 sm:mb-12 text-center fade-in">
          <div className="flex justify-end mb-4">
            <ThemeSelector />
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-light tracking-tight text-ink">
            stillpoint
          </h1>
          <p className="mt-3 text-sm text-ink/50">
            Your conversations, transformed into meditations.
          </p>
        </div>
      )}

      {/* Steps */}
      <div className={step === "reader" ? "w-full" : "w-full max-w-md"}>
        {step === "keys" && (
          <ApiKeySetup
            onComplete={handleKeysComplete}
            initialConfig={apiKeys ?? undefined}
          />
        )}

        {step === "upload" && (
          <div className="space-y-6 fade-in">
            <UploadZone onFileLoaded={handleFileLoaded} />
            <details className="text-xs text-ink/40">
              <summary className="cursor-pointer hover:text-ink/60 transition-colors">
                How to export from Claude
              </summary>
              <ol className="mt-2 space-y-1 pl-4 list-decimal text-ink/40">
                <li>
                  Go to{" "}
                  <a
                    href="https://claude.ai/settings"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-ink/60"
                  >
                    claude.ai/settings
                  </a>
                </li>
                <li>Click &quot;Export Data&quot;</li>
                <li>Check your email for the download link</li>
                <li>Download the ZIP and drop it here</li>
              </ol>
            </details>
            <div className="flex items-center justify-between">
              {!serverHasKeys && (
                <button
                  onClick={() => setStep("keys")}
                  className="text-xs text-ink/30 transition-colors hover:text-ink/60"
                >
                  Change API keys
                </button>
              )}
              <button
                onClick={handleClearData}
                className="text-xs text-ink/30 transition-colors hover:text-red-400 ml-auto"
              >
                Clear all data
              </button>
            </div>
          </div>
        )}

        {step === "processing" && (
          <ProcessingView state={processing} onRetry={handleRetry} />
        )}

        {step === "gallery" && (
          <div className="fade-in space-y-4">
            {importDate && (() => {
              const days = Math.floor(
                (Date.now() - new Date(importDate).getTime()) / 86_400_000
              );
              if (days > 30) {
                return (
                  <div className="flex items-center justify-between rounded-lg bg-amber-50/60 px-4 py-3 text-xs">
                    <span className="text-amber-700/80">
                      Your meditations are over a month old
                    </span>
                    <button
                      onClick={() => setStep("upload")}
                      className="font-medium text-amber-700 hover:text-amber-800 transition-colors underline"
                    >
                      Update
                    </button>
                  </div>
                );
              }
              if (days >= 7) {
                return (
                  <div className="flex items-center justify-between rounded-lg bg-edge/30 px-4 py-3 text-xs">
                    <span className="text-ink/40">
                      Updated {days} days ago
                    </span>
                    <button
                      onClick={() => setStep("upload")}
                      className="text-ink/40 hover:text-ink/60 transition-colors underline"
                    >
                      Update
                    </button>
                  </div>
                );
              }
              return (
                <p className="text-center text-xs text-ink/30">
                  Updated {days === 0 ? "today" : days === 1 ? "yesterday" : `${days} days ago`}
                </p>
              );
            })()}
            {hasElevenLabsKey && (
              <VoiceSelector
                selectedVoiceId={selectedVoiceId}
                onSelect={setSelectedVoiceId}
                elevenLabsKey={apiKeys?.elevenLabsKey}
              />
            )}
            {meditations.map((m) => (
              <MeditationCard
                key={m.id}
                meditation={m}
                onSelect={handleSelectMeditation}
              />
            ))}
            <div className="flex items-center justify-between pt-4">
              <button
                onClick={() => setStep("upload")}
                className="text-xs text-ink/30 transition-colors hover:text-ink/60"
              >
                Upload new conversations
              </button>
              <button
                onClick={handleClearData}
                className="text-xs text-ink/30 transition-colors hover:text-red-400"
              >
                Clear all data
              </button>
            </div>
          </div>
        )}

        {step === "reader" && selectedMeditation && (
          <MeditationPlayer
            meditation={selectedMeditation}
            voiceId={selectedVoiceId}
            elevenLabsKey={
              hasElevenLabsKey
                ? apiKeys?.elevenLabsKey
                : undefined
            }
            onBack={() => setStep("gallery")}
            onMeditationUpdate={(updated) => {
              const newList = meditations.map((m) =>
                m.id === updated.id ? updated : m
              );
              setMeditations(newList);
              setSelectedMeditation(updated);
              localStorage.setItem(
                "stillpoint-meditations",
                JSON.stringify(newList)
              );
            }}
          />
        )}
      </div>
    </div>
  );
}
