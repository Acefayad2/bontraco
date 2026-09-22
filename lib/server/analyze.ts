import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { RiskLevel } from "@/lib/types";
import type { PlaybookPosition } from "./repo";
import type { ExtractedDocument } from "./extract";

/* Clause extraction and playbook-deviation scoring.
 *
 * Two analyzers behind one interface:
 *   - claude()    the real one. Structured outputs guarantee the JSON shape,
 *                 so there is no parsing guesswork on a legal document.
 *   - heuristic() a deterministic regex analyzer used when no API key is
 *                 configured, so the pipeline is demoable offline. It is
 *                 genuinely worse and the UI labels which one ran.
 *
 * Which one produced a result is recorded on the contract (analyzed_by) and
 * surfaced in the UI — a reader should never have to guess whether a finding
 * came from a model or a regex. */

const MODEL = "claude-opus-5";

export interface Finding {
  title: string;
  category: string;
  risk: RiskLevel;
  deviation: number;
  excerpt: string;
  finding: string;
  suggestion: string;
  page: number;
}

export interface AnalysisResult {
  findings: Finding[];
  summary: string;
  riskScore: number;
  risk: RiskLevel;
  confidence: number;
  counterparty: string | null;
  title: string | null;
  contractType: string | null;
  effectiveDate: string | null;
  expiryDate: string | null;
  governingLaw: string | null;
  value: number | null;
  autoRenew: boolean | null;
  renewalNotice: number | null;
  analyzedBy: string;
}

const RESULT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "counterparty", "contract_type", "summary", "confidence", "findings"],
  properties: {
    title: { type: "string", description: "The agreement's title, e.g. 'Master Services Agreement'." },
    counterparty: { type: "string", description: "The other party's legal name. Empty string if not stated." },
    contract_type: {
      type: "string",
      enum: ["MSA", "NDA", "SOW", "DPA", "Vendor", "Employment", "Lease", "License", "Reseller"],
    },
    effective_date: { type: ["string", "null"], description: "ISO 8601 date, or null if not stated." },
    expiry_date: { type: ["string", "null"], description: "ISO 8601 date, or null if not stated." },
    governing_law: { type: ["string", "null"], description: "Governing jurisdiction, or null." },
    total_value_usd: { type: ["number", "null"], description: "Total contract value in USD, or null." },
    auto_renew: { type: ["boolean", "null"] },
    renewal_notice_days: { type: ["integer", "null"] },
    summary: {
      type: "string",
      description:
        "2–4 sentences for a general counsel: what this agreement does commercially, " +
        "then the specific exposure that drives its risk. No preamble.",
    },
    confidence: {
      type: "integer", minimum: 0, maximum: 100,
      description: "How confident you are in this extraction given the text quality.",
    },
    findings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "category", "risk", "deviation", "excerpt", "finding", "suggestion", "page"],
        properties: {
          title: { type: "string", description: "Clause name with its section number, e.g. '§11.2 Limitation of Liability'." },
          category: {
            type: "string",
            enum: ["Liability", "Termination", "Data Protection", "Intellectual Property",
                   "Commercial", "Compliance", "Confidentiality", "Other"],
          },
          risk: { type: "string", enum: ["high", "medium", "low"] },
          deviation: {
            type: "integer", minimum: 0, maximum: 100,
            description: "How far this departs from the playbook position. 0 means it matches.",
          },
          excerpt: { type: "string", description: "The clause text, verbatim from the document. Max ~400 chars." },
          finding: { type: "string", description: "What is wrong and why it matters commercially. Cite the playbook position." },
          suggestion: { type: "string", description: "The specific edit to make. Name the words to change." },
          page: { type: "integer", minimum: 1, description: "Page the clause appears on." },
        },
      },
    },
  },
} as const;

function playbookPrompt(positions: PlaybookPosition[]) {
  if (positions.length === 0) return "No playbook configured; score against general market standard.";
  return positions.map((p) =>
    `- [${p.category}] ${p.title}\n` +
    `  Standard position: ${p.standard}\n` +
    (p.fallback ? `  Acceptable fallback: ${p.fallback}\n` : "") +
    (p.walkAway ? `  Walk away if: ${p.walkAway}\n` : "") +
    `  Severity if breached: ${p.severity}`,
  ).join("\n\n");
}

const SYSTEM = `You are the contract analysis engine for Bontraco, a contract lifecycle management product used by in-house legal teams.

You read a contract and report where it departs from the customer's own negotiating playbook. You are not a general legal assistant and you do not give legal advice to end users — you produce structured findings that a qualified lawyer reviews.

How to work:

- Report only what the text actually says. If a clause is absent, that absence can itself be a finding, but never invent clause text. Every excerpt must be verbatim from the document.
- Score deviation against the supplied playbook, not against your general sense of market standard. A clause that matches the playbook is deviation 0 even if you would have drafted it differently.
- The page number on each finding must be the page the clause text came from. The document is given to you page by page.
- Be specific in findings and suggestions. "The liability cap is high" is useless; "Cap is 3x trailing twelve-month fees against a 1x playbook ceiling; replace 'three (3) times' with 'one (1) times'" is actionable.
- Set confidence honestly. Scanned or garbled text, or a document that does not look like a contract, should score low.
- Return findings for clauses that matter. A long contract with nothing wrong should return few findings, not padding.`;

export async function analyze(
  doc: ExtractedDocument,
  positions: PlaybookPosition[],
  filename: string,
  ourName?: string | null,
): Promise<AnalysisResult> {
  if (!hasApiKey()) return heuristic(doc, positions, ourName);
  try {
    return await withClaude(doc, positions, filename);
  } catch (err) {
    // A failed analysis must not lose the upload. Fall back, and say so.
    console.error("[analyze] Claude call failed, falling back to heuristic:", err);
    const result = heuristic(doc, positions, ourName);
    result.analyzedBy = "heuristic (model call failed)";
    return result;
  }
}

export function hasApiKey() {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

async function withClaude(
  doc: ExtractedDocument,
  positions: PlaybookPosition[],
  filename: string,
): Promise<AnalysisResult> {
  const client = new Anthropic();

  const pagedText = doc.pages
    .map((p) => `<page number="${p.page}">\n${p.text}\n</page>`)
    .join("\n");

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 16000,
    system: SYSTEM,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "high",
      format: { type: "json_schema", schema: RESULT_SCHEMA },
    },
    messages: [
      {
        role: "user",
        content:
          `The customer's negotiating playbook:\n\n${playbookPrompt(positions)}\n\n` +
          `---\n\nContract to analyse (filename: ${filename}, ${doc.pageCount} pages):\n\n${pagedText}`,
      },
    ],
  });

  if (response.stop_reason === "refusal") {
    throw new Error(`Model declined the request: ${response.stop_details?.category ?? "unknown"}`);
  }

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  const parsed = JSON.parse(text) as {
    title: string; counterparty: string; contract_type: string;
    effective_date: string | null; expiry_date: string | null;
    governing_law: string | null; total_value_usd: number | null;
    auto_renew: boolean | null; renewal_notice_days: number | null;
    summary: string; confidence: number;
    findings: Array<Omit<Finding, "risk"> & { risk: string }>;
  };

  const findings: Finding[] = parsed.findings.map((f) => ({
    title: f.title,
    category: f.category,
    risk: (["high", "medium", "low"].includes(f.risk) ? f.risk : "medium") as RiskLevel,
    deviation: clamp(f.deviation, 0, 100),
    excerpt: f.excerpt.slice(0, 1200),
    finding: f.finding,
    suggestion: f.suggestion,
    page: clamp(f.page, 1, Math.max(doc.pageCount, 1)),
  }));

  const { riskScore, risk } = score(findings);
  return {
    findings,
    summary: parsed.summary,
    riskScore,
    risk,
    confidence: clamp(parsed.confidence, 0, 100),
    counterparty: parsed.counterparty || null,
    title: parsed.title || null,
    contractType: parsed.contract_type || null,
    effectiveDate: parsed.effective_date,
    expiryDate: parsed.expiry_date,
    governingLaw: parsed.governing_law,
    value: parsed.total_value_usd,
    autoRenew: parsed.auto_renew,
    renewalNotice: parsed.renewal_notice_days,
    analyzedBy: MODEL,
  };
}

/* ── Deterministic fallback ───────────────────────────────────────────────
   Pattern-matches the issues the default playbook covers. It exists so the
   pipeline is demoable with no API key; it is not the product. */

interface Rule {
  category: string;
  title: string;
  test: RegExp;
  risk: RiskLevel;
  deviation: number;
  finding: (m: RegExpMatchArray) => string;
  suggestion: string;
}

const RULES: Rule[] = [
  {
    category: "Liability", title: "Limitation of Liability",
    test: /(?:aggregate\s+liability|liability\s+(?:shall|will)\s+not\s+exceed)[^.]{0,220}?(one|two|three|four|five|1|2|3|4|5)\s*\(?\d?\)?\s*times/i,
    risk: "high", deviation: 82,
    finding: (m) => `Liability is capped at ${m[1]}× fees. The playbook ceiling is 1×, with an uplift reserved for data-breach claims only.`,
    suggestion: 'Reduce the multiplier to one (1) times and move any uplift into a separate breach carve-out capped at 2×.',
  },
  {
    category: "Termination", title: "Auto-Renewal",
    test: /automatically\s+renew[^.]{0,260}?(\d{2,3})\s*\)?\s*days?/i,
    risk: "medium", deviation: 38,
    finding: (m) => `Auto-renews unless notice is served ${m[1]} days before term end. Playbook standard is 30 days; a longer window silently commits another term.`,
    suggestion: "Reduce the non-renewal notice window to 30 days and cap renewal-term price uplift at CPI or 3%, whichever is lower.",
  },
  {
    category: "Data Protection", title: "Sub-processor Engagement",
    test: /sub-?processors?[^.]{0,200}?(sole\s+discretion|without\s+(?:prior\s+)?notice)/i,
    risk: "high", deviation: 64,
    finding: () => "Sub-processors may be engaged without prior notice or an objection right. This fails Art. 28(2) GDPR.",
    suggestion: "Require 30 days' advance notice of new sub-processors plus a good-faith objection right with a termination remedy.",
  },
  {
    category: "Data Protection", title: "Breach Notification Window",
    test: /(?:personal\s+data\s+breach|security\s+breach)[^.]{0,200}?(\d{2,3})\s*\)?\s*hours/i,
    risk: "medium", deviation: 41,
    finding: (m) => `Breach notification is ${m[1]} hours. At 72 hours the regulator deadline is consumed entirely, leaving no time to file.`,
    suggestion: "Tighten to 24 hours to controller, with a preliminary notice at 12 hours.",
  },
  {
    category: "Intellectual Property", title: "Ownership of Deliverables",
    test: /deliverables[^.]{0,220}?(?:remain|shall\s+be)\s+the\s+(?:exclusive\s+)?property\s+of\s+(supplier|vendor|contractor|consultant)/i,
    risk: "high", deviation: 77,
    finding: (m) => `Deliverables remain the property of the ${m[1]}, with the customer taking only a licence. Paid-for work product should assign on payment.`,
    suggestion: "Assign Deliverables to Customer on payment; grant Supplier a licence back to its pre-existing and generally applicable components.",
  },
  {
    category: "Commercial", title: "Price Escalation",
    test: /(?:fees?|prices?)\s+may\s+be\s+increased[^.]{0,200}?(\d{1,2})\s*(?:%|percent)/i,
    risk: "medium", deviation: 52,
    finding: (m) => `Annual uplift is capped at ${m[1]}%, above the 3%/CPI ceiling in the playbook.`,
    suggestion: "Cap at the lesser of CPI-U or 3%, tied to a published index.",
  },
  {
    category: "Termination", title: "Termination for Convenience",
    test: /terminate[^.]{0,120}?for\s+convenience[^.]{0,260}?(remain\s+liable|no\s+refund|shall\s+not\s+be\s+entitled\s+to\s+(?:any\s+)?refund)/i,
    risk: "high", deviation: 71,
    finding: () => "A convenience-termination right is granted but the fee-acceleration proviso negates it — the economic effect is a non-terminable term.",
    suggestion: "Strike the proviso and substitute pro-rata refund of prepaid, unused fees within 30 days of termination.",
  },
  {
    category: "Compliance", title: "Governing Law & Venue",
    test: /governed\s+by\s+the\s+laws\s+of\s+(?:the\s+)?(?:State\s+of\s+)?([A-Z][A-Za-z ]{2,24})/,
    risk: "medium", deviation: 44,
    finding: (m) => `Governing law is ${m[1].trim()}. The playbook's approved jurisdictions are Delaware and New York; litigating elsewhere adds cost to any dispute.`,
    suggestion: "Move to Delaware law, or agree to AAA arbitration seated in New York.",
  },
  {
    category: "Commercial", title: "Payment Terms",
    test: /(?:pay|payment)[^.]{0,120}?within\s+(thirty|sixty|ninety|30|45|60|90)\s*\(?\d{0,2}\)?\s*days/i,
    risk: "low", deviation: 10,
    finding: (m) => `Payment terms are net-${String(m[1]).replace(/thirty/i, "30").replace(/sixty/i, "60").replace(/ninety/i, "90")}, consistent with the playbook.`,
    suggestion: "No change required.",
  },
];

function heuristic(
  doc: ExtractedDocument,
  positions: PlaybookPosition[],
  ourName?: string | null,
): AnalysisResult {
  const findings: Finding[] = [];

  for (const rule of RULES) {
    for (const page of doc.pages) {
      const m = page.text.match(rule.test);
      if (!m) continue;
      findings.push({
        title: rule.title,
        category: rule.category,
        risk: rule.risk,
        deviation: rule.deviation,
        excerpt: excerptAround(page.text, m.index ?? 0),
        finding: rule.finding(m),
        suggestion: rule.suggestion,
        page: page.page,
      });
      break; // first occurrence per rule
    }
  }

  const { riskScore, risk } = score(findings);
  const flagged = findings.filter((f) => f.risk !== "low").length;

  return {
    findings,
    summary:
      `Offline analysis matched ${findings.length} playbook ${findings.length === 1 ? "position" : "positions"} ` +
      `across ${doc.pageCount} ${doc.pageCount === 1 ? "page" : "pages"}, of which ${flagged} ` +
      `${flagged === 1 ? "is" : "are"} outside policy. This run used the pattern-matching fallback, not the model — ` +
      `set ANTHROPIC_API_KEY for a full clause-by-clause read.`,
    riskScore,
    risk,
    confidence: findings.length > 0 ? 55 : 25,
    counterparty: guessCounterparty(doc.fullText, ourName),
    title: guessTitle(doc.fullText),
    contractType: guessType(doc.fullText),
    effectiveDate: null,
    expiryDate: null,
    governingLaw: doc.fullText.match(/laws\s+of\s+(?:the\s+)?(?:State\s+of\s+)?([A-Z][A-Za-z ]{2,24})/)?.[1]?.trim() ?? null,
    value: null,
    autoRenew: /automatically\s+renew/i.test(doc.fullText),
    renewalNotice: Number(doc.fullText.match(/non-?renewal[^.]{0,120}?(\d{2,3})\s*days/i)?.[1]) || null,
    analyzedBy: "heuristic",
  };
}

function excerptAround(text: string, index: number) {
  const start = Math.max(0, index - 40);
  return text.slice(start, start + 420).replace(/\s+/g, " ").trim();
}

function guessTitle(text: string) {
  // Contract titles are their own line and mostly upper case. Matching a bare
  // run of letters ending in AGREEMENT picks up fragments — "MASTER SERVICES
  // AGREEMENT" yielded "Vices Agreement" — so anchor to the whole line and
  // require it to look like a heading.
  for (const line of text.split("\n").slice(0, 40)) {
    const t = line.trim();
    if (t.length < 6 || t.length > 90) continue;
    if (!/(AGREEMENT|ADDENDUM|CONTRACT|LEASE|LICEN[CS]E|STATEMENT OF WORK)\s*$/i.test(t)) continue;
    const letters = t.replace(/[^A-Za-z]/g, "");
    if (letters.length === 0) continue;
    const upperRatio = letters.replace(/[^A-Z]/g, "").length / letters.length;
    if (upperRatio < 0.6 && !/^[A-Z]/.test(t)) continue;
    return titleCase(t.replace(/[.\s]+$/, ""));
  }
  return null;
}

const ENTITY = String.raw`[A-Z][A-Za-z0-9&.,' -]{2,48}?(?:Inc|LLC|L\.L\.C|Ltd|Limited|GmbH|Corp|Corporation|Company|Partners|Group|Systems|Holdings|Technologies)\.?`;

function guessCounterparty(text: string, ourName?: string | null) {
  // "between A and B ('Supplier')" names two parties and the first is usually
  // us. Prefer whichever is labelled as the supplying party; otherwise take a
  // named party that is not our own entity.
  // No "i" flag anywhere below: ENTITY starts with [A-Z] on purpose, and a
  // case-insensitive match lets it begin mid-sentence on a lowercase word —
  // which is how "and Northwind Logistics Inc." got picked up as a party name.
  const labelled = text.match(
    new RegExp(String.raw`\b(${ENTITY})\s*\(\s*["'“”]?(?:[Tt]he\s+)?(?:[Ss]upplier|[Vv]endor|[Cc]ontractor|[Cc]onsultant|[Pp]rovider|[Ll]icensor)`),
  );
  if (labelled) return labelled[1].trim();

  const between = text.match(
    new RegExp(String.raw`[Bb]etween\s+(${ENTITY})\s+and\s+(${ENTITY})`),
  );
  if (between) {
    const [, first, second] = between;
    if (ourName && sameEntity(first, ourName)) return second.trim();
    if (ourName && sameEntity(second, ourName)) return first.trim();
    return second.trim();   // the second party is the counterparty by convention
  }

  const any = text.match(new RegExp(String.raw`\b${ENTITY}`));
  if (any && (!ourName || !sameEntity(any[0], ourName))) return any[0].trim();
  return null;
}

function sameEntity(a: string, b: string) {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");
  const x = norm(a), y = norm(b);
  return x.startsWith(y.slice(0, 10)) || y.startsWith(x.slice(0, 10));
}

function guessType(text: string): string | null {
  const t = text.slice(0, 4000);
  if (/non-?disclosure|confidentiality agreement/i.test(t)) return "NDA";
  if (/data processing (addendum|agreement)/i.test(t)) return "DPA";
  if (/statement of work/i.test(t)) return "SOW";
  if (/master services? agreement/i.test(t)) return "MSA";
  if (/reseller|distribution agreement/i.test(t)) return "Reseller";
  if (/lease/i.test(t)) return "Lease";
  if (/licen[cs]e agreement/i.test(t)) return "License";
  if (/employment agreement|offer letter/i.test(t)) return "Employment";
  return null;
}

function titleCase(s: string) {
  return s.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

/** Portfolio risk score.
 *
 *  The worst finding sets the floor, so one severe problem is never averaged
 *  down into looking safe. Each further finding then closes a fraction of the
 *  remaining headroom rather than adding to a running total — otherwise any
 *  contract with four or five bad clauses pegs at 100 and the score stops
 *  discriminating between "bad" and "catastrophic". */
function score(findings: Finding[]): { riskScore: number; risk: RiskLevel } {
  if (findings.length === 0) return { riskScore: 0, risk: "low" };
  const weights: Record<RiskLevel, number> = { high: 1, medium: 0.55, low: 0.12 };
  const weighted = findings
    .map((f) => clamp(f.deviation, 0, 100) * weights[f.risk])
    .sort((a, b) => b - a);

  let total = weighted[0];
  for (const w of weighted.slice(1)) {
    total += (100 - total) * (w / 100) * 0.35;
  }

  const riskScore = clamp(total, 0, 100);
  const risk: RiskLevel = riskScore >= 65 ? "high" : riskScore >= 35 ? "medium" : "low";
  return { riskScore, risk };
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}
