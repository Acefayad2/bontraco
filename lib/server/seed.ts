import "server-only";
import { one, tx, id, now, bool } from "./db";
import { hashPassword } from "./auth";
import { contracts as demoContracts, obligations as demoObligations } from "@/lib/data";

/* Seeds a demo org so the app has something to show on first run.
 *
 * The twelve demo agreements are the same fictional portfolio the marketing
 * site shows, loaded through the real schema — they are rows like any other,
 * with source='seed' so the UI can distinguish them from documents that were
 * actually uploaded and analysed. */

export const DEMO_EMAIL = "priya@bontraco.demo";
export const DEMO_PASSWORD = "bontraco-demo";

const PLAYBOOK_POSITIONS = [
  {
    category: "Liability", title: "Limitation of Liability", severity: "high",
    standard: "Aggregate liability capped at 1× fees paid in the trailing 12 months.",
    fallback: "2× trailing twelve-month fees, but only as a carve-out for breach of confidentiality or a data breach.",
    walkAway: "Any cap above 2×, or an uncapped indemnity that is not mutual.",
  },
  {
    category: "Liability", title: "Indemnification", severity: "medium",
    standard: "Mutual indemnities. Supplier indemnifies for IP infringement with the procure/modify/refund remedy ladder.",
    fallback: "One-directional IP indemnity provided the remedy ladder and a carve-out for customer-supplied materials are present.",
    walkAway: "Customer indemnifying supplier for the supplier's own product.",
  },
  {
    category: "Termination", title: "Termination for Convenience", severity: "high",
    standard: "Either party may terminate on 30 days' notice with pro-rata refund of prepaid, unused fees.",
    fallback: "60 days' notice, refund still pro-rata.",
    walkAway: "A notice right whose economic effect is negated by fee acceleration for the remainder of the term.",
  },
  {
    category: "Termination", title: "Auto-Renewal", severity: "medium",
    standard: "Renewal requires 30 days' non-renewal notice; renewal-term uplift capped at CPI or 3%, whichever is lower.",
    fallback: "45 days' notice with the same uplift cap.",
    walkAway: "A notice window longer than 60 days, or an uncapped renewal uplift.",
  },
  {
    category: "Data Protection", title: "Sub-processors", severity: "high",
    standard: "30 days' advance notice of new sub-processors, with a good-faith objection right and a termination remedy if unresolved.",
    fallback: "15 days' notice with an objection right.",
    walkAway: "Engagement at the supplier's sole discretion with no notice — fails Art. 28(2) GDPR.",
  },
  {
    category: "Data Protection", title: "Breach Notification", severity: "medium",
    standard: "Notice to controller within 24 hours of becoming aware, with a preliminary notice at 12 hours.",
    fallback: "48 hours to controller.",
    walkAway: "72 hours, which consumes the entire regulator deadline.",
  },
  {
    category: "Intellectual Property", title: "Ownership of Deliverables", severity: "high",
    standard: "Deliverables assign to Customer on payment; Supplier keeps a licence to its pre-existing components.",
    fallback: "Joint ownership with an unrestricted customer licence.",
    walkAway: "Supplier retaining deliverables the customer specified and paid for.",
  },
  {
    category: "Commercial", title: "Price Escalation", severity: "medium",
    standard: "Annual increases capped at the lesser of CPI-U or 3%, tied to a published index.",
    fallback: "5% with 90 days' notice.",
    walkAway: "Uncapped increases, or any increase without notice.",
  },
  {
    category: "Commercial", title: "Payment Terms", severity: "low",
    standard: "Net-30 from receipt of an undisputed invoice.",
    fallback: "Net-45.",
    walkAway: "Payment in advance for services not yet rendered.",
  },
  {
    category: "Compliance", title: "Governing Law & Venue", severity: "medium",
    standard: "Delaware law, venue in the Court of Chancery.",
    fallback: "New York law, or AAA arbitration seated in New York.",
    walkAway: "A jurisdiction outside the United States for a US-entity contract.",
  },
  {
    category: "Confidentiality", title: "Confidentiality Survival", severity: "low",
    standard: "Five years post-termination, perpetual for trade secrets.",
    fallback: "Three years, perpetual for trade secrets.",
    walkAway: "Any term under two years.",
  },
];

const TEAM = [
  { name: "Priya Raman", email: DEMO_EMAIL, role: "owner" },
  { name: "Marcus Chen", email: "marcus@bontraco.demo", role: "member" },
  { name: "Dana Whitfield", email: "dana@bontraco.demo", role: "admin" },
  { name: "Sofia Alvarez", email: "sofia@bontraco.demo", role: "member" },
];

export async function isSeeded(): Promise<boolean> {
  const row = await one<{ n: string | number }>(`SELECT COUNT(*) AS n FROM orgs`);
  return Number(row?.n ?? 0) > 0;
}

export async function seed(): Promise<{ orgId: string; email: string }> {
  const existing = await one<{ id: string }>(`SELECT id FROM orgs LIMIT 1`);
  if (existing) return { orgId: existing.id, email: DEMO_EMAIL };

  const orgId = id("org");
  const passwordHash = hashPassword(DEMO_PASSWORD);

  await tx(async (q) => {
    await q.run(`INSERT INTO orgs (id, name, slug, created_at) VALUES (?,?,?,?)`,
      [orgId, "Harborview Group", "harborview", now()]);

    const userIds = new Map<string, string>();
    for (const m of TEAM) {
      const uid = id("usr");
      const initials = m.name.split(" ").map((p) => p[0]).join("");
      await q.run(
        `INSERT INTO users (id, org_id, email, name, initials, password_hash, role, created_at)
         VALUES (?,?,?,?,?,?,?,?)`,
        [uid, orgId, m.email, m.name, initials, passwordHash, m.role, now()]);
      userIds.set(m.name, uid);
    }

    const pbId = id("pb");
    await q.run(
      `INSERT INTO playbooks (id, org_id, name, version, is_default, created_at) VALUES (?,?,?,?,?,?)`,
      [pbId, orgId, "Vendor Playbook", 4, true, now()]);
    for (const [i, pos] of PLAYBOOK_POSITIONS.entries()) {
      await q.run(
        `INSERT INTO playbook_positions (id, playbook_id, org_id, category, title, standard,
           fallback, walk_away, severity, sort_order) VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [id("pos"), pbId, orgId, pos.category, pos.title, pos.standard,
         pos.fallback, pos.walkAway, pos.severity, i]);
    }

    const contractIdByRef = new Map<string, string>();

    for (const c of demoContracts) {
      const cid = id("ct");
      contractIdByRef.set(c.ref, cid);
      await q.run(
        `INSERT INTO contracts (id, org_id, ref, title, counterparty, type, status, value,
           currency, owner_user_id, department, effective_date, expiry_date, renewal_notice,
           auto_renew, governing_law, risk, risk_score, ai_confidence, pages, summary, tags,
           source, analyzed_by, created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [cid, orgId, c.ref, c.title, c.counterparty, c.type, c.status, c.value, "USD",
         userIds.get(c.owner) ?? null, c.department, c.effectiveDate, c.expiryDate,
         c.renewalNotice, bool(c.autoRenew), c.governingLaw, c.risk, c.riskScore,
         c.aiConfidence, c.pages, c.summary, JSON.stringify(c.tags), "seed", "seed", now()]);
      for (const [i, cl] of c.clauses.entries()) {
        await q.run(
          `INSERT INTO clauses (id, org_id, contract_id, title, category, risk, deviation,
             excerpt, finding, suggestion, page, accepted, sort_order)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [id("cl"), orgId, cid, cl.title, cl.category, cl.risk, cl.deviation,
           cl.excerpt, cl.finding, cl.suggestion, cl.page, bool(Boolean(cl.accepted)), i]);
      }
    }

    for (const o of demoObligations) {
      const cid = contractIdByRef.get(o.contractId.toUpperCase());
      if (!cid) continue;
      await q.run(
        `INSERT INTO obligations (id, org_id, contract_id, description, owner_user_id,
           due_date, recurrence, status, category) VALUES (?,?,?,?,?,?,?,?,?)`,
        [id("obl"), orgId, cid, o.description, userIds.get(o.owner) ?? null,
         o.dueDate, o.recurrence, o.status, o.category]);
    }

    await q.run(
      `INSERT INTO audit_log (id, org_id, user_id, action, subject_type, subject_id, meta, created_at)
       VALUES (?,?,?,?,?,?,?,?)`,
      [id("aud"), orgId, null, "org.seeded", "org", orgId,
       JSON.stringify({ contracts: demoContracts.length }), now()]);
  });

  return { orgId, email: DEMO_EMAIL };
}
