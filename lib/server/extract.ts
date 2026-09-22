import "server-only";

export interface ExtractedPage {
  page: number;
  text: string;
}

export interface ExtractedDocument {
  pageCount: number;
  pages: ExtractedPage[];
  fullText: string;
}

/* PDF text extraction with page anchors.
 *
 * Page numbers are kept per chunk so a finding can cite "§11.2, page 11" and
 * have that be true rather than decorative — the analyzer is given the page
 * number alongside each chunk of text and returns it with each finding.
 *
 * pdf.js emits text as positioned items, not lines. Joining them naively
 * produces artefacts like "fee s" where a word straddles two items, so items
 * are joined using their own end-of-line flags and horizontal gaps. */
export async function extractPdf(bytes: Uint8Array): Promise<ExtractedDocument> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await pdfjs.getDocument({
    data: bytes,
    useSystemFonts: true,
    disableFontFace: true,
  }).promise;

  const pages: ExtractedPage[] = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n);
    const content = await page.getTextContent();

    let out = "";
    let prevEndX: number | null = null;
    for (const item of content.items) {
      if (!("str" in item)) continue;
      const str = item.str;
      const x = item.transform?.[4] ?? 0;
      const width = item.width ?? 0;

      if (out.length > 0 && prevEndX !== null) {
        const gap = x - prevEndX;
        // A visible gap is a space; a negligible one means pdf.js split a word.
        if (gap > 1) out += " ";
      }
      out += str;
      prevEndX = x + width;

      if (item.hasEOL) { out += "\n"; prevEndX = null; }
    }

    pages.push({ page: n, text: normalise(out) });
    page.cleanup();
  }

  await doc.cleanup();
  return {
    pageCount: doc.numPages,
    pages,
    fullText: pages.map((p) => p.text).join("\n\n"),
  };
}

function normalise(s: string) {
  return s
    .replace(/ /g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Plain-text and Markdown uploads need no parsing, but still get page anchors
 *  so the rest of the pipeline is identical. ~3k chars per notional page. */
export function extractText(raw: string): ExtractedDocument {
  const text = normalise(raw);
  const SIZE = 3000;
  const pages: ExtractedPage[] = [];
  for (let i = 0, p = 1; i < text.length; i += SIZE, p++) {
    pages.push({ page: p, text: text.slice(i, i + SIZE) });
  }
  if (pages.length === 0) pages.push({ page: 1, text: "" });
  return { pageCount: pages.length, pages, fullText: text };
}
