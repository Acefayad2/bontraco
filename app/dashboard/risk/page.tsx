import Link from "next/link";
import { AlertTriangle, ShieldAlert, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/dash/page-header";
import { ClauseHeatChart } from "@/components/dash/charts";
import { Card, CardHeader, CardTitle, CardDescription, CardBody, Badge, Button, Meter } from "@/components/ui/primitives";
import { money } from "@/lib/data";
import { requireSession } from "@/lib/server/auth";
import { dashboardData } from "@/lib/server/views";

export const metadata = { title: "Risk register" };
export const dynamic = "force-dynamic";

export default async function RiskPage() {
  const session = await requireSession();
  const { clauseHeat, contracts } = dashboardData(session.orgId);

  /* Flatten every non-low finding across the portfolio, worst first. */
  const findings = contracts
    .flatMap((c) => c.clauses
      .filter((cl) => cl.risk !== "low")
      .map((cl) => ({ ...cl, contract: c })))
    .sort((a, b) => b.deviation - a.deviation);

  const high = findings.filter((f) => f.risk === "high");
  const exposed = [...new Set(high.map((f) => f.contract.id))]
    .reduce((n, id) => n + (contracts.find((c) => c.id === id)?.value ?? 0), 0);

  return (
    <>
      <PageHeader
        title="Risk register"
        description="Every clause across the portfolio that deviates from Vendor Playbook v4, ranked by deviation score. This is the queue counsel should work from."
        actions={<Button variant="outline" size="sm">Export to CSV</Button>}
      />

      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 xl:grid-cols-1">
            {[
              { icon: ShieldAlert, label: "Open findings", value: String(findings.length), sub: `${high.length} rated high` },
              { icon: AlertTriangle, label: "Value exposed", value: money(exposed, true), sub: "Contracts carrying a high finding" },
              { icon: Sparkles, label: "Redlines drafted", value: String(findings.length), sub: "One per finding, ready to send" },
            ].map((s) => (
              <Card key={s.label}>
                <CardBody>
                  <s.icon className="size-[18px] text-[var(--fg-subtle)]" />
                  <div className="mt-3 text-[11.5px] font-semibold uppercase tracking-[0.1em]
                    text-[var(--fg-subtle)]">{s.label}</div>
                  <div className="tabular mt-1.5 text-[26px] font-semibold tracking-[-0.02em]">{s.value}</div>
                  <p className="mt-1 text-[12.5px] text-[var(--fg-muted)]">{s.sub}</p>
                </CardBody>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Where the flags land</CardTitle>
                <CardDescription>
                  Liability and termination account for more than half of all findings
                </CardDescription>
              </div>
            </CardHeader>
            <CardBody className="pt-5"><ClauseHeatChart clauseHeat={clauseHeat} /></CardBody>
          </Card>
        </div>

        <Card className="mt-6 overflow-hidden">
          <CardHeader>
            <div>
              <CardTitle>All open findings</CardTitle>
              <CardDescription>Ranked by deviation from your standard position</CardDescription>
            </div>
          </CardHeader>
          <ul className="divide-y divide-[var(--line)]">
            {findings.map((f) => (
              <li key={`${f.contract.id}-${f.id}`}>
                <Link
                  href={`/dashboard/contracts/${f.contract.id}`}
                  className="flex cursor-pointer flex-col gap-3 px-5 py-4 transition-colors
                    duration-200 hover:bg-[var(--surface-2)] sm:flex-row sm:items-center"
                >
                  <span className={`inline-flex size-8 shrink-0 items-center justify-center rounded-lg
                    ${f.risk === "high"
                      ? "bg-risk-high-bg text-risk-high dark:bg-risk-high/15"
                      : "bg-risk-med-bg text-risk-med dark:bg-risk-med/15"}`}>
                    <AlertTriangle className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[14px] font-medium">{f.title}</span>
                      <Badge tone="neutral" className="!py-0 !text-[10px]">{f.category}</Badge>
                    </div>
                    <p className="mt-1 truncate text-[12.5px] text-[var(--fg-muted)]">{f.finding}</p>
                    <p className="mt-1 text-[12px] text-[var(--fg-subtle)]">
                      <span className="font-mono">{f.contract.ref}</span> · {f.contract.title} · {f.contract.counterparty}
                    </p>
                  </div>
                  <div className="w-full shrink-0 sm:w-[120px]">
                    <div className="mb-1.5 flex items-baseline justify-between">
                      <span className="text-[10.5px] uppercase tracking-wider text-[var(--fg-subtle)]">
                        Deviation
                      </span>
                      <span className="tabular text-[12px] font-semibold">{f.deviation}</span>
                    </div>
                    <Meter
                      value={f.deviation}
                      tone={f.risk === "high" ? "high" : "medium"}
                      label={`Deviation for ${f.title}`}
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
