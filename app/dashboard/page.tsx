import Link from "next/link";
import {
  AlertTriangle, ArrowRight, CalendarClock, FileText, Gauge,
  Sparkles, Wallet, Clock, CircleCheck, CircleAlert,
} from "lucide-react";
import { PageHeader } from "@/components/dash/page-header";
import { StatTile } from "@/components/dash/stat-tile";
import { CycleTimeChart, RiskDonut, ValueByDeptChart } from "@/components/dash/charts";
import { Card, CardHeader, CardTitle, CardDescription, CardBody, Button, Badge, Meter, Avatar } from "@/components/ui/primitives";
import { StatusBadge, RiskBadge } from "@/components/ui/status";
import {
  contracts, obligations, portfolioValue, activeCount, inReviewCount,
  highRiskCount, openFindings, money, formatDate, daysUntil, renewalRunway,
} from "@/lib/data";

export const metadata = { title: "Overview" };

export default function DashboardHome() {
  const attention = contracts
    .filter((c) => c.risk === "high" || c.status === "expiring" || c.status === "expired")
    .slice(0, 4);

  const dueSoon = obligations
    .filter((o) => o.status === "overdue" || o.status === "due_soon")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const upcomingRenewals = renewalRunway.slice(0, 5);

  return (
    <>
      <PageHeader
        title="Overview"
        description="Portfolio position as of 9 September 2026. Bontraco has read every contract below and scored it against Vendor Playbook v4."
        actions={
          <>
            <Link href="/dashboard/assistant">
              <Button variant="outline" size="sm">
                <Sparkles className="size-3.5" />
                Ask Bontraco
              </Button>
            </Link>
            <Link href="/dashboard/contracts">
              <Button size="sm">
                All contracts
                <ArrowRight className="size-3.5" />
              </Button>
            </Link>
          </>
        }
      />

      <div className="px-4 py-6 sm:px-6 lg:px-8">
        {/* ── KPI row ─────────────────────────────────────────── */}
        <Card className="overflow-hidden p-0">
          <div className="grid grid-cols-1 divide-y divide-[var(--line)] sm:grid-cols-2 sm:divide-y-0
            lg:grid-cols-4 lg:divide-x">
            <StatTile
              icon={Wallet} label="Portfolio value" value={money(portfolioValue, true)}
              delta="+12.4%" deltaTone="up-good" sub="Total contract value under management"
            />
            <StatTile
              icon={FileText} label="Active contracts" value={String(activeCount)}
              delta={`${inReviewCount} in flight`} sub="Executed or approaching expiry"
            />
            <StatTile
              icon={AlertTriangle} label="High-risk agreements" value={String(highRiskCount)}
              delta="+1 this week" deltaTone="up-bad" sub={`${openFindings} clause findings still open`}
            />
            <StatTile
              icon={Clock} label="Median review time" value="4.1d"
              delta="−81%" deltaTone="down-good" sub="Down from 21 days pre-deployment"
            />
          </div>
        </Card>

        {/* ── Charts ──────────────────────────────────────────── */}
        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Review cycle time</CardTitle>
                <CardDescription>
                  Median days from receipt to signature. Dashed line is the manual baseline held by
                  contracts routed around Bontraco.
                </CardDescription>
              </div>
              <Badge tone="accent">7 months</Badge>
            </CardHeader>
            <CardBody className="pt-5">
              <CycleTimeChart />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Risk mix</CardTitle>
                <CardDescription>Portfolio scored against Vendor Playbook v4</CardDescription>
              </div>
            </CardHeader>
            <CardBody className="pt-3">
              <RiskDonut />
              <ul className="mt-3 space-y-2.5">
                {[
                  { k: "high", label: "High", n: contracts.filter((c) => c.risk === "high").length, note: "Escalate to counsel" },
                  { k: "medium", label: "Medium", n: contracts.filter((c) => c.risk === "medium").length, note: "Negotiate on renewal" },
                  { k: "low", label: "Low", n: contracts.filter((c) => c.risk === "low").length, note: "Within playbook" },
                ].map((r) => (
                  <li key={r.k} className="flex items-center gap-3 text-[13px]">
                    <span
                      className={`size-2.5 shrink-0 rounded-full ${
                        r.k === "high" ? "bg-risk-high" : r.k === "medium" ? "bg-risk-med" : "bg-risk-low"
                      }`}
                      aria-hidden
                    />
                    <span className="font-medium">{r.label}</span>
                    <span className="text-[var(--fg-subtle)]">{r.note}</span>
                    <span className="tabular ml-auto font-semibold">{r.n}</span>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </div>

        {/* ── Needs attention + obligations ───────────────────── */}
        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Needs your attention</CardTitle>
                <CardDescription>
                  Highest residual risk after Bontraco&rsquo;s latest pass
                </CardDescription>
              </div>
              <Link href="/dashboard/risk">
                <Button variant="ghost" size="sm">View risk register</Button>
              </Link>
            </CardHeader>
            <ul className="divide-y divide-[var(--line)]">
              {attention.map((c) => {
                const openFlags = c.clauses.filter((cl) => cl.risk !== "low");
                return (
                  <li key={c.id}>
                    <Link
                      href={`/dashboard/contracts/${c.id}`}
                      className="group flex cursor-pointer items-start gap-4 px-5 py-4
                        transition-colors duration-200 hover:bg-[var(--surface-2)]"
                    >
                      <span className={`mt-0.5 inline-flex size-8 shrink-0 items-center justify-center
                        rounded-lg ${c.risk === "high"
                          ? "bg-risk-high-bg text-risk-high dark:bg-risk-high/15"
                          : "bg-risk-med-bg text-risk-med dark:bg-risk-med/15"}`}>
                        <AlertTriangle className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                          <span className="truncate text-[14px] font-medium text-[var(--fg)]">
                            {c.title}
                          </span>
                          <span className="font-mono text-[11px] text-[var(--fg-subtle)]">{c.ref}</span>
                        </div>
                        <p className="mt-0.5 text-[12.5px] text-[var(--fg-muted)]">
                          {c.counterparty} · {money(c.value, true)} · {openFlags.length} open findings
                        </p>
                        <div className="mt-2.5 flex flex-wrap items-center gap-2">
                          <StatusBadge status={c.status} />
                          <RiskBadge risk={c.risk} score={c.riskScore} />
                          {c.status === "expiring" && (
                            <Badge tone="medium">
                              <CalendarClock className="size-3" />
                              {daysUntil(c.expiryDate)} days to expiry
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="hidden w-32 shrink-0 pt-1 sm:block">
                        <div className="mb-1.5 flex items-baseline justify-between">
                          <span className="text-[10.5px] uppercase tracking-wider text-[var(--fg-subtle)]">
                            Risk
                          </span>
                          <span className="tabular text-[12px] font-semibold">{c.riskScore}</span>
                        </div>
                        <Meter
                          value={c.riskScore}
                          tone={c.risk === "high" ? "high" : c.risk === "medium" ? "medium" : "low"}
                          label={`Risk score for ${c.title}`}
                        />
                      </div>
                      <ArrowRight className="mt-1.5 size-4 shrink-0 text-[var(--fg-subtle)]
                        transition-transform duration-200 group-hover:translate-x-0.5" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Obligations due</CardTitle>
                <CardDescription>Overdue and within 14 days</CardDescription>
              </div>
              <Link href="/dashboard/obligations">
                <Button variant="ghost" size="sm">All</Button>
              </Link>
            </CardHeader>
            <ul className="divide-y divide-[var(--line)]">
              {dueSoon.map((o) => (
                <li key={o.id} className="px-5 py-3.5">
                  <div className="flex items-start gap-3">
                    {o.status === "overdue"
                      ? <CircleAlert className="mt-0.5 size-4 shrink-0 text-risk-high" />
                      : <CircleCheck className="mt-0.5 size-4 shrink-0 text-risk-med" />}
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium leading-snug">{o.description}</p>
                      <p className="mt-1 text-[12px] text-[var(--fg-muted)]">
                        {o.counterparty} · {o.owner}
                      </p>
                    </div>
                    <span className={`tabular shrink-0 text-[11.5px] font-medium
                      ${o.status === "overdue" ? "text-risk-high" : "text-risk-med"}`}>
                      {o.status === "overdue"
                        ? `${Math.abs(daysUntil(o.dueDate))}d late`
                        : `${daysUntil(o.dueDate)}d`}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            <CardBody className="border-t border-[var(--line)] bg-[var(--surface-2)]">
              <p className="text-[12.5px] leading-snug text-[var(--fg-muted)]">
                <span className="font-medium text-[var(--fg)]">2 items are overdue.</span>{" "}
                Both trace to the same root cause — the Aperture SOW notice window lapsed on 31 August.
              </p>
            </CardBody>
          </Card>
        </div>

        {/* ── Renewal runway + value split ────────────────────── */}
        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Renewal runway</CardTitle>
                <CardDescription>Next five agreements to reach a decision point</CardDescription>
              </div>
              <Link href="/dashboard/renewals">
                <Button variant="ghost" size="sm">Calendar</Button>
              </Link>
            </CardHeader>
            <ul className="divide-y divide-[var(--line)]">
              {upcomingRenewals.map((c) => {
                const d = daysUntil(c.expiryDate);
                const noticeDeadline = d - c.renewalNotice;
                const urgent = noticeDeadline <= 30;
                return (
                  <li key={c.id} className="flex items-center gap-4 px-5 py-3.5">
                    <Avatar initials={c.ownerInitials} />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/dashboard/contracts/${c.id}`}
                        className="block cursor-pointer truncate text-[13.5px] font-medium
                          transition-colors duration-200 hover:text-[var(--accent)]"
                      >
                        {c.title}
                      </Link>
                      <p className="mt-0.5 truncate text-[12px] text-[var(--fg-muted)]">
                        {c.counterparty} · expires {formatDate(c.expiryDate)}
                        {c.autoRenew && " · auto-renews"}
                      </p>
                    </div>
                    <Badge tone={urgent ? "high" : d < 120 ? "medium" : "neutral"}>
                      {c.autoRenew
                        ? `Notice in ${Math.max(noticeDeadline, 0)}d`
                        : `${d}d`}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Value by department</CardTitle>
                <CardDescription>Total contract value, current portfolio</CardDescription>
              </div>
              <Badge tone="neutral">
                <Gauge className="size-3" />
                {money(portfolioValue, true)}
              </Badge>
            </CardHeader>
            <CardBody className="pt-5">
              <ValueByDeptChart />
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
