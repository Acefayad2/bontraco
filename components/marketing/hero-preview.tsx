"use client";
import { useEffect, useState } from "react";
import { AlertTriangle, Check, FileText, Sparkles } from "lucide-react";

/* A compressed, live-feeling rendition of what Bontraco does to a
   contract: extract clauses, score them, propose the redline. */

const findings = [
  { risk: "high" as const, clause: "§11.2 Limitation of Liability", note: "Cap at 3× fees — playbook ceiling is 1×", delta: "+82" },
  { risk: "high" as const, clause: "§15.1 Ownership of Deliverables", note: "Supplier retains work-for-hire output", delta: "+77" },
  { risk: "medium" as const, clause: "§4.3 Auto-Renewal", note: "60-day non-renewal window vs. 30-day standard", delta: "+38" },
  { risk: "low" as const, clause: "§5.1 Payment Terms", note: "Net-30, undisputed invoices — matches playbook", delta: "+12" },
];

const tones = {
  high: { text: "text-risk-high", bg: "bg-risk-high-bg dark:bg-risk-high/12", ring: "ring-risk-high/20" },
  medium: { text: "text-risk-med", bg: "bg-risk-med-bg dark:bg-risk-med/12", ring: "ring-risk-med/20" },
  low: { text: "text-risk-low", bg: "bg-risk-low-bg dark:bg-risk-low/12", ring: "ring-risk-low/20" },
};

export function HeroPreview() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Reduced motion: show the finished state, never animate.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const settle = setTimeout(() => setStep(findings.length), 0);
      return () => clearTimeout(settle);
    }
    const t = setInterval(() => {
      setStep((s) => (s >= findings.length ? 0 : s + 1));
    }, 900);
    return () => clearInterval(t);
  }, []);

  const done = step >= findings.length;

  return (
    <div className="relative">
      {/* soft ground shadow — no glow blobs */}
      <div
        aria-hidden
        className="absolute -inset-x-8 -bottom-6 top-12 rounded-[24px] bg-ink-900/[0.045] blur-2xl dark:bg-black/40"
      />
      <div className="relative overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-lg)]">
        {/* window chrome */}
        <div className="flex items-center gap-3 border-b border-[var(--line)] bg-[var(--surface-2)] px-4 py-2.5">
          <div className="flex gap-1.5" aria-hidden>
            <span className="size-2.5 rounded-full bg-[var(--line-strong)]" />
            <span className="size-2.5 rounded-full bg-[var(--line-strong)]" />
            <span className="size-2.5 rounded-full bg-[var(--line-strong)]" />
          </div>
          <div className="flex items-center gap-2 text-[12px] text-[var(--fg-muted)]">
            <FileText className="size-3.5" />
            <span className="font-mono">Northwind_MSA_v4.pdf</span>
            <span className="text-[var(--fg-subtle)]">· 34 pages</span>
          </div>
          <span
            className={`ml-auto inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-medium
              ${done ? "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
                     : "bg-info-bg text-info dark:bg-info/15"}`}
          >
            {done ? <Check className="size-3" /> : <Sparkles className="size-3 animate-pulse" />}
            {done ? "Analysis complete" : "Reading…"}
          </span>
        </div>

        {/* scanning bar */}
        <div className="h-0.5 overflow-hidden bg-[var(--surface-2)]">
          {!done && <div className="h-full w-1/3 bg-[var(--accent)] animate-sweep" />}
        </div>

        <div className="p-4 sm:p-5">
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
                Risk score
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="tabular font-serif text-[40px] leading-none text-risk-high">
                  {done ? 74 : Math.round((step / findings.length) * 74)}
                </span>
                <span className="text-[13px] text-[var(--fg-muted)]">/ 100</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
                Clauses
              </div>
              <div className="tabular mt-1 text-[15px] font-semibold">
                <span className="text-risk-high">{Math.min(step, 2)}</span>
                <span className="text-[var(--fg-subtle)]"> high · </span>
                <span>{step}</span>
                <span className="text-[var(--fg-subtle)]"> of 41 shown</span>
              </div>
            </div>
          </div>

          <ul className="min-h-[268px] space-y-2">
            {findings.map((f, i) => {
              const shown = i < step;
              const tone = tones[f.risk];
              return (
                <li
                  key={f.clause}
                  className={`flex items-start gap-3 rounded-lg border border-[var(--line)] p-3
                    transition-all duration-500
                    ${shown ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}
                  style={{ transitionDelay: shown ? "0ms" : "0ms" }}
                >
                  <span className={`mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-md ring-1 ${tone.bg} ${tone.ring}`}>
                    {f.risk === "low"
                      ? <Check className={`size-3.5 ${tone.text}`} />
                      : <AlertTriangle className={`size-3.5 ${tone.text}`} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium">{f.clause}</div>
                    <div className="mt-0.5 text-[12.5px] leading-snug text-[var(--fg-muted)]">{f.note}</div>
                  </div>
                  <span className={`tabular shrink-0 font-mono text-[12px] font-medium ${tone.text}`}>
                    {f.delta}
                  </span>
                </li>
              );
            })}
          </ul>

          <div
            className={`mt-4 flex items-center gap-2.5 rounded-lg border border-brand-600/25 bg-brand-50 px-3.5 py-3
              transition-all duration-500 dark:bg-brand-500/10
              ${done ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}
          >
            <Sparkles className="size-4 shrink-0 text-brand-700 dark:text-brand-300" />
            <p className="text-[12.5px] leading-snug text-brand-900 dark:text-brand-100">
              <span className="font-semibold">4 redlines drafted.</span>{" "}
              Bontraco rewrote §11.2 to a 1× cap with a 2× breach carve-out, matching your last 14 signed MSAs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
