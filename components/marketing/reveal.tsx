"use client";
import { useEffect, useRef, useState } from "react";

/** Scroll-reveal wrapper.
 *
 *  Fails open by design: content must never be left permanently invisible.
 *  If IntersectionObserver is unavailable, never fires (a background or
 *  non-rendered tab does not run its callbacks), or the element is already
 *  on screen at mount, we show the content immediately. Reduced motion
 *  skips the animation entirely. */
export function Reveal({
  children, delay = 0, className = "",
}: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced || !el || typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }

    // Already in view at mount — show without waiting for the observer.
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setShown(true);
      return;
    }

    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect(); } },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
    );
    io.observe(el);

    // Safety net: if the observer never fires (hidden tab, print, an engine
    // that skips callbacks while unpainted), reveal anyway.
    const failOpen = setTimeout(() => { setShown(true); io.disconnect(); }, 1500);

    return () => { io.disconnect(); clearTimeout(failOpen); };
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
        shown ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
