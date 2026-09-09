import { Badge } from "./primitives";
import type { ContractStatus, RiskLevel } from "@/lib/types";

const statusMap: Record<ContractStatus, { label: string; tone: "neutral" | "info" | "medium" | "low" | "high" | "accent" }> = {
  draft: { label: "Draft", tone: "neutral" },
  in_review: { label: "In review", tone: "info" },
  awaiting_signature: { label: "Awaiting signature", tone: "medium" },
  executed: { label: "Executed", tone: "accent" },
  expiring: { label: "Expiring", tone: "medium" },
  expired: { label: "Expired", tone: "high" },
  terminated: { label: "Terminated", tone: "high" },
};

export function StatusBadge({ status }: { status: ContractStatus }) {
  const s = statusMap[status];
  return <Badge tone={s.tone} dot>{s.label}</Badge>;
}

const riskMap: Record<RiskLevel, { label: string; tone: "high" | "medium" | "low" }> = {
  high: { label: "High risk", tone: "high" },
  medium: { label: "Medium", tone: "medium" },
  low: { label: "Low", tone: "low" },
};

export function RiskBadge({ risk, score }: { risk: RiskLevel; score?: number }) {
  const r = riskMap[risk];
  return (
    <Badge tone={r.tone}>
      <span className="tabular">{score !== undefined ? `${score} · ` : ""}</span>
      {r.label}
    </Badge>
  );
}
