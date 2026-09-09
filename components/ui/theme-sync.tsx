"use client";
import { useEffect } from "react";

/** Re-applies `data-theme` to <html> after hydration.
 *
 *  The boot script sets it before first paint, but that attribute is not part
 *  of what React rendered. If hydration ever has to recover — a host that
 *  injects its own tags into <head> is the common cause, and Netlify does
 *  exactly that — React rebuilds <html> from its own tree and the attribute
 *  is dropped, silently reverting the page to light.
 *
 *  Re-asserting it here makes the theme correct regardless of how hydration
 *  went. Touching the DOM from an effect is the intended use: this is
 *  synchronising an external system, not deriving React state. */
export function ThemeSync() {
  useEffect(() => {
    const root = document.documentElement;

    const apply = () => {
      let t: string | null = null;
      try { t = localStorage.getItem("bontraco-theme"); } catch { /* private mode */ }
      if (t !== "dark" && t !== "light") {
        t = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      }
      if (root.dataset.theme !== t) root.dataset.theme = t;
    };

    apply();

    // Follow the system preference while no explicit choice is stored, and
    // pick up a change made in another tab.
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    mql.addEventListener("change", apply);
    window.addEventListener("storage", apply);
    return () => {
      mql.removeEventListener("change", apply);
      window.removeEventListener("storage", apply);
    };
  }, []);

  return null;
}
