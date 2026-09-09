import type { Contract, Obligation, Clause, TimelineEvent } from "./types";

/* ────────────────────────────────────────────────────────────────
   Demo dataset. Deterministic — no Math.random, so server and
   client render identically and there is no hydration mismatch.
   ──────────────────────────────────────────────────────────────── */

const clauseLibrary: Record<string, Omit<Clause, "id">[]> = {
  liability: [
    {
      title: "Limitation of Liability",
      category: "Liability",
      risk: "high",
      deviation: 82,
      page: 11,
      excerpt:
        "In no event shall either party's aggregate liability arising out of or related to this Agreement exceed three (3) times the total fees paid or payable hereunder in the twelve (12) months preceding the claim.",
      finding:
        "Cap is set at 3× trailing twelve-month fees. Your playbook ceiling is 1×, with a 2× carve-out reserved for data-breach claims only. This is a 3× uncapped-category exposure.",
      suggestion:
        'Replace "three (3) times" with "one (1) times" and move the multiplier uplift into a separate breach-of-confidentiality carve-out capped at 2×.',
    },
    {
      title: "Indemnification — IP Infringement",
      category: "Liability",
      risk: "medium",
      deviation: 46,
      page: 13,
      excerpt:
        "Supplier shall defend, indemnify and hold harmless Customer against any third-party claim alleging that the Services infringe any patent, copyright or trade secret.",
      finding:
        "Indemnity is one-directional and omits the standard mitigation ladder (procure right / modify / refund). Absent that ladder, Supplier has no bounded remedy path.",
      suggestion:
        "Insert the three-step remedy ladder and add a mutual carve-out for Customer-supplied materials and unauthorized modifications.",
    },
  ],
  termination: [
    {
      title: "Termination for Convenience",
      category: "Termination",
      risk: "high",
      deviation: 71,
      page: 18,
      excerpt:
        "Customer may terminate this Agreement for convenience upon ninety (90) days' prior written notice, provided that Customer shall remain liable for all fees for the remainder of the then-current Term.",
      finding:
        "Notice is granted but the fee-acceleration proviso negates it — the economic effect is a non-terminable term. Two prior agreements with this counterparty used a 30-day notice with pro-rata refund.",
      suggestion:
        "Strike the proviso and substitute pro-rata refund of prepaid, unused fees within 30 days of the effective termination date.",
    },
    {
      title: "Auto-Renewal",
      category: "Termination",
      risk: "medium",
      deviation: 38,
      page: 4,
      excerpt:
        "This Agreement shall automatically renew for successive twelve (12) month periods unless either party provides written notice of non-renewal at least sixty (60) days prior to the end of the then-current Term.",
      finding:
        "60-day non-renewal window is longer than your 30-day standard. Missing it silently commits another full year at the uplifted rate in §5.3.",
      suggestion:
        "Reduce to 30 days and cap renewal-term price uplift at CPI or 3%, whichever is lower.",
    },
  ],
  data: [
    {
      title: "Data Processing & Sub-processors",
      category: "Data Protection",
      risk: "high",
      deviation: 64,
      page: 24,
      excerpt:
        "Supplier may engage sub-processors in its sole discretion and shall maintain a list of such sub-processors available upon written request.",
      finding:
        "No prior-notice obligation and no objection right. This fails Art. 28(2) GDPR and conflicts with the DPA your security team ratified in March.",
      suggestion:
        "Require 30 days' advance notice of new sub-processors plus a good-faith objection right with termination remedy if unresolved.",
    },
    {
      title: "Breach Notification Window",
      category: "Data Protection",
      risk: "medium",
      deviation: 41,
      page: 25,
      excerpt:
        "Supplier shall notify Customer of any Personal Data Breach without undue delay and in any event within seventy-two (72) hours of becoming aware.",
      finding:
        "72 hours matches the regulator deadline, leaving you zero time to file. Standard position is 24 hours to controller.",
      suggestion: "Tighten to 24 hours with a preliminary notice at 12 hours.",
    },
  ],
  commercial: [
    {
      title: "Price Escalation",
      category: "Commercial",
      risk: "medium",
      deviation: 52,
      page: 6,
      excerpt:
        "Fees may be increased annually by Supplier upon sixty (60) days' notice, not to exceed seven percent (7%) per annum.",
      finding:
        "7% ceiling is materially above the 3% / CPI cap used in your last four vendor agreements of comparable size.",
      suggestion: "Cap at the lesser of CPI-U or 3% and require the increase to be tied to a published index.",
    },
    {
      title: "Payment Terms",
      category: "Commercial",
      risk: "low",
      deviation: 12,
      page: 5,
      excerpt:
        "Customer shall pay all undisputed invoices within thirty (30) days of receipt.",
      finding: "Net-30 with an undisputed-invoice qualifier. Matches playbook exactly.",
      suggestion: "No change required.",
    },
  ],
  ip: [
    {
      title: "Ownership of Deliverables",
      category: "Intellectual Property",
      risk: "high",
      deviation: 77,
      page: 15,
      excerpt:
        "All Deliverables, including any derivative works thereof, shall be and remain the exclusive property of Supplier, with Customer receiving a non-exclusive, non-transferable license for internal use.",
      finding:
        "Work-for-hire deliverables are being retained by Supplier. Because §3.2 defines Deliverables to include Customer-specified configurations, you would be licensing back your own requirements.",
      suggestion:
        "Assign Deliverables to Customer on payment; grant Supplier a license back to its pre-existing and generally applicable components.",
    },
  ],
  confidentiality: [
    {
      title: "Confidentiality Survival",
      category: "Confidentiality",
      risk: "low",
      deviation: 18,
      page: 20,
      excerpt:
        "The obligations in this Section shall survive for five (5) years following termination, and indefinitely with respect to trade secrets.",
      finding: "Five-year survival with perpetual trade-secret tail. Consistent with playbook.",
      suggestion: "No change required.",
    },
  ],
  compliance: [
    {
      title: "Governing Law & Venue",
      category: "Compliance",
      risk: "medium",
      deviation: 44,
      page: 29,
      excerpt:
        "This Agreement shall be governed by the laws of the State of Texas, and the parties submit to the exclusive jurisdiction of the courts located in Harris County.",
      finding:
        "Venue sits outside your two approved jurisdictions (Delaware, New York). Litigating in Harris County adds an estimated $40–70k to any dispute.",
      suggestion: "Move to Delaware law with venue in the Court of Chancery, or agree to AAA arbitration seated in New York.",
    },
    {
      title: "Insurance Requirements",
      category: "Compliance",
      risk: "low",
      deviation: 9,
      page: 27,
      excerpt:
        "Supplier shall maintain commercial general liability insurance of not less than $2,000,000 per occurrence and cyber liability coverage of not less than $5,000,000.",
      finding: "Coverage limits meet or exceed the procurement threshold for this contract band.",
      suggestion: "No change required.",
    },
  ],
};

function buildClauses(keys: string[], seed: number): Clause[] {
  const out: Clause[] = [];
  keys.forEach((k, ki) => {
    (clauseLibrary[k] ?? []).forEach((c, ci) => {
      out.push({ ...c, id: `cl-${seed}-${ki}-${ci}` });
    });
  });
  return out;
}

function tl(seed: number, counterparty: string, owner: string): TimelineEvent[] {
  return [
    { id: `tl-${seed}-1`, at: "2026-08-14T09:12:00Z", actor: owner, kind: "upload", text: "Uploaded executed counterpart (PDF, 34 pages)" },
    { id: `tl-${seed}-2`, at: "2026-08-14T09:12:40Z", actor: "Bontraco AI", kind: "ai", text: "Extracted 41 clauses · 7 flagged against Vendor Playbook v4" },
    { id: `tl-${seed}-3`, at: "2026-08-14T11:30:00Z", actor: owner, kind: "comment", text: `Asked ${counterparty} to revisit the liability cap in §11.2` },
    { id: `tl-${seed}-4`, at: "2026-08-19T16:45:00Z", actor: counterparty, kind: "edit", text: "Returned redline — cap reduced 3× → 2×, convenience proviso unchanged" },
    { id: `tl-${seed}-5`, at: "2026-08-20T08:05:00Z", actor: "Bontraco AI", kind: "ai", text: "Re-scored redline · residual risk 74 → 58 · 2 issues remain open" },
    { id: `tl-${seed}-6`, at: "2026-08-22T14:20:00Z", actor: "Dana Whitfield", kind: "approve", text: "Legal approval granted with conditions" },
    { id: `tl-${seed}-7`, at: "2026-08-25T10:02:00Z", actor: owner, kind: "sign", text: "Sent for signature via DocuSign envelope #4471-A" },
  ];
}

interface Seed {
  ref: string;
  title: string;
  cp: string;
  domain: string;
  type: Contract["type"];
  status: Contract["status"];
  value: number;
  owner: string;
  dept: string;
  eff: string;
  exp: string;
  notice: number;
  auto: boolean;
  law: string;
  risk: Contract["risk"];
  score: number;
  conf: number;
  pages: number;
  clauses: string[];
  tags: string[];
  summary: string;
}

const seeds: Seed[] = [
  {
    ref: "BC-2026-0412", title: "Master Services Agreement", cp: "Northwind Logistics", domain: "northwind.com",
    type: "MSA", status: "in_review", value: 2_450_000, owner: "Priya Raman", dept: "Procurement",
    eff: "2026-09-01", exp: "2029-08-31", notice: 60, auto: true, law: "Texas", risk: "high", score: 74, conf: 96, pages: 34,
    clauses: ["liability", "termination", "ip", "commercial", "compliance"],
    tags: ["Tier 1 vendor", "Multi-year", "Redline open"],
    summary:
      "Three-year MSA covering freight brokerage and last-mile fulfilment across 14 distribution centers. Commercially attractive at $2.45M TCV, but the risk profile is driven by a 3× liability cap, Supplier-retained deliverable IP, and a termination-for-convenience clause whose fee-acceleration proviso makes the notice period economically inert. Texas venue sits outside approved jurisdictions.",
  },
  {
    ref: "BC-2026-0398", title: "Data Processing Addendum", cp: "Helios Cloud Systems", domain: "helioscloud.io",
    type: "DPA", status: "awaiting_signature", value: 0, owner: "Marcus Chen", dept: "Security",
    eff: "2026-09-15", exp: "2027-09-14", notice: 30, auto: true, law: "Delaware", risk: "high", score: 68, conf: 94, pages: 18,
    clauses: ["data", "confidentiality", "compliance"],
    tags: ["GDPR", "Sub-processors", "Blocking"],
    summary:
      "Addendum to the Helios platform subscription governing processing of EU and UK personal data. Two provisions remain out of policy: sub-processor engagement at Supplier's sole discretion with no objection right, and a 72-hour breach window that consumes the entire regulator deadline. Security has conditioned sign-off on both being resolved.",
  },
  {
    ref: "BC-2026-0377", title: "Enterprise Software License", cp: "Vertex Analytics", domain: "vertexanalytics.com",
    type: "License", status: "executed", value: 890_000, owner: "Priya Raman", dept: "IT",
    eff: "2026-04-01", exp: "2027-03-31", notice: 60, auto: true, law: "Delaware", risk: "medium", score: 44, conf: 98, pages: 26,
    clauses: ["commercial", "confidentiality", "compliance"],
    tags: ["Renewal Q1", "Seat-based"],
    summary:
      "Annual license for 1,200 analyst seats with a 7% escalation ceiling. Executed cleanly; the open item is the renewal economics — the escalation cap is above the 3% used across comparable agreements, worth roughly $36k on renewal.",
  },
  {
    ref: "BC-2026-0355", title: "Mutual Non-Disclosure Agreement", cp: "Ridgeline Capital", domain: "ridgelinecap.com",
    type: "NDA", status: "executed", value: 0, owner: "Dana Whitfield", dept: "Legal",
    eff: "2026-06-10", exp: "2028-06-09", notice: 0, auto: false, law: "New York", risk: "low", score: 14, conf: 99, pages: 6,
    clauses: ["confidentiality"],
    tags: ["Standard form", "M&A"],
    summary:
      "Mutual NDA on Bontraco standard paper executed without amendment. Five-year survival, perpetual trade-secret tail, New York law. No deviations detected.",
  },
  {
    ref: "BC-2026-0341", title: "Statement of Work — Platform Migration", cp: "Aperture Consulting", domain: "apertureconsulting.co",
    type: "SOW", status: "expiring", value: 1_180_000, owner: "Marcus Chen", dept: "Engineering",
    eff: "2025-10-01", exp: "2026-09-30", notice: 30, auto: false, law: "Delaware", risk: "high", score: 71, conf: 92, pages: 22,
    clauses: ["ip", "liability", "commercial"],
    tags: ["Expiring 21 days", "IP dispute risk"],
    summary:
      "Fixed-fee migration engagement expiring in 21 days with two milestones unaccepted. Deliverable ownership sits with Supplier under §15, which is a live problem: the migration scripts encode Bontraco-specific configuration and would need to be licensed back.",
  },
  {
    ref: "BC-2026-0330", title: "Reseller Agreement — EMEA", cp: "Meridian Partners GmbH", domain: "meridian.de",
    type: "Reseller", status: "in_review", value: 3_200_000, owner: "Sofia Alvarez", dept: "Sales",
    eff: "2026-10-01", exp: "2029-09-30", notice: 90, auto: true, law: "Germany", risk: "medium", score: 52, conf: 91, pages: 41,
    clauses: ["commercial", "termination", "compliance"],
    tags: ["EMEA", "Channel", "Highest TCV"],
    summary:
      "Largest agreement in the current pipeline at $3.2M TCV. Exclusive EMEA distribution with a 90-day non-renewal window and German governing law. Margin structure is favourable; the exposure is the exclusivity grant running the full three years with no performance-based clawback.",
  },
  {
    ref: "BC-2026-0318", title: "Office Lease — Building C, Floors 4–6", cp: "Harborview Properties", domain: "harborviewre.com",
    type: "Lease", status: "executed", value: 4_620_000, owner: "Dana Whitfield", dept: "Facilities",
    eff: "2026-01-01", exp: "2031-12-31", notice: 180, auto: false, law: "New York", risk: "low", score: 22, conf: 97, pages: 68,
    clauses: ["commercial", "compliance"],
    tags: ["Real estate", "6-year term"],
    summary:
      "Six-year lease on 48,000 sq ft with two five-year renewal options at fair market rent. Terms are market-standard; the 180-day notice requirement is the item to diarise, first trigger falls in July 2031.",
  },
  {
    ref: "BC-2026-0304", title: "Cloud Infrastructure Agreement", cp: "Helios Cloud Systems", domain: "helioscloud.io",
    type: "Vendor", status: "executed", value: 1_950_000, owner: "Marcus Chen", dept: "IT",
    eff: "2026-03-01", exp: "2028-02-29", notice: 60, auto: true, law: "Delaware", risk: "medium", score: 48, conf: 95, pages: 31,
    clauses: ["commercial", "data", "liability"],
    tags: ["Committed spend", "Tier 1 vendor"],
    summary:
      "Two-year committed-spend agreement with tiered discounts triggered at $900k annual consumption. Currently tracking at 78% of the commit with five months remaining — a shortfall would forfeit the tier-2 discount worth approximately $147k.",
  },
  {
    ref: "BC-2026-0289", title: "Employment Agreement — VP Engineering", cp: "J. Okonkwo", domain: "internal",
    type: "Employment", status: "executed", value: 385_000, owner: "Dana Whitfield", dept: "People",
    eff: "2026-05-15", exp: "2029-05-14", notice: 0, auto: false, law: "California", risk: "low", score: 19, conf: 98, pages: 14,
    clauses: ["confidentiality", "ip"],
    tags: ["Executive", "Equity"],
    summary:
      "Executive employment agreement with four-year equity vesting and a one-year cliff. Non-compete intentionally omitted given California enforceability; retention is handled through the equity schedule instead.",
  },
  {
    ref: "BC-2026-0271", title: "Managed Security Services", cp: "Sentinel Defense Group", domain: "sentineldg.com",
    type: "Vendor", status: "draft", value: 720_000, owner: "Sofia Alvarez", dept: "Security",
    eff: "2026-11-01", exp: "2028-10-31", notice: 60, auto: true, law: "Delaware", risk: "medium", score: 55, conf: 88, pages: 29,
    clauses: ["data", "liability", "commercial"],
    tags: ["Draft", "SOC monitoring"],
    summary:
      "24/7 SOC monitoring and incident response retainer, still on Supplier paper. First pass shows a liability cap tied to monthly rather than annual fees, which for a security vendor is materially below the loss the service exists to prevent.",
  },
  {
    ref: "BC-2026-0256", title: "Marketing Services Agreement", cp: "Lumen Creative", domain: "lumencreative.studio",
    type: "Vendor", status: "expiring", value: 340_000, owner: "Sofia Alvarez", dept: "Marketing",
    eff: "2025-11-15", exp: "2026-11-14", notice: 30, auto: true, law: "New York", risk: "low", score: 27, conf: 96, pages: 12,
    clauses: ["ip", "commercial"],
    tags: ["Auto-renew 66 days"],
    summary:
      "Retainer for brand and campaign production. Auto-renews in 66 days unless notice is served. Deliverable IP assigns correctly on payment. The renewal question is commercial, not legal.",
  },
  {
    ref: "BC-2026-0233", title: "Supply Agreement — Component Sourcing", cp: "Kestrel Manufacturing", domain: "kestrelmfg.com",
    type: "Vendor", status: "expired", value: 1_420_000, owner: "Priya Raman", dept: "Procurement",
    eff: "2024-07-01", exp: "2026-06-30", notice: 90, auto: false, law: "Delaware", risk: "medium", score: 49, conf: 93, pages: 25,
    clauses: ["commercial", "liability", "compliance"],
    tags: ["Expired", "Renegotiation"],
    summary:
      "Expired on 30 June with purchase orders still flowing against the lapsed terms. Every PO issued since is governed by Kestrel's standard terms rather than this agreement — that gap should be closed before the next order cycle.",
  },
];

function statusFromSeed(s: Seed): Contract["status"] { return s.status; }

export const contracts: Contract[] = seeds.map((s, i) => ({
  id: s.ref.toLowerCase(),
  ref: s.ref,
  title: s.title,
  counterparty: s.cp,
  counterpartyDomain: s.domain,
  type: s.type,
  status: statusFromSeed(s),
  value: s.value,
  currency: "USD",
  owner: s.owner,
  ownerInitials: s.owner.split(" ").map((p) => p[0]).join(""),
  department: s.dept,
  effectiveDate: s.eff,
  expiryDate: s.exp,
  renewalNotice: s.notice,
  autoRenew: s.auto,
  governingLaw: s.law,
  risk: s.risk,
  riskScore: s.score,
  aiConfidence: s.conf,
  pages: s.pages,
  clauses: buildClauses(s.clauses, i),
  timeline: tl(i, s.cp, s.owner),
  summary: s.summary,
  tags: s.tags,
}));

export const obligations: Obligation[] = [
  { id: "ob-1", contractId: "bc-2026-0341", contractTitle: "SOW — Platform Migration", counterparty: "Aperture Consulting", description: "Serve non-renewal notice or execute extension", owner: "Marcus Chen", dueDate: "2026-08-31", recurrence: "one_time", status: "overdue", category: "Renewal" },
  { id: "ob-2", contractId: "bc-2026-0398", contractTitle: "Data Processing Addendum", counterparty: "Helios Cloud Systems", description: "Complete annual sub-processor audit and log results", owner: "Marcus Chen", dueDate: "2026-09-12", recurrence: "annual", status: "due_soon", category: "Compliance" },
  { id: "ob-3", contractId: "bc-2026-0304", contractTitle: "Cloud Infrastructure Agreement", counterparty: "Helios Cloud Systems", description: "Consumption true-up — confirm tier-2 commit trajectory", owner: "Marcus Chen", dueDate: "2026-09-15", recurrence: "quarterly", status: "due_soon", category: "Commercial" },
  { id: "ob-4", contractId: "bc-2026-0256", contractTitle: "Marketing Services Agreement", counterparty: "Lumen Creative", description: "Decide renewal — auto-renew notice deadline", owner: "Sofia Alvarez", dueDate: "2026-10-15", recurrence: "one_time", status: "upcoming", category: "Renewal" },
  { id: "ob-5", contractId: "bc-2026-0377", contractTitle: "Enterprise Software License", counterparty: "Vertex Analytics", description: "Submit seat-count reconciliation for true-up billing", owner: "Priya Raman", dueDate: "2026-10-01", recurrence: "annual", status: "upcoming", category: "Commercial" },
  { id: "ob-6", contractId: "bc-2026-0412", contractTitle: "Master Services Agreement", counterparty: "Northwind Logistics", description: "Deliver Q3 service-level report to counterparty", owner: "Priya Raman", dueDate: "2026-09-30", recurrence: "quarterly", status: "upcoming", category: "Reporting" },
  { id: "ob-7", contractId: "bc-2026-0318", contractTitle: "Office Lease — Building C", counterparty: "Harborview Properties", description: "Provide certificate of insurance for the policy year", owner: "Dana Whitfield", dueDate: "2026-09-20", recurrence: "annual", status: "due_soon", category: "Compliance" },
  { id: "ob-8", contractId: "bc-2026-0233", contractTitle: "Supply Agreement", counterparty: "Kestrel Manufacturing", description: "Close the post-expiry PO gap — issue bridging terms", owner: "Priya Raman", dueDate: "2026-08-20", recurrence: "one_time", status: "overdue", category: "Legal" },
  { id: "ob-9", contractId: "bc-2026-0289", contractTitle: "Employment Agreement — VP Eng", counterparty: "J. Okonkwo", description: "Equity cliff review with Compensation Committee", owner: "Dana Whitfield", dueDate: "2027-05-15", recurrence: "one_time", status: "upcoming", category: "People" },
  { id: "ob-10", contractId: "bc-2026-0330", contractTitle: "Reseller Agreement — EMEA", counterparty: "Meridian Partners GmbH", description: "Confirm territory performance minimums for year one", owner: "Sofia Alvarez", dueDate: "2026-11-01", recurrence: "annual", status: "upcoming", category: "Commercial" },
];

/* ── Aggregations ──────────────────────────────────────────────── */

export const portfolioValue = contracts.reduce((n, c) => n + c.value, 0);
export const activeCount = contracts.filter((c) => ["executed", "expiring"].includes(c.status)).length;
export const inReviewCount = contracts.filter((c) => ["in_review", "draft", "awaiting_signature"].includes(c.status)).length;
export const highRiskCount = contracts.filter((c) => c.risk === "high").length;
export const openFindings = contracts.reduce(
  (n, c) => n + c.clauses.filter((cl) => cl.risk !== "low" && !cl.accepted).length, 0);

export const riskDistribution = [
  { name: "Low", value: contracts.filter((c) => c.risk === "low").length, fill: "var(--color-risk-low)" },
  { name: "Medium", value: contracts.filter((c) => c.risk === "medium").length, fill: "var(--color-risk-med)" },
  { name: "High", value: contracts.filter((c) => c.risk === "high").length, fill: "var(--color-risk-high)" },
];

export const cycleTimeSeries = [
  { month: "Mar", manual: 21, bontraco: 19 },
  { month: "Apr", manual: 22, bontraco: 15 },
  { month: "May", manual: 20, bontraco: 11 },
  { month: "Jun", manual: 23, bontraco: 8 },
  { month: "Jul", manual: 21, bontraco: 6 },
  { month: "Aug", manual: 22, bontraco: 5 },
  { month: "Sep", manual: 21, bontraco: 4 },
];

export const valueByDept = [
  { dept: "Facilities", value: 4_620_000 },
  { dept: "Sales", value: 3_200_000 },
  { dept: "Procurement", value: 3_870_000 },
  { dept: "IT", value: 2_840_000 },
  { dept: "Engineering", value: 1_180_000 },
  { dept: "Security", value: 720_000 },
  { dept: "Marketing", value: 340_000 },
];

export const clauseHeat = [
  { category: "Liability", flagged: 14, total: 22 },
  { category: "Termination", flagged: 11, total: 24 },
  { category: "Data Protection", flagged: 9, total: 16 },
  { category: "Intellectual Property", flagged: 8, total: 18 },
  { category: "Commercial", flagged: 6, total: 26 },
  { category: "Compliance", flagged: 4, total: 21 },
  { category: "Confidentiality", flagged: 1, total: 19 },
];

export const renewalRunway = contracts
  .filter((c) => c.expiryDate >= "2026-09-09")
  .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));

export function getContract(id: string) {
  return contracts.find((c) => c.id === id.toLowerCase());
}

export function daysUntil(date: string, from = "2026-09-09") {
  const ms = new Date(date).getTime() - new Date(from).getTime();
  return Math.round(ms / 86_400_000);
}

export function money(n: number, compact = false) {
  if (n === 0) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD",
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : 0,
  }).format(n);
}

export function formatDate(d: string) {
  return new Date(d + "T00:00:00Z").toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric", timeZone: "UTC",
  });
}

export function formatDateTime(d: string) {
  return new Date(d).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "UTC",
  });
}
