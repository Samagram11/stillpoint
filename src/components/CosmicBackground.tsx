"use client";

/**
 * Animated space background with twinkling stars, planets, and rocket ships
 * in a cute, girly pattern. Shown when the Cosmic theme is active.
 */
export default function CosmicBackground() {
  return (
    <div className="cosmic-bg" aria-hidden="true">
      {/* Twinkling stars — pink/purple */}
      <div className="cosmic-star cosmic-star-1" />
      <div className="cosmic-star cosmic-star-2" />
      <div className="cosmic-star cosmic-star-3" />
      <div className="cosmic-star cosmic-star-4" />
      <div className="cosmic-star cosmic-star-5" />
      <div className="cosmic-star cosmic-star-6" />
      <div className="cosmic-star cosmic-star-7" />
      <div className="cosmic-star cosmic-star-8" />
      <div className="cosmic-star cosmic-star-9" />
      <div className="cosmic-star cosmic-star-10" />
      <div className="cosmic-star cosmic-star-11" />
      <div className="cosmic-star cosmic-star-12" />

      {/* Twinkling stars — pale yellow */}
      <div className="cosmic-star cosmic-star-13" />
      <div className="cosmic-star cosmic-star-14" />
      <div className="cosmic-star cosmic-star-15" />
      <div className="cosmic-star cosmic-star-16" />
      <div className="cosmic-star cosmic-star-17" />
      <div className="cosmic-star cosmic-star-18" />
      <div className="cosmic-star cosmic-star-19" />
      <div className="cosmic-star cosmic-star-20" />
      <div className="cosmic-star cosmic-star-21" />
      <div className="cosmic-star cosmic-star-22" />
      <div className="cosmic-star cosmic-star-23" />
      <div className="cosmic-star cosmic-star-24" />

      {/* Planets */}
      <div className="cosmic-planet cosmic-planet-1" />
      <div className="cosmic-planet cosmic-planet-2" />
      <div className="cosmic-planet cosmic-planet-3" />

      {/* Rocket ships */}
      <div className="cosmic-rocket cosmic-rocket-1">🚀</div>
      <div className="cosmic-rocket cosmic-rocket-2">🚀</div>
    </div>
  );
}
