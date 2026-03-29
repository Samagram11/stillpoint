"use client";

/**
 * Animated sky background with a pulsing sun and drifting clouds.
 * Shown when the Sunny theme is active.
 */
export default function SunnyBackground() {
  return (
    <div className="sunny-bg" aria-hidden="true">
      {/* Sun */}
      <div className="sunny-sun" />

      {/* Drifting clouds */}
      <div className="sunny-cloud sunny-cloud-1" />
      <div className="sunny-cloud sunny-cloud-2" />
      <div className="sunny-cloud sunny-cloud-3" />
      <div className="sunny-cloud sunny-cloud-4" />
    </div>
  );
}
