"use client";

/**
 * Floating gradient blobs that appear behind the app content
 * when the Aura theme is active. Pure CSS animation, no JS needed.
 */
export default function AuraBackground() {
  return (
    <div className="aura-bg">
      <div className="aura-blob aura-blob-1" />
      <div className="aura-blob aura-blob-2" />
      <div className="aura-blob aura-blob-3" />
    </div>
  );
}
