"use client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/primitives";

type Phase =
  | { kind: "idle" }
  | { kind: "uploading" }
  | { kind: "analyzing"; step: string; progress: number; contractId: string }
  | { kind: "done"; contractId: string }
  | { kind: "error"; message: string };

/* Upload → analyse → navigate.
 *
 * The request returns as soon as the document is stored; analysis runs as a
 * job and this polls it. That is the shape the real pipeline needs — a 34-page
 * contract takes far longer than a request should stay open. */
export function UploadContract() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;

    setPhase({ kind: "uploading" });
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/contracts/upload", { method: "POST", body });
      const json = (await res.json().catch(() => null)) as
        { jobId?: string; contractId?: string; error?: string } | null;

      if (!res.ok || !json?.jobId || !json.contractId) {
        setPhase({ kind: "error", message: json?.error ?? "Upload failed." });
        return;
      }
      await poll(json.jobId, json.contractId);
    } catch {
      setPhase({ kind: "error", message: "Could not reach the server." });
    }
  }

  async function poll(jobId: string, contractId: string) {
    setPhase({ kind: "analyzing", step: "Queued", progress: 0, contractId });
    const started = Date.now();

    while (Date.now() - started < 5 * 60_000) {
      await new Promise((r) => setTimeout(r, 900));
      const res = await fetch(`/api/jobs/${jobId}`, { cache: "no-store" });
      if (!res.ok) {
        setPhase({ kind: "error", message: "Lost track of the analysis job." });
        return;
      }
      const job = (await res.json()) as
        { status: string; step: string; progress: number; error: string | null };

      if (job.status === "failed") {
        setPhase({ kind: "error", message: job.error ?? "Analysis failed." });
        return;
      }
      if (job.status === "done") {
        setPhase({ kind: "done", contractId });
        router.refresh();
        setTimeout(() => router.push(`/dashboard/contracts/${contractId}`), 550);
        return;
      }
      setPhase({ kind: "analyzing", step: job.step, progress: job.progress, contractId });
    }
    setPhase({ kind: "error", message: "Analysis timed out after five minutes." });
  }

  const busy = phase.kind === "uploading" || phase.kind === "analyzing";

  return (
    <div className="flex flex-col items-end gap-2">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
        onChange={onPick}
        className="sr-only"
        aria-label="Choose a contract to upload"
      />
      <Button size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
        {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
        {phase.kind === "uploading" ? "Uploading…"
          : phase.kind === "analyzing" ? "Analysing…"
          : "Upload contract"}
      </Button>

      {phase.kind === "analyzing" && (
        <div className="w-[230px]" aria-live="polite">
          <div className="mb-1 flex items-baseline justify-between">
            <span className="text-[11.5px] text-[var(--fg-muted)]">{phase.step}</span>
            <span className="tabular text-[11.5px] text-[var(--fg-subtle)]">{phase.progress}%</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-[var(--surface-2)]">
            <div
              className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-500"
              style={{ width: `${phase.progress}%` }}
            />
          </div>
        </div>
      )}

      {phase.kind === "done" && (
        <p className="inline-flex items-center gap-1.5 text-[12px] text-brand-700 dark:text-brand-400" aria-live="polite">
          <CheckCircle2 className="size-3.5" /> Analysed — opening
        </p>
      )}

      {phase.kind === "error" && (
        <p role="alert" className="max-w-[300px] text-right text-[12px] leading-snug text-risk-high">
          <AlertCircle className="mr-1 inline size-3.5 align-[-2px]" />
          {phase.message}
        </p>
      )}
    </div>
  );
}
