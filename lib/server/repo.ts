import "server-only";
import { many, one, run, tx, id, now, bool, unbool } from "./db";
import type { Contract, Clause, Obligation, RiskLevel, ContractStatus, ContractType } from "@/lib/types";

/* Tenant-scoped data access.
 *
 * Every function takes orgId as its first argument and binds it into the SQL.
 * Nothing here exposes a query that can read across orgs, so a caller cannot
 * forget the filter — the only way to reach a row is through a function that
 * already applies it. */

interface ContractRow {
  id: string; ref: string; title: string; counterparty: string; type: string;
  status: string; value: number; currency: string; department: string;
  effective_date: string | null; expiry_date: string | null; renewal_notice: number;
  auto_renew: number; governing_law: string; risk: string; risk_score: number;
  ai_confidence: number; pages: number; summary: string; tags: string;
  source: string; analyzed_by: string | null; created_at: string;
  owner_name: string | null; owner_initials: string | null;
}

function toContract(row: ContractRow, clauses: Clause[]): Contract {
  return {
    id: row.id,
    ref: row.ref,
    title: row.title,
    counterparty: row.counterparty,
    counterpartyDomain: "",
    type: row.type as ContractType,
    status: row.status as ContractStatus,
    value: row.value,
    currency: row.currency,
    owner: row.owner_name ?? "Unassigned",
    ownerInitials: row.owner_initials ?? "—",
    department: row.department,
    effectiveDate: row.effective_date ?? "",
    expiryDate: row.expiry_date ?? "",
    renewalNotice: row.renewal_notice,
    autoRenew: unbool(row.auto_renew),
    governingLaw: row.governing_law,
    risk: row.risk as RiskLevel,
    riskScore: row.risk_score,
    aiConfidence: row.ai_confidence,
    pages: row.pages,
    clauses,
    timeline: [],
    summary: row.summary,
    tags: JSON.parse(row.tags) as string[],
    source: row.source as "seed" | "upload",
    analyzedBy: row.analyzed_by ?? undefined,
  };
}

const CONTRACT_SELECT = `
  SELECT c.*, u.name AS owner_name, u.initials AS owner_initials
    FROM contracts c
    LEFT JOIN users u ON u.id = c.owner_user_id
   WHERE c.org_id = ?`;

export async function listContracts(orgId: string): Promise<Contract[]> {
  const rows = await many<ContractRow>(
    `${CONTRACT_SELECT} ORDER BY c.risk_score DESC, c.created_at DESC`, [orgId]);
  const clausesByContract = await groupClauses(orgId, rows.map((r) => r.id));
  return rows.map((r) => toContract(r, clausesByContract.get(r.id) ?? []));
}

export async function getContract(orgId: string, contractId: string): Promise<Contract | null> {
  const row = await one<ContractRow>(`${CONTRACT_SELECT} AND c.id = ?`, [orgId, contractId]);
  if (!row) return null;
  return toContract(row, await listClauses(orgId, contractId));
}

export async function listClauses(orgId: string, contractId: string): Promise<Clause[]> {
  const rows = await many(
    `SELECT * FROM clauses WHERE org_id = ? AND contract_id = ?
      ORDER BY deviation DESC, sort_order ASC`, [orgId, contractId]);
  return rows.map(mapClause);
}

async function groupClauses(orgId: string, contractIds: string[]): Promise<Map<string, Clause[]>> {
  const out = new Map<string, Clause[]>();
  if (contractIds.length === 0) return out;
  const placeholders = contractIds.map(() => "?").join(",");
  const rows = await many(
    `SELECT * FROM clauses WHERE org_id = ? AND contract_id IN (${placeholders})
      ORDER BY deviation DESC, sort_order ASC`, [orgId, ...contractIds]);
  for (const r of rows) {
    const cid = r.contract_id as string;
    if (!out.has(cid)) out.set(cid, []);
    out.get(cid)!.push(mapClause(r));
  }
  return out;
}

function mapClause(r: Record<string, unknown>): Clause {
  return {
    id: r.id as string,
    title: r.title as string,
    category: r.category as string,
    risk: r.risk as RiskLevel,
    deviation: r.deviation as number,
    excerpt: r.excerpt as string,
    finding: r.finding as string,
    suggestion: r.suggestion as string,
    page: r.page as number,
    accepted: unbool(r.accepted as number),
  };
}

export interface NewContract {
  ref: string; title: string; counterparty: string; type: string; status: string;
  value: number; ownerUserId: string | null; department: string;
  effectiveDate: string | null; expiryDate: string | null; renewalNotice: number;
  autoRenew: boolean; governingLaw: string; risk: RiskLevel; riskScore: number;
  aiConfidence: number; pages: number; summary: string; tags: string[];
  source: "seed" | "upload"; analyzedBy?: string | null;
}

export async function insertContract(orgId: string, c: NewContract): Promise<string> {
  const cid = id("ct");
  await run(
    `INSERT INTO contracts (id, org_id, ref, title, counterparty, type, status, value,
       currency, owner_user_id, department, effective_date, expiry_date, renewal_notice,
       auto_renew, governing_law, risk, risk_score, ai_confidence, pages, summary, tags,
       source, analyzed_by, created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [cid, orgId, c.ref, c.title, c.counterparty, c.type, c.status, c.value, "USD",
     c.ownerUserId, c.department, c.effectiveDate, c.expiryDate, c.renewalNotice,
     bool(c.autoRenew), c.governingLaw, c.risk, c.riskScore, c.aiConfidence, c.pages,
     c.summary, JSON.stringify(c.tags), c.source, c.analyzedBy ?? null, now()],
  );
  return cid;
}

export async function replaceClauses(
  orgId: string, contractId: string, clauses: Omit<Clause, "id">[],
) {
  await tx(async (q) => {
    await q.run(`DELETE FROM clauses WHERE org_id = ? AND contract_id = ?`, [orgId, contractId]);
    for (const [i, cl] of clauses.entries()) {
      await q.run(
        `INSERT INTO clauses (id, org_id, contract_id, title, category, risk, deviation,
           excerpt, finding, suggestion, page, accepted, sort_order)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [id("cl"), orgId, contractId, cl.title, cl.category, cl.risk, cl.deviation,
         cl.excerpt, cl.finding, cl.suggestion, cl.page, bool(cl.accepted ?? false), i],
      );
    }
  });
}

export async function setClauseAccepted(orgId: string, clauseId: string, accepted: boolean) {
  return run(`UPDATE clauses SET accepted = ? WHERE org_id = ? AND id = ?`,
    [bool(accepted), orgId, clauseId]);
}

export async function updateContractScore(
  orgId: string, contractId: string,
  v: { risk: RiskLevel; riskScore: number; aiConfidence: number; pages: number;
       summary: string; analyzedBy: string; status?: string },
) {
  await run(
    `UPDATE contracts SET risk = ?, risk_score = ?, ai_confidence = ?, pages = ?,
            summary = ?, analyzed_by = ?, status = COALESCE(?, status)
      WHERE org_id = ? AND id = ?`,
    [v.risk, v.riskScore, v.aiConfidence, v.pages, v.summary, v.analyzedBy,
     v.status ?? null, orgId, contractId],
  );
}

export async function listObligations(orgId: string): Promise<Obligation[]> {
  const rows = await many(
    `SELECT o.*, c.title AS contract_title, c.counterparty, u.name AS owner_name
       FROM obligations o
       JOIN contracts c ON c.id = o.contract_id AND c.org_id = o.org_id
       LEFT JOIN users u ON u.id = o.owner_user_id
      WHERE o.org_id = ?
      ORDER BY o.due_date ASC`, [orgId]);
  return rows.map((r) => ({
    id: r.id as string,
    contractId: r.contract_id as string,
    contractTitle: r.contract_title as string,
    counterparty: r.counterparty as string,
    description: r.description as string,
    owner: (r.owner_name as string) ?? "Unassigned",
    dueDate: r.due_date as string,
    recurrence: r.recurrence as Obligation["recurrence"],
    status: r.status as Obligation["status"],
    category: r.category as string,
  }));
}

export interface PlaybookPosition {
  id: string; category: string; title: string;
  standard: string; fallback: string | null; walkAway: string | null; severity: string;
}

export async function getDefaultPlaybook(orgId: string) {
  const pb = await one<{ id: string; name: string; version: number }>(
    `SELECT * FROM playbooks WHERE org_id = ? AND is_default = true LIMIT 1`, [orgId]);
  if (!pb) return null;
  const positions = await many<PlaybookPosition>(
    `SELECT id, category, title, standard, fallback, walk_away AS "walkAway", severity
       FROM playbook_positions WHERE playbook_id = ? AND org_id = ? ORDER BY sort_order`,
    [pb.id, orgId]);
  return { ...pb, positions };
}

export async function listAudit(orgId: string, limit = 50) {
  return many(
    `SELECT a.*, u.name AS user_name FROM audit_log a
       LEFT JOIN users u ON u.id = a.user_id
      WHERE a.org_id = ? ORDER BY a.created_at DESC LIMIT ?`, [orgId, limit]);
}

export interface OrgStats {
  total: number; portfolio_value: number; high: number; medium: number; low: number;
  active: number; in_flight: number; open_findings: number;
}

export async function orgStats(orgId: string): Promise<OrgStats> {
  const row = await one<Record<string, string | number>>(
    `SELECT COUNT(*) AS total,
            COALESCE(SUM(value), 0) AS portfolio_value,
            SUM(CASE WHEN risk = 'high' THEN 1 ELSE 0 END) AS high,
            SUM(CASE WHEN risk = 'medium' THEN 1 ELSE 0 END) AS medium,
            SUM(CASE WHEN risk = 'low' THEN 1 ELSE 0 END) AS low,
            SUM(CASE WHEN status IN ('executed','expiring') THEN 1 ELSE 0 END) AS active,
            SUM(CASE WHEN status IN ('in_review','draft','awaiting_signature') THEN 1 ELSE 0 END) AS in_flight
       FROM contracts WHERE org_id = ?`, [orgId]);
  const findings = await one<{ n: string | number }>(
    `SELECT COUNT(*) AS n FROM clauses
      WHERE org_id = ? AND risk != 'low' AND accepted = false`, [orgId]);
  // Postgres returns COUNT and SUM as strings; the UI does arithmetic on these.
  const num = (v: unknown) => Number(v ?? 0);
  return {
    total: num(row?.total), portfolio_value: num(row?.portfolio_value),
    high: num(row?.high), medium: num(row?.medium), low: num(row?.low),
    active: num(row?.active), in_flight: num(row?.in_flight),
    open_findings: num(findings?.n),
  };
}
