# Bontraco — from prototype to product

Status as of 22 September 2026. Written after building the vertical slice, so
the estimates below reflect what the slice actually cost rather than a guess.

## Where we are

A working slice exists. A user signs in, uploads a PDF, and gets it parsed,
scored against their org's playbook, and written back as findings that cite the
page they came from. Auth is real, tenancy is enforced in the data layer, the
audit log records who did what, and analysis runs as a job rather than inside a
request.

That is the skeleton. It runs on one machine, against SQLite, with the
filesystem as object storage. Everything below is what stands between that and
something a paying customer depends on.

## What is deliberately not done

Listed so nobody mistakes an omission for an oversight.

| Area | Present | Missing |
|---|---|---|
| Auth | scrypt, server sessions, httpOnly cookie | Email verification, password reset, rate limiting, lockout, MFA, session rotation on privilege change |
| Tenancy | `org_id` on every row, enforced in `repo.ts` | Database-level RLS as a second line of defence |
| Storage | Content-hashed local files | Object store, encryption at rest, lifecycle and retention |
| Ingestion | PDF and plain text, per-page anchors | DOCX, OCR for scans, character-level offsets, defined-term resolution |
| Analysis | Claude with a JSON schema; regex fallback | Precedent retrieval, position learning, evals, confidence calibration |
| Jobs | In-process, polled | Durable queue, separate workers, retries, dead-letter handling |
| Obligations | Stored and displayed | Scheduler, notifications, escalation |
| Billing | — | Everything |
| Compliance | Audit log | The certifications the marketing site claims |

## Sequence

Ordered by what unblocks what, not by what is most interesting.

### 1. Make it deployable (1–2 weeks)

The slice cannot deploy as-is: SQLite and local files do not survive a
serverless environment, and the app is no longer a static export.

- Postgres, via a connection pool. `repo.ts` is plain parameterised SQL, so this
  is a driver swap plus a migration runner, not a rewrite.
- S3-compatible object storage behind the existing `putBlob`/`getBlob` interface.
- A host that runs a Node server. The marketing pages can stay static.
- Row-level security policies as defence in depth, so a missed `WHERE org_id`
  fails closed at the database rather than returning another tenant's contract.

### 2. Make the analysis trustworthy (3–6 weeks)

This is the product. Everything else is plumbing around it.

- **An eval set before any tuning.** 50–100 contracts with human-labelled
  clause spans and expected findings. Without it, prompt changes are guesses
  and there is no way to know whether a model upgrade helped.
- **Calibration.** The UI shows a confidence number. It has to mean something —
  when the model says 96%, it should be right about 96% of the time. Measure it,
  then either calibrate or stop displaying it.
- **Precedent retrieval.** "Learns the positions from contracts you have already
  signed" means retrieving comparable executed clauses and scoring against them,
  not prompting from scratch each time. This is the differentiator and the
  hardest part; treat it as research with a fallback to the static playbook.
- **Character offsets, not just page numbers.** Needed to highlight a clause in
  a document viewer rather than merely naming its page.
- **Cost control.** A 68-page lease is a large prompt. Cache the playbook prefix,
  and measure cost per contract before volume makes it a surprise.

### 3. Make it usable by a team (3–4 weeks)

- Invitations, roles, and permissions that actually gate actions.
- Obligation scheduler with email and Slack delivery, plus escalation when a
  date passes unacknowledged.
- Comments and assignment on findings — review is collaborative.
- Redline export to DOCX with tracked changes. Lawyers negotiate in Word.

### 4. Integrations (4–8 weeks, mostly parallelisable)

SharePoint, Google Drive and Box for ingestion. DocuSign for execution status.
SSO and SCIM, which enterprise buyers treat as table stakes. Each is
self-contained; none blocks the others.

### 5. Commercial (2–3 weeks)

Stripe, plans, metering, and the usage counters the pricing page implies.

## The compliance problem

The marketing site makes specific, checkable claims: SOC 2 Type II, ISO 27001,
customer-managed keys, a 99.9% SLA, "your data trains nothing", "audited
annually".

None of those are true today. They are the first thing a security reviewer at a
legal or financial buyer will ask for evidence of, and the audit window is
months regardless of how fast the engineering goes. Two honest options:

1. Soften the copy now to describe the posture that exists, and add claims as
   they become true.
2. Start the SOC 2 readiness process immediately, and keep the claims only if
   the timeline supports them before the first real sales conversation.

Doing neither is the one path that creates real exposure. This is a legal-tech
product sold to lawyers.

## Rough shape

| Phase | Effort |
|---|---|
| Deployable | 1–2 weeks |
| Trustworthy analysis | 3–6 weeks |
| Team-usable | 3–4 weeks |
| Integrations | 4–8 weeks |
| Commercial | 2–3 weeks |

Call it three to four months for one experienced engineer to reach a defensible
first customer, with SOC 2 running alongside rather than after. Phase 2 carries
almost all the risk: the rest is known work.

## Running the slice

```bash
npm install
npm run dev
```

Open http://localhost:3000 and sign in as `priya@bontraco.demo` /
`bontraco-demo`. The demo org and its twelve fictional agreements are created on
first sign-in. Upload a PDF from the contracts page to exercise the pipeline.

Set `ANTHROPIC_API_KEY` to use Claude for the analysis. Without it the
deterministic fallback runs instead, and both the contract record and the UI say
so.
