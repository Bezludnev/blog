"use client";

import { useEffect, useState } from "react";

import {
  THEME_STORAGE_KEY,
  getNextStoredTheme,
  type StoredTheme,
} from "@/lib/theme";

function getDocumentTheme(): StoredTheme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function SunIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-3.5 w-3.5"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-3.5 w-3.5"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M20 14.5A7.5 7.5 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<StoredTheme>("light");
  const isDark = theme === "dark";

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setTheme(getDocumentTheme());
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  function toggleTheme() {
    const nextTheme = getNextStoredTheme(getDocumentTheme());
    const nextIsDark = nextTheme === "dark";

    document.documentElement.classList.toggle("dark", nextIsDark);
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    setTheme(nextTheme);
  }

  return (
    <button
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      aria-checked={isDark}
      className="inline-flex h-8 w-14 shrink-0 items-center rounded-full border border-zinc-300 bg-zinc-100 p-1 text-zinc-700 transition-colors hover:border-zinc-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-950 dark:focus-visible:outline-zinc-100"
      onClick={toggleTheme}
      role="switch"
      suppressHydrationWarning
      type="button"
    >
      <span
        aria-hidden="true"
        className={`inline-flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-zinc-300 transition-transform dark:bg-zinc-100 dark:ring-zinc-600 ${
          isDark ? "translate-x-6" : "translate-x-0"
        }`}
        suppressHydrationWarning
      >
        {isDark ? <MoonIcon /> : <SunIcon />}
      </span>
    </button>
  );
}
