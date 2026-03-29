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
          className="mb-2 block text-sm font-medium text-ink/70"
        >
          Anthropic API Key
          <span className="ml-1 text-warm">*</span>
        </label>
        <input
          id="anthropic-key"
          type="password"
          value={anthropicKey}
          onChange={(e) => setAnthropicKey(e.target.value)}
          placeholder="sk-ant-..."
          className="w-full rounded-lg border border-edge bg-white/50 px-4 py-3 text-sm transition-colors placeholder:text-ink/30 focus:border-accent focus:outline-none aura-input"
          required
        />
        <p className="mt-1.5 text-xs text-ink/40">
          Get yours at{" "}
          <a
            href="https://console.anthropic.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline transition-colors hover:text-accent"
          >
            console.anthropic.com
          </a>
        </p>
      </div>

      {showElevenLabs ? (
        <div className="fade-in">
          <label
            htmlFor="elevenlabs-key"
            className="mb-2 block text-sm font-medium text-ink/70"
          >
            ElevenLabs API Key
            <span className="ml-1 text-xs text-ink/40">(optional)</span>
          </label>
          <input
            id="elevenlabs-key"
            type="password"
            value={elevenLabsKey}
            onChange={(e) => setElevenLabsKey(e.target.value)}
            placeholder="xi-..."
            className="w-full rounded-lg border border-edge bg-white/50 px-4 py-3 text-sm transition-colors placeholder:text-ink/30 focus:border-accent focus:outline-none aura-input"
          />
          <p className="mt-1.5 text-xs text-ink/40">
            For audio playback. Without this, meditations are text-only.
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowElevenLabs(true)}
          className="text-sm text-ink/40 transition-colors hover:text-accent"
        >
          + Add ElevenLabs key for audio
        </button>
      )}

      <button
        type="submit"
        disabled={!anthropicKey.trim()}
        className="w-full rounded-lg bg-ink px-6 py-3 text-sm font-medium text-surface transition-all hover:bg-emphasis disabled:cursor-not-allowed disabled:opacity-30 aura-btn"
      >
        Continue
      </button>
    </form>
  );
}
