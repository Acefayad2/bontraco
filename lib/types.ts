export type RiskLevel = "high" | "medium" | "low";
export type ContractStatus =
  | "draft"
  | "in_review"
  | "awaiting_signature"
  | "executed"
  | "expiring"
  | "expired"
  | "terminated";

export type ContractType =
  | "MSA"
  | "NDA"
  | "SOW"
  | "DPA"
  | "Vendor"
  | "Employment"
  | "Lease"
  | "License"
  | "Reseller";

export interface Clause {
  id: string;
  title: string;
  category: string;
  risk: RiskLevel;
  /** Bontraco's deviation score vs. the company playbook, 0–100 */
  deviation: number;
  excerpt: string;
  finding: string;
  suggestion: string;
  page: number;
  accepted?: boolean;
}

export interface Obligation {
  id: string;
  contractId: string;
  contractTitle: string;
  counterparty: string;
  description: string;
  owner: string;
  dueDate: string;
  recurrence: "one_time" | "monthly" | "quarterly" | "annual";
  status: "upcoming" | "due_soon" | "overdue" | "complete";
  category: string;
}

export interface TimelineEvent {
  id: string;
  at: string;
  actor: string;
  kind: "upload" | "ai" | "comment" | "edit" | "sign" | "approve" | "share";
  text: string;
}

export interface Contract {
  id: string;
  ref: string;
  title: string;
  counterparty: string;
  counterpartyDomain: string;
  type: ContractType;
  status: ContractStatus;
  value: number;
  currency: string;
  owner: string;
  ownerInitials: string;
  department: string;
  effectiveDate: string;
  expiryDate: string;
  renewalNotice: number;
  autoRenew: boolean;
  governingLaw: string;
  risk: RiskLevel;
  riskScore: number;
  aiConfidence: number;
  pages: number;
  clauses: Clause[];
  timeline: TimelineEvent[];
  summary: string;
  tags: string[];
}
