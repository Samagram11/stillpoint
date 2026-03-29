"use client";

import { useState, useEffect } from "react";

export type Theme = "minimalist" | "aura";

const THEME_LABELS: Record<Theme, string> = {
  minimalist: "Minimalist",
  aura: "Aura",
};

interface ThemeSelectorProps {
  className?: string;
}

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "minimalist";
  return (localStorage.getItem("stillpoint-theme") as Theme) || "minimalist";
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.remove("theme-minimalist", "theme-aura");
  document.documentElement.classList.add(`theme-${theme}`);
  localStorage.setItem("stillpoint-theme", theme);
  window.dispatchEvent(new CustomEvent("theme-change", { detail: theme }));
}

export default function ThemeSelector({ className = "" }: ThemeSelectorProps) {
  const [theme, setTheme] = useState<Theme>("minimalist");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = getStoredTheme();
    setTheme(stored);
    applyTheme(stored);
  }, []);

  function toggle() {
    const next: Theme = theme === "minimalist" ? "aura" : "minimalist";
    setTheme(next);
    applyTheme(next);
  }

  if (!mounted) return null;

  return (
    <button
      onClick={toggle}
      className={`rounded-full border px-3 py-1 text-xs transition-all ${
        theme === "aura"
          ? "border-purple-300/30 bg-purple-200/20 text-purple-400"
          : "border-mist text-charcoal/30 hover:text-charcoal/60"
      } ${className}`}
      title={`Switch to ${THEME_LABELS[theme === "minimalist" ? "aura" : "minimalist"]}`}
    >
      {theme === "minimalist" ? "✦ Aura" : "○ Minimal"}
    </button>
  );
}
