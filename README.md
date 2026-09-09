# Bontraco

AI contract intelligence — a marketing site and a full internal dashboard for a
contract lifecycle management platform.

Bontraco reads a contract, extracts every clause, scores each one against the
company's own playbook rather than a generic template, and drafts the redline
before a lawyer opens the file. Post-signature duties become tracked obligations
with owners and dates.

## Stack

- **Next.js 16** (App Router, React 19) — all routes statically prerendered
- **Tailwind CSS v4** — design tokens defined in `app/globals.css` under `@theme`
- **Recharts 3** for data visualisation
- **lucide-react** for icons (no emoji used as iconography)
- No backend. `lib/data.ts` holds a deterministic demo dataset — no `Math.random`,
  so server and client render identically.

## Running it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Structure

```
app/
  page.tsx                        Marketing landing page
  dashboard/
    layout.tsx                    Sidebar + topbar shell
    page.tsx                      Overview — KPIs, cycle time, attention queue
    contracts/page.tsx            Repository: sortable table + card view
    contracts/[id]/page.tsx       Contract detail with clause-level AI analysis
    obligations/page.tsx          Post-signature duties, grouped by urgency
    renewals/page.tsx             Decision points ordered by notice deadline
    risk/page.tsx                 Portfolio-wide findings, ranked by deviation
    analytics/page.tsx            Cycle time, negotiation win rates, owner splits
    assistant/page.tsx            "Ask Bontraco" — cited answers across contracts
    settings/page.tsx             Playbooks, integrations, team, security posture
components/
  ui/                             Primitives: Button, Card, Badge, Meter, Avatar
  marketing/                      Landing-page sections
  dash/                           Dashboard shell, table, charts, clause analysis
lib/
  types.ts                        Contract, Clause, Obligation shapes
  data.ts                         Demo dataset + aggregations + formatters
```

## Design system

Swiss/editorial enterprise: high contrast, grid-led, no decorative gradients.

| Token | Light | Dark |
|---|---|---|
| Background | `#f7f9fb` | `#070b12` |
| Surface | `#ffffff` | `#0e1626` |
| Accent (brand) | `#0a6640` | `#12a066` |
| High risk | `#b42318` | same |
| Medium risk | `#b54708` | same |
| Low risk | `#067647` | same |

Type: **Instrument Serif** for display, **Inter** for UI, **JetBrains Mono** for
contract references and figures.

Colour is never the only carrier of meaning — every risk level pairs a hue with
an icon and a text label.

## Theming

Theme is stored in `localStorage` under `bontraco-theme` and applied to
`<html data-theme>` by an inline script in `app/layout.tsx`, before first paint,
so there is no flash. The system preference is the default.

## Known platform quirk

Netlify injects two `<meta>` tags into `<head>` ahead of anything Next
renders. React cannot reconcile them and logs one recoverable hydration
warning per page load. `ThemeSync` re-asserts `data-theme` after hydration so
the theme is always correct; nothing else is affected. Matching the tags in
source would mean hardcoding a host marketing URL and site id, so the warning
is left in place.

## Verified

- Production build: 24 routes, all prerendered
- No horizontal overflow at 375 / 390 / 430 / 768 / 1024 / 1280 / 1440 / 1920 px
- No console or page errors in light or dark
- One `<h1>` per page, no unlabelled controls, no missing alt text
- `prefers-reduced-motion` respected; scroll reveals fail open so content is
  never left invisible if IntersectionObserver does not fire

## Note

This is a demonstration environment. Every contract, counterparty, figure and
AI response is fictional, and the assistant answers from written examples
rather than a live model.
