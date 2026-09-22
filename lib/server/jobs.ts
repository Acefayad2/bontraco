import "server-only";
import { one, run, tx, id, now } from "./db";
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

export async function enqueueAnalysis(
  orgId: string, documentId: string, contractId: string, userId: string,
) {
  const jobId = id("job");
  await run(
    `INSERT INTO jobs (id, org_id, kind, status, step, progress, document_id, contract_id, created_at)
     VALUES (?, ?, 'analyze_contract', 'queued', 'Queued', 0, ?, ?, ?)`,
    [jobId, orgId, documentId, contractId, now()],
  );

  // Deliberately not awaited: the request returns the job id immediately.
  setImmediate(() => { void runJob(jobId, orgId, userId); });
  return jobId;
}

export async function getJob(orgId: string, jobId: string): Promise<JobView | null> {
  const r = await one(`SELECT * FROM jobs WHERE org_id = ? AND id = ?`, [orgId, jobId]);
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

async function step(jobId: string, stepName: string, progress: number) {
  await run(`UPDATE jobs SET status='running', step=?, progress=? WHERE id=?`,
    [stepName, progress, jobId]);
}

async function runJob(jobId: string, orgId: string, userId: string) {
  try {
    await run(
      `UPDATE jobs SET status='running', started_at=?, step='Starting', progress=5 WHERE id=?`,
      [now(), jobId]);

    const job = await one(`SELECT * FROM jobs WHERE id = ?`, [jobId]);
    if (!job) throw new Error("Job not found");
    const doc = await one(`SELECT * FROM documents WHERE id = ? AND org_id = ?`,
      [job.document_id, orgId]);
    if (!doc) throw new Error("Document not found");

    await step(jobId, "Reading document", 15);
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

    await step(jobId, "Indexing pages", 30);
    await tx(async (q) => {
      await q.run(`DELETE FROM document_pages WHERE document_id = ? AND org_id = ?`,
        [doc.id, orgId]);
      for (const pg of extracted.pages) {
        await q.run(
          `INSERT INTO document_pages (id, org_id, document_id, page, text) VALUES (?,?,?,?,?)`,
          [id("pg"), orgId, doc.id, pg.page, pg.text]);
      }
    });
    await run(`UPDATE documents SET page_count = ? WHERE id = ? AND org_id = ?`,
      [extracted.pageCount, doc.id, orgId]);

    await step(jobId, "Scoring against playbook", 50);
    const playbook = await getDefaultPlaybook(orgId);
    const org = await one<{ name: string }>(`SELECT name FROM orgs WHERE id = ?`, [orgId]);
    const result = await analyze(
      extracted, playbook?.positions ?? [], doc.filename as string, org?.name ?? null,
    );

    await step(jobId, "Writing findings", 85);
    const contractId = job.contract_id as string;
    await replaceClauses(orgId, contractId, result.findings.map((f) => ({
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
      await run(`UPDATE contracts SET ${updates.join(", ")} WHERE org_id = ? AND id = ?`,
        [...params, orgId, contractId]);
    }

    await updateContractScore(orgId, contractId, {
      risk: result.risk, riskScore: result.riskScore, aiConfidence: result.confidence,
      pages: extracted.pageCount, summary: result.summary, analyzedBy: result.analyzedBy,
      status: "in_review",
    });

    await audit(orgId, userId, "contract.analyzed", "contract", contractId, {
      findings: result.findings.length, analyzedBy: result.analyzedBy,
      riskScore: result.riskScore, pages: extracted.pageCount,
    });

    await run(
      `UPDATE jobs SET status='done', step='Complete', progress=100, finished_at=? WHERE id=?`,
      [now(), jobId]);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[jobs] ${jobId} failed:`, err);
    await run(`UPDATE jobs SET status='failed', step='Failed', error=?, finished_at=? WHERE id=?`,
      [message, now(), jobId]);
  }
}
