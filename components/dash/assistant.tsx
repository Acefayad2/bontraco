"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUp, FileText, Sparkles, User, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/primitives";

interface Cite { ref: string; id: string; note: string }
interface Msg { role: "user" | "assistant"; text: string; cites?: Cite[]; thinking?: string }

/* Canned exchanges — a demo environment, so answers are written, not inferred. */
const canned: { q: string; a: Msg }[] = [
  {
    q: "Which contracts expose us to more than a 1× liability cap?",
    a: {
      role: "assistant",
      thinking: "Searching 12 contracts · matching clause category 'Liability' · comparing to Vendor Playbook v4 §2.1",
      text:
        "Three agreements carry a cap above your 1× standard.\n\n" +
        "The Northwind MSA is the outlier at 3× trailing twelve-month fees — on $2.45M TCV that is roughly $7.35M of theoretical exposure. Aperture and Sentinel both sit at 2×, though Sentinel's is worse in practice because its multiplier applies to monthly rather than annual fees, which for a security vendor caps recovery far below the loss the service exists to prevent.\n\n" +
        "Northwind is the one to move on. It is still in review, so the cap is negotiable now; the other two are executed and would need a renewal to reopen.",
      cites: [
        { ref: "BC-2026-0412", id: "bc-2026-0412", note: "3× cap · §11.2 · in review" },
        { ref: "BC-2026-0341", id: "bc-2026-0341", note: "2× cap · executed" },
        { ref: "BC-2026-0271", id: "bc-2026-0271", note: "2× monthly fees · draft" },
      ],
    },
  },
  {
    q: "What renews in the next 90 days and what happens if we do nothing?",
    a: {
      role: "assistant",
      thinking: "Filtering by expiry ≤ 2026-12-08 · resolving notice windows · checking auto-renew flags",
      text:
        "Two agreements reach a decision point, and doing nothing produces a different outcome for each.\n\n" +
        "The Aperture SOW expires on 30 September with two milestones still unaccepted. It does not auto-renew, so inaction ends it — but it also ends your acceptance leverage, and §15 leaves the migration scripts owned by Aperture.\n\n" +
        "Lumen Creative auto-renews on 14 November unless notice is served by 15 October. Inaction there commits another twelve months at $340k. Nothing in the agreement is objectionable; this is purely a commercial decision about whether you still want the retainer.\n\n" +
        "One is a deadline you can miss by accident. The other is a deadline that costs $340k if you miss it.",
      cites: [
        { ref: "BC-2026-0341", id: "bc-2026-0341", note: "Expires 30 Sep · no auto-renew" },
        { ref: "BC-2026-0256", id: "bc-2026-0256", note: "Notice by 15 Oct · $340k" },
      ],
    },
  },
  {
    q: "Summarise our exposure with Helios across every agreement.",
    a: {
      role: "assistant",
      thinking: "Grouping by counterparty 'Helios Cloud Systems' · 2 agreements · aggregating value and findings",
      text:
        "You hold two agreements with Helios totalling $1.95M, and the risk sits almost entirely in the addendum rather than the commercial contract.\n\n" +
        "The Cloud Infrastructure Agreement is a two-year committed-spend deal tracking at 78% of the commit with five months left. A shortfall forfeits the tier-2 discount, worth about $147k — that is a consumption problem, not a legal one.\n\n" +
        "The DPA is the blocking item. Helios may appoint sub-processors at its sole discretion with no notice and no objection right, which fails Art. 28(2) GDPR, and its 72-hour breach window consumes the entire regulator deadline. Security has conditioned sign-off on both.\n\n" +
        "Because the DPA is unsigned while the infrastructure agreement is already executed and being consumed, your leverage is weaker than it looks. Worth resolving before the next true-up.",
      cites: [
        { ref: "BC-2026-0398", id: "bc-2026-0398", note: "DPA · awaiting signature · 2 blocking findings" },
        { ref: "BC-2026-0304", id: "bc-2026-0304", note: "Infrastructure · executed · $1.95M" },
      ],
    },
  },
];

const suggestions = canned.map((c) => c.q);

export function Assistant() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, pending]);

  function ask(q: string) {
    if (!q.trim() || pending) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setPending(true);

    const match = canned.find((c) => c.q === q)
      ?? canned.find((c) => {
        const words = q.toLowerCase().split(/\W+/).filter((w) => w.length > 4);
        return words.some((w) => c.q.toLowerCase().includes(w));
      });

    const reply: Msg = match?.a ?? {
      role: "assistant",
      thinking: "Searching 12 contracts · 41 clause types · Vendor Playbook v4",
      text:
        "This is a demonstration workspace, so I answer from a fixed set of worked examples rather than a live model.\n\n" +
        "Try one of the suggested questions below — each one runs against the full contract set and cites the agreements it drew from.",
    };

    const t = setTimeout(() => {
      setMessages((m) => [...m, reply]);
      setPending(false);
    }, 1100);
    return () => clearTimeout(t);
  }

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col">
      <div className="flex-1 overflow-y-auto thin-scroll">
        <div className="mx-auto max-w-[760px] px-4 py-8 sm:px-6">
          {messages.length === 0 && (
            <div className="animate-fade-up">
              <span className="inline-flex size-11 items-center justify-center rounded-xl
                bg-brand-600 text-white">
                <Sparkles className="size-5" />
              </span>
              <h1 className="mt-5 text-[26px] font-semibold tracking-[-0.025em]">
                Ask Bontraco
              </h1>
              <p className="mt-2 max-w-[58ch] text-[14.5px] leading-[1.65] text-[var(--fg-muted)]">
                Ask a question across all 12 contracts. Bontraco answers from the clause
                text it extracted and cites every agreement it drew from — so you can check the source.
              </p>

              <div className="mt-8 space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--fg-subtle)]">
                  Try one of these
                </p>
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => ask(s)}
                    className="group flex w-full cursor-pointer items-center gap-3 rounded-lg border
                      border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-left
                      transition-all duration-200 hover:border-[var(--line-strong)]
                      hover:bg-[var(--surface-2)]"
                  >
                    <Sparkles className="size-4 shrink-0 text-brand-600" />
                    <span className="text-[13.5px]">{s}</span>
                    <ArrowUp className="ml-auto size-3.5 shrink-0 rotate-45 text-[var(--fg-subtle)]
                      transition-transform duration-200 group-hover:translate-x-0.5
                      group-hover:-translate-y-0.5" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-7">
            {messages.map((m, i) => (
              <div key={i} className="animate-fade-up">
                {m.role === "user" ? (
                  <div className="flex justify-end">
                    <div className="flex max-w-[80%] items-start gap-3">
                      <p className="rounded-2xl rounded-tr-sm bg-ink-900 px-4 py-2.5 text-[14px]
                        leading-relaxed text-white dark:bg-[var(--surface-2)] dark:text-[var(--fg)]">
                        {m.text}
                      </p>
                      <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center
                        rounded-full bg-[var(--surface-2)] text-[var(--fg-muted)]">
                        <User className="size-3.5" />
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center
                      rounded-full bg-brand-600 text-white">
                      <Sparkles className="size-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      {m.thinking && (
                        <p className="mb-2.5 font-mono text-[11px] text-[var(--fg-subtle)]">
                          {m.thinking}
                        </p>
                      )}
                      {m.text.split("\n\n").map((para, pi) => (
                        <p key={pi} className="mb-3 text-[14.5px] leading-[1.7] text-[var(--fg)] last:mb-0">
                          {para}
                        </p>
                      ))}
                      {m.cites && (
                        <div className="mt-4">
                          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em]
                            text-[var(--fg-subtle)]">
                            Sources
                          </p>
                          <div className="space-y-1.5">
                            {m.cites.map((c) => (
                              <Link
                                key={c.ref}
                                href={`/dashboard/contracts/${c.id}`}
                                className="flex cursor-pointer items-center gap-2.5 rounded-md border
                                  border-[var(--line)] bg-[var(--surface)] px-3 py-2
                                  transition-colors duration-200 hover:bg-[var(--surface-2)]"
                              >
                                <FileText className="size-3.5 shrink-0 text-[var(--fg-subtle)]" />
                                <span className="font-mono text-[11.5px] text-[var(--fg)]">{c.ref}</span>
                                <span className="truncate text-[12px] text-[var(--fg-muted)]">{c.note}</span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {pending && (
              <div className="flex items-start gap-3">
                <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full
                  bg-brand-600 text-white animate-pulse-ring">
                  <Sparkles className="size-3.5" />
                </span>
                <div className="pt-1.5 flex gap-1" aria-label="Bontraco is thinking">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="size-1.5 animate-bounce rounded-full bg-[var(--fg-subtle)]"
                      style={{ animationDelay: `${i * 140}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
          <div ref={endRef} />
        </div>
      </div>

      {/* ── Composer ────────────────────────────────────────── */}
      <div className="border-t border-[var(--line)] bg-[var(--surface)] px-4 py-4 sm:px-6">
        <form
          onSubmit={(e) => { e.preventDefault(); ask(input); }}
          className="mx-auto max-w-[760px]"
        >
          <div className="flex items-end gap-2 rounded-xl border border-[var(--line)]
            bg-[var(--bg)] p-2 transition-colors duration-200 focus-within:border-[var(--ring)]">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(input); }
              }}
              rows={1}
              placeholder="Ask about any clause, counterparty, or deadline…"
              aria-label="Ask Bontraco a question"
              className="max-h-32 min-h-[38px] flex-1 resize-none bg-transparent px-2.5 py-2
                text-[14px] leading-relaxed placeholder:text-[var(--fg-subtle)] focus:outline-none"
            />
            {messages.length > 0 && (
              <Button
                type="button" variant="ghost" size="sm"
                onClick={() => { setMessages([]); setInput(""); }}
                aria-label="Start a new conversation"
              >
                <RotateCcw className="size-3.5" />
              </Button>
            )}
            <Button type="submit" size="sm" disabled={!input.trim() || pending} aria-label="Send">
              <ArrowUp className="size-4" />
            </Button>
          </div>
          <p className="mt-2 text-center text-[11.5px] text-[var(--fg-subtle)]">
            Answers cite the contracts they draw from. Demonstration workspace — responses are
            worked examples, not live model output.
          </p>
        </form>
      </div>
    </div>
  );
}
