"use client";

import { useState, useCallback, useRef } from "react";

interface UploadZoneProps {
  onFileLoaded: (data: Record<string, unknown>[]) => void;
}

export default function UploadZone({ onFileLoaded }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    (file: File) => {
      setError(null);

      if (!file.name.endsWith(".json")) {
        setError("Please upload a JSON file exported from Claude.");
        return;
      }

      setFileName(file.name);

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const raw = JSON.parse(e.target?.result as string);

          // Claude export is an array of conversation objects
          if (!Array.isArray(raw)) {
            setError(
              "This doesn't look like a Claude export. Expected a JSON array of conversations."
            );
            return;
          }

          onFileLoaded(raw);
        } catch {
          setError("Could not parse this file. Is it valid JSON?");
        }
      };
      reader.onerror = () => setError("Failed to read file.");
      reader.readAsText(file);
    },
    [onFileLoaded]
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  return (
    <div className="fade-in">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-6 sm:p-12 text-center transition-all active:scale-[0.98] ${
          isDragging
            ? "border-accent bg-accent/5"
            : "border-edge hover:border-accent/50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".json"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-edge/40 p-3">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className="h-full w-full text-ink/40"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
        </div>

        {fileName ? (
          <p className="text-sm text-accent">{fileName}</p>
        ) : (
          <>
            <p className="text-sm font-medium text-ink/60">
              <span className="hidden sm:inline">Drop your Claude export here or click to browse</span>
              <span className="sm:hidden">Tap to select your Claude export</span>
            </p>
            <p className="mt-1 text-xs text-ink/30">
              JSON file from claude.ai &rarr; Settings &rarr; Export Data
            </p>
          </>
        )}
      </div>

      {error && (
        <p className="mt-3 text-center text-sm text-red-500/80">{error}</p>
      )}
    </div>
  );
}
