"use client";

import { useState, useEffect } from "react";

export type Theme = "minimalist" | "aura";

const THEMES: { id: Theme; label: string; icon: string }[] = [
  { id: "minimalist", label: "Minimal", icon: "○" },
  { id: "aura", label: "Aura", icon: "✦" },
];

interface ThemeSelectorProps {
  className?: string;
}

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "minimalist";
  return (localStorage.getItem("stillpoint-theme") as Theme) || "minimalist";
}

export function applyTheme(theme: Theme) {
  const allClasses = THEMES.map((t) => `theme-${t.id}`);
  document.documentElement.classList.remove(...allClasses);
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

  function select(t: Theme) {
    setTheme(t);
    applyTheme(t);
  }

  if (!mounted) return null;

  return (
    <div className={`inline-flex rounded-full border border-mist bg-white/50 p-0.5 ${className}`}>
      {THEMES.map((t) => (
        <button
          key={t.id}
          onClick={() => select(t.id)}
          className={`rounded-full px-3 py-1 text-xs transition-all ${
            theme === t.id
              ? "bg-charcoal text-cream shadow-sm"
              : "text-charcoal/40 hover:text-charcoal/70"
          }`}
        >
          {t.icon} {t.label}
        </button>
      ))}
    </div>
  );
}
