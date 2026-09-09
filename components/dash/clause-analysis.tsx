"use client";
import { useState } from "react";
import {
  AlertTriangle, Check, ChevronDown, Copy, FileText, Sparkles,
  ThumbsDown, ThumbsUp, X,
} from "lucide-react";
import { Badge, Button, Meter } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import type { Clause } from "@/lib/types";

const toneFor = (r: Clause["risk"]) =>
  r === "high" ? "high" : r === "medium" ? "medium" : "low";

export function ClauseAnalysis({ clauses }: { clauses: Clause[] }) {
  const [open, setOpen] = useState<string | null>(clauses[0]?.id ?? null);
  const [decisions, setDecisions] = useState<Record<string, "accepted" | "rejected">>({});
  const [filter, setFilter] = useState<"all" | "flagged">("flagged");

  const shown = filter === "all" ? clauses : clauses.filter((c) => c.risk !== "low");
  const flaggedCount = clauses.filter((c) => c.risk !== "low").length;

  function decide(id: string, d: "accepted" | "rejected") {
    setDecisions((prev) => ({ ...prev, [id]: prev[id] === d ? undefined! : d }));
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--line)] px-5 py-3">
        <div className="flex overflow-hidden rounded-md border border-[var(--line)]">
          {([["flagged", `Flagged (${flaggedCount})`], ["all", `All clauses (${clauses.length})`]] as const)
            .map(([k, label]) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                aria-pressed={filter === k}
                className={cn(
                  "cursor-pointer px-3 py-1.5 text-[12.5px] font-medium transition-colors duration-200",
                  filter === k
                    ? "bg-[var(--surface-2)] text-[var(--fg)]"
                    : "text-[var(--fg-muted)] hover:text-[var(--fg)]",
                )}
              >
                {label}
              </button>
            ))}
        </div>
        <span className="ml-auto inline-flex items-center gap-1.5 text-[12px] text-[var(--fg-subtle)]">
          <Sparkles className="size-3.5 text-brand-600" />
          Scored against Vendor Playbook v4
        </span>
      </div>

      <ul className="divide-y divide-[var(--line)]">
        {shown.map((c) => {
          const isOpen = open === c.id;
          const decision = decisions[c.id];
          return (
            <li key={c.id}>
              <h3>
                <button
                  onClick={() => setOpen(isOpen ? null : c.id)}
                  aria-expanded={isOpen}
                  className="flex w-full cursor-pointer items-start gap-3.5 px-5 py-4 text-left
                    transition-colors duration-200 hover:bg-[var(--surface-2)]"
                >
                  <span className={cn(
                    "mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-md",
                    c.risk === "high" ? "bg-risk-high-bg text-risk-high dark:bg-risk-high/15"
                      : c.risk === "medium" ? "bg-risk-med-bg text-risk-med dark:bg-risk-med/15"
                      : "bg-risk-low-bg text-risk-low dark:bg-risk-low/15",
                  )}>
                    {c.risk === "low" ? <Check className="size-3.5" /> : <AlertTriangle className="size-3.5" />}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-[14px] font-medium text-[var(--fg)]">{c.title}</span>
                      <Badge tone="neutral" className="!py-0 !text-[10px]">{c.category}</Badge>
                      <span className="font-mono text-[11px] text-[var(--fg-subtle)]">p.{c.page}</span>
                      {decision === "accepted" && (
                        <Badge tone="accent"><Check className="size-3" />Redline accepted</Badge>
                      )}
                      {decision === "rejected" && (
                        <Badge tone="neutral"><X className="size-3" />Kept as drafted</Badge>
                      )}
                    </span>
                    {!isOpen && (
                      <span className="mt-1 block truncate text-[12.5px] text-[var(--fg-muted)]">
                        {c.finding}
                      </span>
                    )}
                  </span>

                  <span className="hidden w-[104px] shrink-0 pt-1 sm:block">
                    <span className="mb-1.5 flex items-baseline justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-[var(--fg-subtle)]">
                        Deviation
                      </span>
                      <span className="tabular text-[12px] font-semibold">{c.deviation}</span>
                    </span>
                    <Meter value={c.deviation} tone={toneFor(c.risk)} label={`Deviation for ${c.title}`} />
                  </span>

                  <ChevronDown className={cn(
                    "mt-1 size-4 shrink-0 text-[var(--fg-subtle)] transition-transform duration-300",
                    isOpen && "rotate-180",
                  )} />
                </button>
              </h3>

              {isOpen && (
                <div className="animate-fade-up space-y-4 px-5 pb-5 pl-[62px]">
                  {/* Contract language */}
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <FileText className="size-3.5 text-[var(--fg-subtle)]" />
                      <span className="text-[11px] font-semibold uppercase tracking-[0.1em]
                        text-[var(--fg-subtle)]">
                        As drafted · page {c.page}
                      </span>
                    </div>
                    <blockquote className="rounded-md border-l-2 border-[var(--line-strong)]
                      bg-[var(--surface-2)] px-4 py-3 font-serif text-[14.5px] leading-[1.6]
                      text-[var(--fg-muted)]">
                      {c.excerpt}
                    </blockquote>
                  </div>

                  {/* Finding */}
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <Sparkles className="size-3.5 text-brand-600" />
                      <span className="text-[11px] font-semibold uppercase tracking-[0.1em]
                        text-[var(--fg-subtle)]">
                        What Bontraco found
                      </span>
                    </div>
                    <p className="text-[13.5px] leading-[1.65] text-[var(--fg)]">{c.finding}</p>
                  </div>

                  {/* Proposed redline */}
                  <div className={cn(
                    "rounded-lg border p-4",
                    c.risk === "low"
                      ? "border-[var(--line)] bg-[var(--surface-2)]"
                      : "border-brand-600/25 bg-brand-50 dark:bg-brand-500/8",
                  )}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.1em]
                        text-[var(--fg-subtle)]">
                        {c.risk === "low" ? "Assessment" : "Proposed redline"}
                      </span>
                      {c.risk !== "low" && (
                        <button
                          className="inline-flex cursor-pointer items-center gap-1 rounded px-1.5 py-0.5
                            text-[11.5px] text-[var(--fg-muted)] transition-colors duration-200
                            hover:text-[var(--fg)]"
                          aria-label="Copy proposed language"
                        >
                          <Copy className="size-3" />
                          Copy
                        </button>
                      )}
                    </div>
                    <p className="text-[13.5px] leading-[1.65] text-[var(--fg)]">{c.suggestion}</p>

                    {c.risk !== "low" && (
                      <div className="mt-4 flex flex-wrap items-center gap-2 border-t
                        border-brand-600/15 pt-3.5">
                        <Button
                          size="sm"
                          variant={decision === "accepted" ? "primary" : "outline"}
                          onClick={() => decide(c.id, "accepted")}
                        >
                          <ThumbsUp className="size-3.5" />
                          Accept redline
                        </Button>
                        <Button
                          size="sm"
                          variant={decision === "rejected" ? "secondary" : "outline"}
                          onClick={() => decide(c.id, "rejected")}
                        >
                          <ThumbsDown className="size-3.5" />
                          Keep as drafted
                        </Button>
                        <span className="ml-auto text-[11.5px] text-[var(--fg-subtle)]">
                          Your decision is recorded in the audit log
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
