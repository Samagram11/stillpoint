"use client";

import { useState, useCallback, useRef } from "react";
import { extractConversationsFromZip } from "@/lib/extractZip";
import {
  findConversationsInEntries,
  findConversationsInFileList,
} from "@/lib/extractFromDirectory";

interface UploadZoneProps {
  onFileLoaded: (data: Record<string, unknown>[]) => void;
}

export default function UploadZone({ onFileLoaded }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const processJsonFile = useCallback(
    (file: File) => {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const raw = JSON.parse(e.target?.result as string);

          if (!Array.isArray(raw)) {
            setError(
              "This doesn't look like a Claude export. Expected a JSON array of conversations."
            );
            setIsLoading(false);
            return;
          }

          setIsLoading(false);
          onFileLoaded(raw);
        } catch {
          setError("Could not parse this file. Is it valid JSON?");
          setIsLoading(false);
        }
      };
      reader.onerror = () => {
        setError("Failed to read file.");
        setIsLoading(false);
      };
      reader.readAsText(file);
    },
    [onFileLoaded]
  );

  const processFile = useCallback(
    async (file: File) => {
      setError(null);
      setIsLoading(true);

      if (file.name.endsWith(".zip")) {
        setFileName(file.name);
        try {
          const data = await extractConversationsFromZip(file);
          setIsLoading(false);
          onFileLoaded(data);
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to read ZIP file."
          );
          setIsLoading(false);
        }
        return;
      }

      if (file.name.endsWith(".json")) {
        processJsonFile(file);
        return;
      }

      setError(
        "Please upload a JSON or ZIP file exported from Claude."
      );
      setIsLoading(false);
    },
    [onFileLoaded, processJsonFile]
  );

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    setError(null);

    // Check if a directory was dropped
    const items = e.dataTransfer.items;
    if (items && items.length > 0) {
      const firstEntry = items[0].webkitGetAsEntry?.();
      if (firstEntry?.isDirectory) {
        setIsLoading(true);
        setFileName(firstEntry.name + "/");
        try {
          const data = await findConversationsInEntries(items);
          if (data) {
            setIsLoading(false);
            onFileLoaded(data);
            return;
          }
          setError(
            "No conversations.json found in this folder. Make sure you're dropping an unzipped Claude export."
          );
        } catch {
          setError("Failed to read folder contents.");
        }
        setIsLoading(false);
        return;
      }
    }

    // Regular file drop
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

  async function handleFolderSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError(null);
    setIsLoading(true);
    setFileName("Selected folder");

    try {
      const data = await findConversationsInFileList(files);
      if (data) {
        setIsLoading(false);
        onFileLoaded(data);
        return;
      }
      setError(
        "No conversations.json found in this folder. Make sure you selected an unzipped Claude export."
      );
    } catch {
      setError("Failed to read folder contents.");
    }
    setIsLoading(false);
  }

  return (
    <div className="fade-in">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
        }}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-6 sm:p-12 text-center transition-all active:scale-[0.98] ${
          isDragging
            ? "border-accent bg-accent/5"
            : "border-edge hover:border-accent/50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.zip"
          onChange={handleFileSelect}
          className="hidden"
        />
        <input
          ref={folderInputRef}
          type="file"
          // @ts-expect-error webkitdirectory is non-standard but widely supported
          webkitdirectory=""
          onChange={handleFolderSelect}
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

        {isLoading ? (
          <p className="text-sm text-ink/60">Reading file...</p>
        ) : fileName ? (
          <p className="text-sm text-accent">{fileName}</p>
        ) : (
          <>
            <p className="text-sm font-medium text-ink/60">
              <span className="hidden sm:inline">Drop your Claude export here or click to browse</span>
              <span className="sm:hidden">Tap to select your Claude export</span>
            </p>
            <p className="mt-1 text-xs text-ink/30">
              ZIP or JSON file — or drop the unzipped folder
            </p>
          </>
        )}
      </div>

      <div className="mt-2 text-center">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            folderInputRef.current?.click();
          }}
          className="text-xs text-ink/30 transition-colors hover:text-ink/50 underline"
        >
          Or select a folder
        </button>
      </div>

      {error && (
        <p className="mt-3 text-center text-sm text-red-500/80">{error}</p>
      )}
    </div>
  );
}
