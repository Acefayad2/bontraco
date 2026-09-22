import Link from "next/link";
import { CalendarClock, RefreshCw, TrendingUp, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/dash/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardBody, Button, Badge, Avatar, Meter } from "@/components/ui/primitives";
import { StatusBadge } from "@/components/ui/status";
import { money, formatDate, daysUntil } from "@/lib/data";
import { requireSession } from "@/lib/server/auth";
import { dashboardData } from "@/lib/server/views";

export const metadata = { title: "Renewals" };
export const dynamic = "force-dynamic";

const quarters = [
  { label: "Q4 2026", from: "2026-10-01", to: "2026-12-31" },
  { label: "Q1 2027", from: "2027-01-01", to: "2027-03-31" },
  { label: "Q2 2027", from: "2027-04-01", to: "2027-06-30" },
  { label: "Later", from: "2027-07-01", to: "2099-12-31" },
];

export default async function RenewalsPage() {
  const session = await requireSession();
  const { contracts, renewalRunway } = await dashboardData(session.orgId);

  const next90 = renewalRunway.filter((c) => daysUntil(c.expiryDate) <= 90);
  const atRiskValue = next90.reduce((n, c) => n + c.value, 0);
  const autoRenewing = contracts.filter((c) => c.autoRenew && daysUntil(c.expiryDate) > 0);

  return (
    <>
      <PageHeader
        title="Renewals"
        description="Every agreement approaching a decision point, ordered by the date the decision actually has to be made — the notice deadline, not the expiry date."
        actions={<Button size="sm"><CalendarClock className="size-3.5" />Sync to calendar</Button>}
      />

      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { icon: AlertTriangle, label: "Decisions in 90 days", value: String(next90.length), sub: `${money(atRiskValue, true)} of contract value`, tone: "med" },
            { icon: RefreshCw, label: "Auto-renewing", value: String(autoRenewing.length), sub: "Will renew unless notice is served" },
            { icon: TrendingUp, label: "Renewal uplift exposure", value: "$183k", sub: "If every escalation clause fires at cap" },
          ].map((s) => (
            <Card key={s.label}>
              <CardBody>
                <s.icon className={`size-[18px] ${s.tone === "med" ? "text-risk-med" : "text-[var(--fg-subtle)]"}`} />
                <div className="mt-3 text-[11.5px] font-semibold uppercase tracking-[0.1em] text-[var(--fg-subtle)]">
                  {s.label}
                </div>
                <div className="tabular mt-1.5 text-[26px] font-semibold tracking-[-0.02em]">{s.value}</div>
                <p className="mt-1 text-[12.5px] text-[var(--fg-muted)]">{s.sub}</p>
              </CardBody>
            </Card>
          ))}
        </div>

        <div className="mt-6 space-y-6">
          {quarters.map((q) => {
            const items = renewalRunway.filter(
              (c) => c.expiryDate >= q.from && c.expiryDate <= q.to);
            if (items.length === 0) return null;
            return (
              <Card key={q.label}>
                <CardHeader>
                  <div>
                    <CardTitle className="flex items-center gap-2.5">
                      {q.label}
                      <Badge tone="neutral">{items.length}</Badge>
                    </CardTitle>
                    <CardDescription>
                      {money(items.reduce((n, c) => n + c.value, 0), true)} of contract value
                    </CardDescription>
                  </div>
                </CardHeader>
                <ul className="divide-y divide-[var(--line)]">
                  {items.map((c) => {
                    const d = daysUntil(c.expiryDate);
                    const notice = d - c.renewalNotice;
                    const urgent = c.autoRenew && notice <= 45;
                    /* runway bar: how much of the notice window is left */
                    const pct = Math.max(0, Math.min(100, (notice / Math.max(d, 1)) * 100));
                    return (
                      <li key={c.id} className="flex flex-col gap-3 px-5 py-4 xl:flex-row xl:items-center">
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/dashboard/contracts/${c.id}`}
                            className="cursor-pointer text-[14px] font-medium transition-colors
                              duration-200 hover:text-[var(--accent)]"
                          >
                            {c.title}
                          </Link>
                          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1
                            text-[12.5px] text-[var(--fg-muted)]">
                            <span className="font-mono text-[11px] text-[var(--fg-subtle)]">{c.ref}</span>
                            <span>{c.counterparty}</span>
                            <span className="text-[var(--fg-subtle)]">·</span>
                            <span className="tabular">{money(c.value, true)}</span>
                          </p>
                        </div>

                        <div className="w-full shrink-0 xl:w-[200px]">
                          <div className="mb-1.5 flex items-baseline justify-between gap-2">
                            <span className="text-[11px] text-[var(--fg-subtle)]">
                              {c.autoRenew ? `${c.renewalNotice}-day notice window` : "Runs to expiry"}
                            </span>
                            <span className={`tabular text-[11.5px] font-medium ${
                              urgent ? "text-risk-high" : "text-[var(--fg-muted)]"}`}>
                              {c.autoRenew ? `${Math.max(notice, 0)}d to decide` : `${d}d`}
                            </span>
                          </div>
                          <Meter
                            value={pct}
                            tone={urgent ? "high" : notice < 90 ? "medium" : "accent"}
                            label={`Notice runway for ${c.title}`}
                          />
                        </div>

                        <div className="flex shrink-0 flex-wrap items-center gap-2.5">
                          <StatusBadge status={c.status} />
                          {c.autoRenew
                            ? <Badge tone={urgent ? "high" : "medium"}><RefreshCw className="size-3" />Auto-renews</Badge>
                            : <Badge tone="neutral">Manual</Badge>}
                          <span className="tabular hidden w-[92px] text-right text-[12.5px]
                            text-[var(--fg-muted)] sm:block">
                            {formatDate(c.expiryDate)}
                          </span>
                          <Avatar initials={c.ownerInitials} className="size-6 text-[10px]" />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
}
