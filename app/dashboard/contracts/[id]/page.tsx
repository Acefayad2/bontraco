import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft, Download, Share2, MessageSquare, Sparkles, Upload,
  FileSignature, PenLine, CheckCircle2, Eye, GitPullRequestArrow, Gavel,
} from "lucide-react";
import { ClauseAnalysis } from "@/components/dash/clause-analysis";
import { Card, CardHeader, CardTitle, CardBody, Button, Badge, Meter, Avatar } from "@/components/ui/primitives";
import { StatusBadge, RiskBadge } from "@/components/ui/status";
import { getContract, contracts, money, formatDate, formatDateTime, daysUntil } from "@/lib/data";
import type { TimelineEvent } from "@/lib/types";

export function generateStaticParams() {
  return contracts.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = getContract(id);
  return { title: c ? `${c.ref} — ${c.title}` : "Contract" };
}

const kindIcon: Record<TimelineEvent["kind"], React.ComponentType<{ className?: string }>> = {
  upload: Upload,
  ai: Sparkles,
  comment: MessageSquare,
  edit: PenLine,
  sign: FileSignature,
  approve: CheckCircle2,
  share: Share2,
};

export default async function ContractDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = getContract(id);
  if (!c) notFound();

  const flagged = c.clauses.filter((cl) => cl.risk !== "low");
  const high = c.clauses.filter((cl) => cl.risk === "high");
  const d = daysUntil(c.expiryDate);
  const noticeDeadline = d - c.renewalNotice;

  const facts = [
    { k: "Contract type", v: c.type },
    { k: "Total value", v: money(c.value) },
    { k: "Effective", v: formatDate(c.effectiveDate) },
    { k: "Expires", v: formatDate(c.expiryDate) },
    { k: "Auto-renew", v: c.autoRenew ? `Yes — ${c.renewalNotice}-day notice` : "No" },
    { k: "Governing law", v: c.governingLaw },
    { k: "Department", v: c.department },
    { k: "Length", v: `${c.pages} pages` },
  ];

  return (
    <>
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="border-b border-[var(--line)] px-4 py-6 sm:px-6 lg:px-8">
        <Link
          href="/dashboard/contracts"
          className="inline-flex cursor-pointer items-center gap-1.5 text-[12.5px] font-medium
            text-[var(--fg-muted)] transition-colors duration-200 hover:text-[var(--fg)]"
        >
          <ArrowLeft className="size-3.5" />
          All contracts
        </Link>

        <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-[12px] text-[var(--fg-subtle)]">{c.ref}</span>
              <StatusBadge status={c.status} />
              <RiskBadge risk={c.risk} score={c.riskScore} />
              <Badge tone="neutral">{c.type}</Badge>
            </div>
            <h1 className="mt-2.5 text-[26px] font-semibold tracking-[-0.025em] text-[var(--fg)]">
              {c.title}
            </h1>
            <p className="mt-1 text-[14px] text-[var(--fg-muted)]">
              {c.counterparty}
              <span className="text-[var(--fg-subtle)]"> · {c.counterpartyDomain}</span>
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button variant="outline" size="sm"><Eye className="size-3.5" />Open document</Button>
            <Button variant="outline" size="sm"><Download className="size-3.5" />Export</Button>
            <Button size="sm"><GitPullRequestArrow className="size-3.5" />Send redline</Button>
          </div>
        </div>

        {/* Metric strip */}
        <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg border
          border-[var(--line)] bg-[var(--line)] sm:grid-cols-4">
          {[
            { label: "Risk score", value: String(c.riskScore), sub: `${high.length} high · ${flagged.length} flagged`, tone: c.risk },
            { label: "Contract value", value: money(c.value, true), sub: `${c.currency} total` },
            { label: c.autoRenew ? "Notice deadline" : "Time to expiry", value: c.autoRenew ? `${Math.max(noticeDeadline, 0)}d` : `${d}d`, sub: formatDate(c.expiryDate) },
            { label: "AI confidence", value: `${c.aiConfidence}%`, sub: `${c.clauses.length} clauses extracted` },
          ].map((m) => (
            <div key={m.label} className="bg-[var(--surface)] px-4 py-3.5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--fg-subtle)]">
                {m.label}
              </div>
              <div className={`tabular mt-1.5 text-[22px] font-semibold tracking-[-0.02em]
                ${m.tone === "high" ? "text-risk-high" : m.tone === "medium" ? "text-risk-med" : "text-[var(--fg)]"}`}>
                {m.value}
              </div>
              <div className="mt-0.5 text-[12px] text-[var(--fg-muted)]">{m.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8">
        <div className="min-w-0 space-y-6">
          {/* AI summary */}
          <Card className="border-brand-600/25 bg-brand-50/60 dark:bg-brand-500/6">
            <CardBody>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center
                  rounded-lg bg-brand-600 text-white">
                  <Sparkles className="size-4" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-[14px] font-semibold">Bontraco&rsquo;s read</h2>
                    <Badge tone="accent">{c.aiConfidence}% confidence</Badge>
                  </div>
                  <p className="mt-2 text-[14px] leading-[1.7] text-[var(--fg)]">{c.summary}</p>
                  <div className="mt-3.5 flex flex-wrap gap-1.5">
                    {c.tags.map((t) => <Badge key={t} tone="neutral">{t}</Badge>)}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Clause analysis */}
          <Card className="overflow-hidden">
            <CardHeader>
              <div>
                <CardTitle>Clause analysis</CardTitle>
                <p className="mt-0.5 text-[13px] text-[var(--fg-muted)]">
                  {c.clauses.length} clauses extracted · {flagged.length} deviate from playbook ·
                  each finding carries a drafted redline
                </p>
              </div>
            </CardHeader>
            <ClauseAnalysis clauses={c.clauses} />
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader><CardTitle>Activity &amp; audit trail</CardTitle></CardHeader>
            <CardBody>
              <ol className="relative">
                <span aria-hidden className="absolute left-[15px] top-2 bottom-2 w-px bg-[var(--line)]" />
                {c.timeline.map((e) => {
                  const Icon = kindIcon[e.kind];
                  const isAI = e.kind === "ai";
                  return (
                    <li key={e.id} className="relative flex gap-4 pb-5 last:pb-0">
                      <span className={`relative z-10 flex size-8 shrink-0 items-center justify-center
                        rounded-full border ${isAI
                          ? "border-brand-600/30 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
                          : "border-[var(--line)] bg-[var(--surface-2)] text-[var(--fg-muted)]"}`}>
                        <Icon className="size-3.5" />
                      </span>
                      <div className="min-w-0 flex-1 pt-1">
                        <p className="text-[13.5px] leading-snug text-[var(--fg)]">{e.text}</p>
                        <p className="mt-1 text-[12px] text-[var(--fg-subtle)]">
                          {e.actor} · {formatDateTime(e.at)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </CardBody>
          </Card>
        </div>

        {/* ── Rail ──────────────────────────────────────────── */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Key terms</CardTitle></CardHeader>
            <dl className="divide-y divide-[var(--line)]">
              {facts.map((f) => (
                <div key={f.k} className="flex items-baseline justify-between gap-4 px-5 py-2.5">
                  <dt className="text-[12.5px] text-[var(--fg-muted)]">{f.k}</dt>
                  <dd className="tabular text-right text-[13px] font-medium">{f.v}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card>
            <CardHeader><CardTitle>Risk breakdown</CardTitle></CardHeader>
            <CardBody className="space-y-4">
              {["Liability", "Termination", "Data Protection", "Intellectual Property", "Commercial", "Compliance", "Confidentiality"]
                .map((cat) => {
                  const inCat = c.clauses.filter((cl) => cl.category === cat);
                  if (inCat.length === 0) return null;
                  const avg = Math.round(inCat.reduce((n, cl) => n + cl.deviation, 0) / inCat.length);
                  const worst = inCat.some((cl) => cl.risk === "high") ? "high"
                    : inCat.some((cl) => cl.risk === "medium") ? "medium" : "low";
                  return (
                    <div key={cat}>
                      <div className="mb-1.5 flex items-baseline justify-between gap-3">
                        <span className="text-[12.5px] font-medium">{cat}</span>
                        <span className="tabular text-[12px] text-[var(--fg-muted)]">{avg}</span>
                      </div>
                      <Meter value={avg} tone={worst as "high" | "medium" | "low"} label={`${cat} deviation`} />
                    </div>
                  );
                })}
            </CardBody>
          </Card>

          <Card>
            <CardHeader><CardTitle>Owner &amp; approvals</CardTitle></CardHeader>
            <CardBody className="space-y-3.5">
              {[
                { n: c.owner, i: c.ownerInitials, r: "Contract owner", s: "Active" },
                { n: "Dana Whitfield", i: "DW", r: "Legal review", s: c.status === "draft" ? "Pending" : "Approved" },
                { n: "Elena Ruiz", i: "ER", r: "Finance sign-off", s: c.value > 1_000_000 ? "Required" : "Not required" },
              ].map((p) => (
                <div key={p.r} className="flex items-center gap-3">
                  <Avatar initials={p.i} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium">{p.n}</p>
                    <p className="text-[11.5px] text-[var(--fg-subtle)]">{p.r}</p>
                  </div>
                  <Badge tone={p.s === "Approved" ? "accent" : p.s === "Required" || p.s === "Pending" ? "medium" : "neutral"}>
                    {p.s}
                  </Badge>
                </div>
              ))}
            </CardBody>
          </Card>

          <Card className="bg-ink-900 text-white dark:bg-[var(--surface-2)] dark:text-[var(--fg)]">
            <CardBody>
              <Gavel className="size-5 text-brand-400" />
              <h3 className="mt-3 text-[14px] font-semibold">Compare with precedent</h3>
              <p className="mt-1.5 text-[12.5px] leading-[1.6] text-ink-300 dark:text-[var(--fg-muted)]">
                Bontraco found 6 executed agreements with a comparable scope. Their median liability
                cap is 1.2× — this one sits at 3×.
              </p>
              <Button size="sm" variant="outline" className="mt-4 w-full border-ink-600 bg-transparent
                text-white hover:bg-ink-800 dark:border-[var(--line-strong)] dark:text-[var(--fg)]
                dark:hover:bg-[var(--surface)]">
                View 6 precedents
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
