import { PageHeader } from "@/components/dash/page-header";
import { CycleTimeChart, ValueByDeptChart, RiskDonut, ClauseHeatChart } from "@/components/dash/charts";
import { StatTile } from "@/components/dash/stat-tile";
import { Card, CardHeader, CardTitle, CardDescription, CardBody, Badge, Button } from "@/components/ui/primitives";
import { Clock, FileCheck2, Percent, Users, Download } from "lucide-react";
import { money } from "@/lib/data";
import { requireSession } from "@/lib/server/auth";
import { dashboardData } from "@/lib/server/views";

export const metadata = { title: "Analytics" };
export const dynamic = "force-dynamic";

const negotiationOutcomes = [
  { position: "Liability cap reduced to 1×", won: 11, total: 14 },
  { position: "Auto-renew notice cut to 30 days", won: 9, total: 12 },
  { position: "Deliverable IP assigned on payment", won: 7, total: 11 },
  { position: "Sub-processor objection right added", won: 6, total: 8 },
  { position: "Escalation capped at CPI or 3%", won: 5, total: 13 },
  { position: "Venue moved to Delaware", won: 4, total: 10 },
];

const owners = [
  { name: "Priya Raman", dept: "Procurement", n: 4, value: 6_720_000, median: 3.6 },
  { name: "Marcus Chen", dept: "IT & Engineering", n: 3, value: 3_130_000, median: 4.4 },
  { name: "Dana Whitfield", dept: "Legal", n: 3, value: 5_005_000, median: 2.1 },
  { name: "Sofia Alvarez", dept: "Sales & Marketing", n: 3, value: 4_260_000, median: 6.8 },
];

export default async function AnalyticsPage() {
  const session = await requireSession();
  const { clauseHeat, contracts, portfolioValue, riskDistribution, valueByDept } = await dashboardData(session.orgId);

  return (
    <>
      <PageHeader
        title="Analytics"
        description="How the portfolio is behaving — cycle time, where risk concentrates, and which negotiating positions your team actually wins."
        actions={<Button variant="outline" size="sm"><Download className="size-3.5" />Download report</Button>}
      />

      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <Card className="overflow-hidden p-0">
          <div className="grid grid-cols-1 divide-y divide-[var(--line)] sm:grid-cols-2 sm:divide-y-0
            lg:grid-cols-4 lg:divide-x">
            <StatTile icon={Clock} label="Median cycle" value="4.1d" delta="−81%" deltaTone="down-good" sub="Receipt to signature" />
            <StatTile icon={FileCheck2} label="Contracts processed" value={String(contracts.length)} delta="+3 this quarter" sub={`${money(portfolioValue, true)} total value`} />
            <StatTile icon={Percent} label="Playbook win rate" value="61%" delta="+14 pts" deltaTone="up-good" sub="Positions held in negotiation" />
            <StatTile icon={Users} label="Active reviewers" value="4" sub="Across 6 departments" />
          </div>
        </Card>

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Cycle time trend</CardTitle>
                <CardDescription>Median days to signature, seven-month view</CardDescription>
              </div>
              <Badge tone="accent">−17 days</Badge>
            </CardHeader>
            <CardBody className="pt-5"><CycleTimeChart /></CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Risk mix</CardTitle>
                <CardDescription>Current portfolio</CardDescription>
              </div>
            </CardHeader>
            <CardBody className="pt-3"><RiskDonut riskDistribution={riskDistribution} /></CardBody>
          </Card>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Clause findings by category</CardTitle>
                <CardDescription>Flagged against total reviewed</CardDescription>
              </div>
            </CardHeader>
            <CardBody className="pt-5"><ClauseHeatChart clauseHeat={clauseHeat} /></CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Value by department</CardTitle>
                <CardDescription>Total contract value under management</CardDescription>
              </div>
            </CardHeader>
            <CardBody className="pt-5"><ValueByDeptChart valueByDept={valueByDept} /></CardBody>
          </Card>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Negotiation outcomes</CardTitle>
                <CardDescription>
                  How often each playbook position survives to signature
                </CardDescription>
              </div>
            </CardHeader>
            <CardBody className="space-y-4">
              {negotiationOutcomes.map((o) => {
                const pct = Math.round((o.won / o.total) * 100);
                return (
                  <div key={o.position}>
                    <div className="mb-1.5 flex items-baseline justify-between gap-4">
                      <span className="text-[13px] font-medium">{o.position}</span>
                      <span className="tabular shrink-0 text-[12.5px] text-[var(--fg-muted)]">
                        {o.won}/{o.total} · {pct}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
                      <div
                        className={`h-full rounded-full ${
                          pct >= 70 ? "bg-risk-low" : pct >= 50 ? "bg-[var(--accent)]" : "bg-risk-med"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardBody>
            <CardBody className="border-t border-[var(--line)] bg-[var(--surface-2)]">
              <p className="text-[12.5px] leading-snug text-[var(--fg-muted)]">
                <span className="font-medium text-[var(--fg)]">Venue is your weakest position.</span>{" "}
                It is conceded six times in ten — usually late, as a closing concession. Trading it
                deliberately and earlier would buy leverage on the liability cap.
              </p>
            </CardBody>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader>
              <div>
                <CardTitle>By contract owner</CardTitle>
                <CardDescription>Volume, value and median review time</CardDescription>
              </div>
            </CardHeader>
            <div className="overflow-x-auto thin-scroll">
              <table className="w-full min-w-[440px] text-[13px]">
                <thead>
                  <tr className="border-b border-[var(--line)] bg-[var(--surface-2)] text-[11.5px]
                    uppercase tracking-[0.06em] text-[var(--fg-subtle)]">
                    <th scope="col" className="px-5 py-2.5 text-left font-medium">Owner</th>
                    <th scope="col" className="px-5 py-2.5 text-right font-medium">Contracts</th>
                    <th scope="col" className="px-5 py-2.5 text-right font-medium">Value</th>
                    <th scope="col" className="px-5 py-2.5 text-right font-medium">Median days</th>
                  </tr>
                </thead>
                <tbody>
                  {owners.map((o) => (
                    <tr key={o.name} className="border-b border-[var(--line)] last:border-0
                      transition-colors duration-150 hover:bg-[var(--surface-2)]">
                      <td className="px-5 py-3">
                        <div className="font-medium">{o.name}</div>
                        <div className="text-[11.5px] text-[var(--fg-subtle)]">{o.dept}</div>
                      </td>
                      <td className="tabular px-5 py-3 text-right">{o.n}</td>
                      <td className="tabular px-5 py-3 text-right font-medium">{money(o.value, true)}</td>
                      <td className="tabular px-5 py-3 text-right">
                        <span className={o.median > 5 ? "text-risk-med" : "text-risk-low"}>
                          {o.median.toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
