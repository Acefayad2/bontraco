import "server-only";
import { db, id, now } from "./db";
import { getBlob } from "./storage";
import { extractPdf, extractText } from "./extract";
import { analyze } from "./analyze";
import { getDefaultPlaybook, replaceClauses, updateContractScore } from "./repo";
import { audit } from "./auth";

/* In-process job runner.
 *
 * Analysing a contract takes tens of seconds, which is far too long to hold a
 * request open, so uploads enqueue a job and the client polls. This runs the
 * work in the same process — correct for a single-node development slice, and
 * explicitly not what production wants: a separate worker against a real queue,
 * so a deploy mid-analysis does not lose the job. That swap is a change to
 * enqueue() and run(), not to callers. */

export interface JobView {
  id: string;
  status: "queued" | "running" | "done" | "failed";
  step: string;
  progress: number;
  contractId: string | null;
  error: string | null;
}

export function enqueueAnalysis(orgId: string, documentId: string, contractId: string, userId: string) {
  const jobId = id("job");
  db().prepare(
    `INSERT INTO jobs (id, org_id, kind, status, step, progress, document_id, contract_id, created_at)
     VALUES (?, ?, 'analyze_contract', 'queued', 'Queued', 0, ?, ?, ?)`,
  ).run(jobId, orgId, documentId, contractId, now());

  // Deliberately not awaited: the request returns the job id immediately.
  setImmediate(() => { void run(jobId, orgId, userId); });
  return jobId;
}

export function getJob(orgId: string, jobId: string): JobView | null {
  const r = db().prepare(`SELECT * FROM jobs WHERE org_id = ? AND id = ?`)
    .get(orgId, jobId) as Record<string, unknown> | undefined;
  if (!r) return null;
  return {
    id: r.id as string,
    status: r.status as JobView["status"],
    step: r.step as string,
    progress: r.progress as number,
    contractId: (r.contract_id as string) ?? null,
    error: (r.error as string) ?? null,
  };
}

function step(jobId: string, stepName: string, progress: number) {
  db().prepare(`UPDATE jobs SET status='running', step=?, progress=? WHERE id=?`)
    .run(stepName, progress, jobId);
}

async function run(jobId: string, orgId: string, userId: string) {
  const database = db();
  try {
    database.prepare(`UPDATE jobs SET status='running', started_at=?, step='Starting', progress=5 WHERE id=?`)
      .run(now(), jobId);

    const job = database.prepare(`SELECT * FROM jobs WHERE id = ?`).get(jobId) as Record<string, unknown>;
    const doc = database.prepare(`SELECT * FROM documents WHERE id = ? AND org_id = ?`)
      .get(job.document_id, orgId) as Record<string, unknown>;
    if (!doc) throw new Error("Document not found");

    step(jobId, "Reading document", 15);
    const bytes = await getBlob(doc.storage_key as string);
    const mime = doc.mime as string;
    const extracted = mime === "application/pdf"
      ? await extractPdf(new Uint8Array(bytes))
      : extractText(bytes.toString("utf8"));

    if (extracted.fullText.trim().length < 200) {
      throw new Error(
        "Could not read enough text from this file. If it is a scanned document it needs OCR, which this slice does not do yet.",
      );
    }

    step(jobId, "Indexing pages", 30);
    const insertPage = database.prepare(
      `INSERT INTO document_pages (id, org_id, document_id, page, text) VALUES (?,?,?,?,?)`,
    );
    database.transaction(() => {
      database.prepare(`DELETE FROM document_pages WHERE document_id = ? AND org_id = ?`)
        .run(doc.id, orgId);
      for (const p of extracted.pages) {
        insertPage.run(id("pg"), orgId, doc.id, p.page, p.text);
      }
    })();
    database.prepare(`UPDATE documents SET page_count = ? WHERE id = ? AND org_id = ?`)
      .run(extracted.pageCount, doc.id, orgId);

    step(jobId, "Scoring against playbook", 50);
    const playbook = getDefaultPlaybook(orgId);
    const org = database.prepare(`SELECT name FROM orgs WHERE id = ?`).get(orgId) as
      { name: string } | undefined;
    const result = await analyze(
      extracted, playbook?.positions ?? [], doc.filename as string, org?.name ?? null,
    );

    step(jobId, "Writing findings", 85);
    const contractId = job.contract_id as string;
    replaceClauses(orgId, contractId, result.findings.map((f) => ({
      title: f.title, category: f.category, risk: f.risk, deviation: f.deviation,
      excerpt: f.excerpt, finding: f.finding, suggestion: f.suggestion,
      page: f.page, accepted: false,
    })));

    // Only overwrite the placeholder fields the analyzer actually resolved.
    const updates: string[] = [];
    const params: unknown[] = [];
    const maybe = (col: string, v: unknown) => {
      if (v !== null && v !== undefined && v !== "") { updates.push(`${col} = ?`); params.push(v); }
    };
    maybe("title", result.title);
    maybe("counterparty", result.counterparty);
    maybe("type", result.contractType);
    maybe("effective_date", result.effectiveDate);
    maybe("expiry_date", result.expiryDate);
    maybe("governing_law", result.governingLaw);
    maybe("value", result.value !== null ? Math.round(result.value) : null);
    maybe("renewal_notice", result.renewalNotice);
    if (result.autoRenew !== null) { updates.push("auto_renew = ?"); params.push(result.autoRenew ? 1 : 0); }
    if (updates.length) {
      database.prepare(`UPDATE contracts SET ${updates.join(", ")} WHERE org_id = ? AND id = ?`)
        .run(...params, orgId, contractId);
    }

    updateContractScore(orgId, contractId, {
      risk: result.risk, riskScore: result.riskScore, aiConfidence: result.confidence,
      pages: extracted.pageCount, summary: result.summary, analyzedBy: result.analyzedBy,
      status: "in_review",
    });

    audit(orgId, userId, "contract.analyzed", "contract", contractId, {
      findings: result.findings.length, analyzedBy: result.analyzedBy,
      riskScore: result.riskScore, pages: extracted.pageCount,
    });

    database.prepare(`UPDATE jobs SET status='done', step='Complete', progress=100, finished_at=? WHERE id=?`)
      .run(now(), jobId);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[jobs] ${jobId} failed:`, err);
    db().prepare(`UPDATE jobs SET status='failed', step='Failed', error=?, finished_at=? WHERE id=?`)
      .run(message, now(), jobId);
  }
}
