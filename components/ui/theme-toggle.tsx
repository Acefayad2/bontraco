"use client";
import { Moon, Sun } from "lucide-react";

/** Renders both icons and lets CSS pick one from `data-theme`.
 *
 *  Nothing here depends on the current theme at render time, so the server
 *  and client produce identical markup and hydration can never mismatch —
 *  the boot script in the layout has already stamped `data-theme` on <html>
 *  by the time this paints. */
export function ThemeToggle({ className = "" }: { className?: string }) {
  function toggle() {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try { localStorage.setItem("bontraco-theme", next); } catch { /* private mode */ }
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className={`inline-flex size-9 cursor-pointer items-center justify-center rounded-md
        text-[var(--fg-muted)] transition-colors duration-200
        hover:bg-[var(--surface-2)] hover:text-[var(--fg)] ${className}`}
    >
      <Moon className="theme-icon-moon size-[18px]" />
      <Sun className="theme-icon-sun size-[18px]" />
    </button>
  );
}
