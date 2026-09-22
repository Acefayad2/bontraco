import { NextResponse } from "next/server";
import { getSession, audit } from "@/lib/server/auth";
import { putBlob } from "@/lib/server/storage";
import { one, run, id, now } from "@/lib/server/db";
import { insertContract } from "@/lib/server/repo";
import { enqueueAnalysis } from "@/lib/server/jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 25 * 1024 * 1024;
const ACCEPTED = new Set(["application/pdf", "text/plain", "text/markdown"]);

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file was uploaded." }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "That file is empty." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `That file is ${(file.size / 1048576).toFixed(1)}MB. The limit is 25MB.` },
      { status: 413 },
    );
  }

  // Trust the extension over the browser-supplied type, which is unreliable.
  const name = file.name;
  const mime = name.toLowerCase().endsWith(".pdf") ? "application/pdf"
    : name.toLowerCase().endsWith(".md") ? "text/markdown"
    : name.toLowerCase().endsWith(".txt") ? "text/plain"
    : file.type;
  if (!ACCEPTED.has(mime)) {
    return NextResponse.json(
      { error: "Only PDF, .txt and .md files are supported in this build." },
      { status: 415 },
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const blob = await putBlob(session.orgId, bytes);

  const docId = id("doc");
  await run(
    `INSERT INTO documents (id, org_id, filename, mime, bytes, sha256, storage_key, created_at)
     VALUES (?,?,?,?,?,?,?,?)`,
    [docId, session.orgId, name, mime, blob.bytes, blob.sha256, blob.key, now()],
  );

  // A placeholder contract exists from the moment of upload so the document is
  // never orphaned; the analyzer fills in the real title, parties and dates.
  const count = await one<{ n: string | number }>(
    `SELECT COUNT(*) AS n FROM contracts WHERE org_id = ?`, [session.orgId]);
  const seq = Number(count?.n ?? 0) + 1;

  const contractId = await insertContract(session.orgId, {
    ref: `BC-2026-${String(500 + seq).padStart(4, "0")}`,
    title: stripExtension(name),
    counterparty: "Pending analysis",
    type: "Vendor", status: "draft", value: 0,
    ownerUserId: session.userId, department: "",
    effectiveDate: null, expiryDate: null, renewalNotice: 0, autoRenew: false,
    governingLaw: "", risk: "low", riskScore: 0, aiConfidence: 0, pages: 0,
    summary: "Analysis in progress.", tags: ["Uploaded"], source: "upload",
  });

  await run(`UPDATE documents SET contract_id = ? WHERE id = ? AND org_id = ?`,
    [contractId, docId, session.orgId]);

  await audit(session.orgId, session.userId, "contract.uploaded", "contract", contractId, {
    filename: name, bytes: blob.bytes, sha256: blob.sha256,
  });

  const jobId = await enqueueAnalysis(session.orgId, docId, contractId, session.userId);
  return NextResponse.json({ jobId, contractId }, { status: 202 });
}

function stripExtension(n: string) {
  return n.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim() || "Untitled document";
}
