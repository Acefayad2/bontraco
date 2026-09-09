"use client";
import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark";
const KEY = "bontraco-theme";

const listeners = new Set<() => void>();

function emit() { listeners.forEach((l) => l()); }

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  const mql = window.matchMedia("(prefers-color-scheme: dark)");
  mql.addEventListener("change", onChange);
  // Another tab may change the stored preference.
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    mql.removeEventListener("change", onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** The inline script in the layout stamps `data-theme` before first paint,
 *  so the attribute is the single source of truth on the client. */
function getSnapshot(): Theme {
  const attr = document.documentElement.dataset.theme;
  return attr === "dark" || attr === "light" ? attr : "light";
}

/** Hydration renders against this, matching what the server emitted. */
function getServerSnapshot(): Theme {
  return "light";
}

export function useTheme(): [Theme, () => void] {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem(KEY, next); } catch { /* private mode */ }
    emit();
  }

  return [theme, toggle];
}
