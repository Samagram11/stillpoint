"use client";

import { useState } from "react";
import type { ApiKeyConfig } from "@/lib/types";

interface ApiKeySetupProps {
  onComplete: (config: ApiKeyConfig) => void;
  initialConfig?: ApiKeyConfig;
}

export default function ApiKeySetup({
  onComplete,
  initialConfig,
}: ApiKeySetupProps) {
  const [anthropicKey, setAnthropicKey] = useState(
    initialConfig?.anthropicKey ?? ""
  );
  const [elevenLabsKey, setElevenLabsKey] = useState(
    initialConfig?.elevenLabsKey ?? ""
  );
  const [showElevenLabs, setShowElevenLabs] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!anthropicKey.trim()) return;

    const config: ApiKeyConfig = {
      anthropicKey: anthropicKey.trim(),
      ...(elevenLabsKey.trim() && { elevenLabsKey: elevenLabsKey.trim() }),
    };

    localStorage.setItem("stillpoint-keys", JSON.stringify(config));
    onComplete(config);
  }

  return (
    <form onSubmit={handleSubmit} className="fade-in space-y-6">
      <div>
        <label
          htmlFor="anthropic-key"
          className="mb-2 block text-sm font-medium text-charcoal/70 dark:text-cream/70"
        >
          Anthropic API Key
          <span className="ml-1 text-clay">*</span>
        </label>
        <input
          id="anthropic-key"
          type="password"
          value={anthropicKey}
          onChange={(e) => setAnthropicKey(e.target.value)}
          placeholder="sk-ant-..."
          className="w-full rounded-lg border border-mist bg-white/50 px-4 py-3 text-sm transition-colors placeholder:text-charcoal/30 focus:border-sage focus:outline-none dark:border-cream/10 dark:bg-cream/5 dark:text-cream dark:placeholder:text-cream/30"
          required
        />
        <p className="mt-1.5 text-xs text-charcoal/40 dark:text-cream/40">
          Get yours at{" "}
          <a
            href="https://console.anthropic.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline transition-colors hover:text-sage"
          >
            console.anthropic.com
          </a>
        </p>
      </div>

      {showElevenLabs ? (
        <div className="fade-in">
          <label
            htmlFor="elevenlabs-key"
            className="mb-2 block text-sm font-medium text-charcoal/70 dark:text-cream/70"
          >
            ElevenLabs API Key
            <span className="ml-1 text-xs text-charcoal/40 dark:text-cream/40">(optional)</span>
          </label>
          <input
            id="elevenlabs-key"
            type="password"
            value={elevenLabsKey}
            onChange={(e) => setElevenLabsKey(e.target.value)}
            placeholder="xi-..."
            className="w-full rounded-lg border border-mist bg-white/50 px-4 py-3 text-sm transition-colors placeholder:text-charcoal/30 focus:border-sage focus:outline-none dark:border-cream/10 dark:bg-cream/5 dark:text-cream dark:placeholder:text-cream/30"
          />
          <p className="mt-1.5 text-xs text-charcoal/40 dark:text-cream/40">
            For audio playback. Without this, meditations are text-only.
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowElevenLabs(true)}
          className="text-sm text-charcoal/40 transition-colors hover:text-sage dark:text-cream/40"
        >
          + Add ElevenLabs key for audio
        </button>
      )}

      <button
        type="submit"
        disabled={!anthropicKey.trim()}
        className="w-full rounded-lg bg-charcoal px-6 py-3 text-sm font-medium text-cream transition-all hover:bg-deep disabled:cursor-not-allowed disabled:opacity-30 dark:bg-cream dark:text-deep dark:hover:bg-cream/80"
      >
        Continue
      </button>
    </form>
  );
}
