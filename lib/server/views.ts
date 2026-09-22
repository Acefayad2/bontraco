import "server-only";
import { listContracts, listObligations, orgStats } from "./repo";
import type { Contract, Obligation } from "@/lib/types";

/* Derived views the dashboard pages need.
 *
 * These used to be module-level constants computed over the mock array in
 * lib/data.ts. They are now functions of an org, because the numbers belong to
 * a tenant rather than to the process. */

export interface DashboardData {
  contracts: Contract[];
  obligations: Obligation[];
  portfolioValue: number;
  activeCount: number;
  inReviewCount: number;
  highRiskCount: number;
  openFindings: number;
  riskDistribution: { name: string; value: number; fill: string }[];
  valueByDept: { dept: string; value: number }[];
  clauseHeat: { category: string; flagged: number; total: number }[];
  renewalRunway: Contract[];
}

export async function dashboardData(
  orgId: string, today = "2026-09-09",
): Promise<DashboardData> {
  const [contracts, obligations, stats] = await Promise.all([
    listContracts(orgId), listObligations(orgId), orgStats(orgId),
  ]);

  const byDept = new Map<string, number>();
  for (const c of contracts) {
    if (!c.department) continue;
    byDept.set(c.department, (byDept.get(c.department) ?? 0) + c.value);
  }

  const heat = new Map<string, { flagged: number; total: number }>();
  for (const c of contracts) {
    for (const cl of c.clauses) {
      const row = heat.get(cl.category) ?? { flagged: 0, total: 0 };
      row.total += 1;
      if (cl.risk !== "low") row.flagged += 1;
      heat.set(cl.category, row);
    }
  }

  return {
    contracts,
    obligations,
    portfolioValue: stats.portfolio_value,
    activeCount: stats.active,
    inReviewCount: stats.in_flight,
    highRiskCount: stats.high,
    openFindings: stats.open_findings,
    riskDistribution: [
      { name: "Low", value: stats.low, fill: "var(--color-brand-400)" },
      { name: "Medium", value: stats.medium, fill: "var(--color-risk-med)" },
      { name: "High", value: stats.high, fill: "var(--color-flag-600)" },
    ],
    valueByDept: [...byDept.entries()]
      .map(([dept, value]) => ({ dept, value }))
      .sort((a, b) => b.value - a.value),
    clauseHeat: [...heat.entries()]
      .map(([category, v]) => ({ category, ...v }))
      .sort((a, b) => b.flagged - a.flagged),
    renewalRunway: contracts
      .filter((c) => c.expiryDate && c.expiryDate >= today)
      .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate)),
  };
}
