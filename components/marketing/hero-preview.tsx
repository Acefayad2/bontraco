"use client";
import { useEffect, useState } from "react";
import { AlertTriangle, Check, FileText, Sparkles } from "lucide-react";

/* A compressed, live-feeling rendition of what Bontraco does to a contract:
   extract clauses, score them, propose the redline. It plays once on mount
   rather than looping — a looping demo reads as a broken component, and the
   card is sized to its full content so nothing reflows while it plays. */

const findings = [
  { risk: "high" as const, clause: "§11.2  Limitation of Liability", note: "Cap at 3× fees — playbook ceiling is 1×", delta: "+82" },
  { risk: "high" as const, clause: "§15.1  Ownership of Deliverables", note: "Supplier retains work-for-hire output", delta: "+77" },
  { risk: "medium" as const, clause: "§4.3  Auto-Renewal", note: "60-day non-renewal window vs. 30-day standard", delta: "+38" },
  { risk: "low" as const, clause: "§5.1  Payment Terms", note: "Net-30, undisputed invoices — matches playbook", delta: "+12" },
];

const tones = {
  high: { text: "text-risk-high", bg: "bg-risk-high-bg dark:bg-risk-high/12", ring: "ring-risk-high/25" },
  medium: { text: "text-risk-med", bg: "bg-risk-med-bg dark:bg-risk-med/12", ring: "ring-risk-med/25" },
  low: { text: "text-brand-600 dark:text-brand-400", bg: "bg-brand-50 dark:bg-brand-500/12", ring: "ring-brand-500/25" },
};

export function HeroPreview() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Under reduced motion the sequence resolves to its final state at once
    // rather than playing; nothing here animates in that case.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = setInterval(() => {
      setStep((s) => {
        const next = reduced ? findings.length : s + 1;
        if (next >= findings.length) clearInterval(t);
        return Math.min(next, findings.length);
      });
    }, reduced ? 0 : 620);
    return () => clearInterval(t);
  }, []);

  const done = step >= findings.length;
  const score = Math.round((Math.min(step, findings.length) / findings.length) * 74);

  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute -inset-x-6 -bottom-6 top-14 rounded-[26px] bg-ink-900/[0.06] blur-2xl dark:bg-black/50"
      />
      <div className="relative overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-lg)]">
        {/* window chrome */}
        <div className="flex items-center gap-3 border-b border-[var(--line)] bg-[var(--surface-2)] px-4 py-3">
          <div className="flex gap-1.5" aria-hidden>
            <span className="size-2.5 rounded-full bg-[var(--line-strong)]" />
            <span className="size-2.5 rounded-full bg-[var(--line-strong)]" />
            <span className="size-2.5 rounded-full bg-[var(--line-strong)]" />
          </div>
          <div className="flex items-center gap-2 text-[12.5px] text-[var(--fg-muted)]">
            <FileText className="size-3.5" />
            <span className="font-mono">Northwind_MSA_v4.pdf</span>
            <span className="hidden text-[var(--fg-subtle)] sm:inline">· 34 pages</span>
          </div>
          <span
            className={`ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold
              ${done ? "bg-brand-900 text-white dark:bg-brand-400 dark:text-ink-950"
                     : "bg-flag-50 text-flag-600 dark:bg-flag-500/15 dark:text-flag-400"}`}
          >
            {done ? <Check className="size-3" /> : <Sparkles className="size-3 animate-pulse" />}
            {done ? "Analysis complete" : "Reading…"}
          </span>
        </div>

        <div className="h-0.5 overflow-hidden bg-[var(--surface-2)]">
          {!done && <div className="h-full w-1/3 bg-flag-600 animate-sweep" />}
        </div>

        <div className="p-5">
          <div className="flex items-end justify-between gap-4 border-b border-[var(--line)] pb-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
                Risk score
              </div>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="numeral tabular text-[46px] text-risk-high">{score}</span>
                <span className="text-[13px] text-[var(--fg-muted)]">/ 100</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
                Clauses read
              </div>
              <div className="mt-1.5 flex items-baseline justify-end gap-2">
                <span className="numeral tabular text-[46px] text-[var(--fg)]">41</span>
                <span className="text-[13px] text-[var(--fg-muted)]">
                  <span className="font-semibold text-risk-high">{Math.min(step, 2)}</span> high
                </span>
              </div>
            </div>
          </div>

          <ul className="mt-4 space-y-2">
            {findings.map((f, i) => {
              const shown = i < step;
              const tone = tones[f.risk];
              return (
                <li
                  key={f.clause}
                  className={`flex items-start gap-3 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3
                    transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]
                    ${shown ? "translate-y-0 opacity-100" : "translate-y-1.5 opacity-0"}`}
                >
                  <span className={`mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-md ring-1 ${tone.bg} ${tone.ring}`}>
                    {f.risk === "low"
                      ? <Check className={`size-3.5 ${tone.text}`} />
                      : <AlertTriangle className={`size-3.5 ${tone.text}`} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-semibold">{f.clause}</div>
                    <div className="mt-0.5 text-[12.5px] leading-snug text-[var(--fg-muted)]">{f.note}</div>
                  </div>
                  <span className={`tabular shrink-0 font-mono text-[12px] font-semibold ${tone.text}`}>
                    {f.delta}
                  </span>
                </li>
              );
            })}
          </ul>

          <div
            className={`mt-3 flex items-center gap-2.5 rounded-lg bg-brand-900 px-3.5 py-3
              transition-all duration-500 dark:bg-brand-800
              ${done ? "translate-y-0 opacity-100" : "translate-y-1.5 opacity-0"}`}
          >
            <Sparkles className="size-4 shrink-0 text-flag-400" />
            <p className="text-[12.5px] leading-snug text-white">
              <span className="font-semibold">4 redlines drafted.</span>{" "}
              §11.2 rewritten to a 1× cap with a 2× breach carve-out, matching your last 14 signed MSAs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
