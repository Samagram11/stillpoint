"use client";

import { useState, useEffect, useCallback } from "react";
import ApiKeySetup from "@/components/ApiKeySetup";
import UploadZone from "@/components/UploadZone";
import ProcessingView from "@/components/ProcessingView";
import MeditationCard from "@/components/MeditationCard";
import MeditationReader from "@/components/MeditationReader";
import type { ApiKeyConfig, ProcessingState, Meditation, MeditationType } from "@/lib/types";
import { parseExport } from "@/lib/parseExport";
import { formatExcerptsForExtraction } from "@/lib/extractCapacities";
import {
  assignMeditationTypes,
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

  // Restore state from localStorage on mount + check server config
  useEffect(() => {
    async function init() {
      // Check if server has API keys configured (personal deploy)
      try {
        const configRes = await fetch("/api/config");
        if (configRes.ok) {
          const config = await configRes.json();
          if (config.hasAnthropicKey) {
            setServerHasKeys(true);
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

            const storedMeditations = localStorage.getItem(
              "stillpoint-meditations"
            );
            if (storedMeditations) {
              const parsed = JSON.parse(storedMeditations) as Meditation[];
              if (parsed.length > 0) {
                setMeditations(parsed);
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

      const assignments = assignMeditationTypes(extraction);
      const generated: Meditation[] = [];

      // Generate meditations sequentially to avoid rate limits
      for (const assignment of assignments) {
        try {
          const response = await fetch("/api/generate-meditation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              apiKey: keys.anthropicKey,
              meditationType: assignment.type,
              capacities: assignment.capacities.map((c) => ({
                capacity: c.capacity,
                description: c.description,
              })),
              emotionalTone: extraction.emotional_tone,
              bodyContext: extraction.body_context,
              strengthSignals: extraction.strength_signals,
            }),
          });

          if (!response.ok) {
            const err = await response.json();
            // Skip this one but continue with others
            if (err.error?.includes("Invalid Anthropic API key")) {
              setProcessing({ stage: "error", message: err.error });
              return;
            }
            continue;
          }

          const result = await response.json();

          generated.push({
            id: `${assignment.type}-${Date.now()}`,
            title: result.title,
            type: assignment.type as MeditationType,
            capacity: result.description,
            script: result.script,
            duration: 5,
            createdAt: new Date().toISOString(),
          });

          // Update progress message
          setProcessing({
            stage: "generating",
            message: `Writing your meditations... (${generated.length}/${assignments.length})`,
          });
        } catch {
          // Skip failed generation, continue with others
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

      // Cache meditations
      localStorage.setItem(
        "stillpoint-meditations",
        JSON.stringify(generated)
      );

      setMeditations(generated);
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
    setMeditations([]);
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
      {/* Header — always visible except in reader */}
      {step !== "reader" && (
        <div className="mb-12 text-center fade-in">
          <h1 className="font-display text-5xl font-light tracking-tight text-charcoal">
            stillpoint
          </h1>
          <p className="mt-3 text-sm text-charcoal/50">
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
            <div className="flex items-center justify-between">
              {!serverHasKeys && (
                <button
                  onClick={() => setStep("keys")}
                  className="text-xs text-charcoal/30 transition-colors hover:text-charcoal/60"
                >
                  Change API keys
                </button>
              )}
              <button
                onClick={handleClearData}
                className="text-xs text-charcoal/30 transition-colors hover:text-red-400 ml-auto"
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
                className="text-xs text-charcoal/30 transition-colors hover:text-charcoal/60"
              >
                Upload new conversations
              </button>
              <button
                onClick={handleClearData}
                className="text-xs text-charcoal/30 transition-colors hover:text-red-400"
              >
                Clear all data
              </button>
            </div>
          </div>
        )}

        {step === "reader" && selectedMeditation && (
          <MeditationReader
            meditation={selectedMeditation}
            onBack={() => setStep("gallery")}
          />
        )}
      </div>
    </div>
  );
}
