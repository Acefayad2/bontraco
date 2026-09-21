import Link from "next/link";
import {
  ArrowRight, ArrowUpRight, Check, FileSearch, GitPullRequestArrow,
  Bell, ShieldCheck, Scale, Layers, Lock, Server, FileCheck2, Eye,
} from "lucide-react";
import { SiteNav } from "@/components/marketing/site-nav";
import { HeroPreview } from "@/components/marketing/hero-preview";
import { Reveal } from "@/components/marketing/reveal";
import { Button, Eyebrow, Badge } from "@/components/ui/primitives";
import { Logo } from "@/components/ui/logo";

/* ── Content ─────────────────────────────────────────────────── */

const stats = [
  { value: "81%", label: "Reduction in review cycle time", sub: "21 days → 4 days, median" },
  { value: "$2.1M", label: "Value protected in year one", sub: "Across renegotiated caps and renewals" },
  { value: "41", label: "Clauses extracted per contract", sub: "Average, at 96% confidence" },
  { value: "0", label: "Renewals missed since deployment", sub: "Across 4,200 tracked obligations" },
];

const capabilities = [
  {
    icon: FileSearch,
    title: "Reads the contract, not the metadata",
    body: "Upload a PDF, a scan, or a 68-page lease with handwritten amendments. Bontraco extracts every clause, resolves defined terms across sections, and maps each one to its position in your playbook.",
    detail: "41 clause types · OCR for scans · cross-reference resolution",
  },
  {
    icon: Scale,
    title: "Scores against your playbook, not a generic one",
    body: "Your positions on liability caps, indemnity, and termination are not the market's. Bontraco learns them from the contracts you have already signed, then flags the deviation and quantifies it.",
    detail: "Deviation scoring · precedent matching · position learning",
  },
  {
    icon: GitPullRequestArrow,
    title: "Drafts the redline you would have written",
    body: "Every flag arrives with proposed language, the reasoning behind it, and the fallback position. Accept it, edit it, or send it back to counsel — the audit trail records which.",
    detail: "Clause rewriting · fallback ladders · one-click export to Word",
  },
  {
    icon: Bell,
    title: "Never lets a renewal pass unnoticed",
    body: "Notice windows, true-ups, insurance certificates, and reporting duties are extracted into tracked obligations with owners and dates. The reminder reaches the person accountable, not a shared inbox.",
    detail: "Obligation extraction · owner routing · calendar sync",
  },
];

const steps = [
  { n: "01", title: "Connect your repository", body: "Point Bontraco at SharePoint, Google Drive, Box, or your DMS. Historic contracts are ingested and indexed in hours, not quarters." },
  { n: "02", title: "Bontraco learns your positions", body: "It reads what you have signed and infers the playbook you have been following — including the exceptions you make and for whom." },
  { n: "03", title: "Every new contract is scored on arrival", body: "Before it reaches a lawyer, the contract has a risk score, a clause-by-clause deviation report, and a drafted redline." },
  { n: "04", title: "Obligations run themselves", body: "Post-signature duties become tracked items with owners and dates. Renewals surface 90 days out, not the week they lapse." },
];

const securityItems = [
  { icon: Lock, title: "Encrypted end to end", body: "AES-256 at rest, TLS 1.3 in transit. Customer-managed keys available on Enterprise." },
  { icon: Server, title: "Your data trains nothing", body: "Contracts are never used to train foundation models. Tenant data is isolated at the storage and index layer." },
  { icon: FileCheck2, title: "SOC 2 Type II · ISO 27001", body: "Audited annually. Reports and penetration test summaries available under NDA." },
  { icon: Eye, title: "Every action is attributable", body: "Immutable audit log covering access, AI inference, edits, and exports. Exportable for regulators." },
];

const plans = [
  {
    name: "Team",
    price: "$1,400",
    cadence: "per month",
    for: "Legal teams of 3–10 handling under 500 contracts a year.",
    features: ["Up to 500 contracts", "Clause extraction & risk scoring", "Obligation tracking", "3 playbooks", "Email & Slack alerts", "Standard support"],
    cta: "Start a trial",
    highlight: false,
  },
  {
    name: "Business",
    price: "$4,900",
    cadence: "per month",
    for: "In-house teams running procurement and sales paper side by side.",
    features: ["Up to 5,000 contracts", "Everything in Team", "AI redline drafting", "Unlimited playbooks", "DMS & CLM integrations", "SSO / SCIM", "Named success manager"],
    cta: "Book a walkthrough",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    cadence: "annual agreement",
    for: "Regulated organisations with residency and audit requirements.",
    features: ["Unlimited contracts", "Everything in Business", "Customer-managed keys", "Private deployment or VPC", "Data residency selection", "Custom clause models", "99.9% uptime SLA"],
    cta: "Contact sales",
    highlight: false,
  },
];

const logos = ["NORTHWIND", "HELIOS", "VERTEX", "MERIDIAN", "HARBORVIEW", "KESTREL"];

/* ── Page ────────────────────────────────────────────────────── */

export default function Home() {
  return (
    <div className="min-h-dvh bg-[var(--bg)]">
      <SiteNav />

      <main id="main">
        {/* ── HERO ───────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b border-[var(--line)]">
          <div
            aria-hidden
            className="hairline-grid pointer-events-none absolute inset-0 opacity-[0.35]
              [mask-image:radial-gradient(ellipse_75%_60%_at_50%_0%,#000_20%,transparent_75%)]"
          />
          <div className="relative mx-auto max-w-[1200px] px-6 pb-20 pt-16 sm:pt-24 lg:pb-28">
            <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16">
              <div>
                <Reveal>
                  <div className="inline-flex items-center gap-2 rounded-full border border-[var(--line-strong)]
                      bg-[var(--surface)] py-1 pl-1 pr-3 text-[12.5px] text-[var(--fg-muted)]">
                    <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold
                        text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                      New
                    </span>
                    Playbook learning is now generally available
                  </div>
                </Reveal>

                <Reveal delay={60}>
                  <h1 className="display mt-7 max-w-[13ch] text-[clamp(2.6rem,5.6vw,4.05rem)] text-[var(--fg)]">
                    Know what you are signing.{" "}
                    <span className="whitespace-nowrap">
                      <span className="underscore">Before</span> you
                    </span>{" "}
                    sign it.
                  </h1>
                </Reveal>

                <Reveal delay={120}>
                  <p className="mt-7 max-w-[52ch] text-[18px] leading-[1.6] text-[var(--fg-muted)]">
                    Bontraco reads every contract that reaches your desk, scores it against
                    the positions your team actually takes, and drafts the redline before
                    a lawyer opens the file. Review cycles drop from weeks to days —
                    and nothing lapses in silence.
                  </p>
                </Reveal>

                <Reveal delay={180}>
                  <div className="mt-9 flex flex-wrap items-center gap-3">
                    <Link href="/dashboard">
                      <Button size="lg" className="group">
                        Open the dashboard
                        <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                      </Button>
                    </Link>
                    <a href="#how">
                      <Button size="lg" variant="outline">See how it works</Button>
                    </a>
                  </div>
                </Reveal>

                <Reveal delay={240}>
                  <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-[var(--fg-subtle)]">
                    {["SOC 2 Type II", "ISO 27001", "GDPR-ready", "Your data trains nothing"].map((t) => (
                      <span key={t} className="inline-flex items-center gap-1.5">
                        <ShieldCheck className="size-3.5 text-brand-600 dark:text-brand-400" />
                        {t}
                      </span>
                    ))}
                  </div>
                </Reveal>
              </div>

              <Reveal delay={140}>
                <HeroPreview />
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── LOGO STRIP (static — no carousel to pause) ──────── */}
        <section className="border-b border-[var(--line)] bg-[var(--surface)]">
          <div className="mx-auto max-w-[1200px] px-6 py-10">
            <p className="text-center text-[12px] font-medium uppercase tracking-[0.16em] text-[var(--fg-subtle)]">
              Contract portfolios managed on Bontraco
            </p>
            <ul className="mt-6 grid grid-cols-2 items-center gap-x-6 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
              {logos.map((l) => (
                <li
                  key={l}
                  className="text-center font-serif text-[19px] tracking-[0.08em] text-[var(--fg-subtle)]
                    transition-colors duration-200 hover:text-[var(--fg-muted)]"
                >
                  {l}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── STATS ──────────────────────────────────────────── */}
        <section className="border-b border-[var(--line)]">
          <div className="mx-auto max-w-[1200px] px-6">
            <dl className="grid grid-cols-1 divide-y divide-[var(--line)] sm:grid-cols-2 sm:divide-y-0
              lg:grid-cols-4 lg:divide-x">
              {stats.map((s, i) => (
                <Reveal key={s.label} delay={i * 70}>
                  <div className="px-0 py-8 sm:px-7 lg:py-12">
                    <dt className="numeral text-[clamp(2.4rem,4.2vw,3.25rem)] text-[var(--fg)]">{s.value}</dt>
                    <dd className="mt-2">
                      <span className="block text-[14px] font-medium text-[var(--fg)]">{s.label}</span>
                      <span className="mt-1 block text-[13px] text-[var(--fg-subtle)]">{s.sub}</span>
                    </dd>
                  </div>
                </Reveal>
              ))}
            </dl>
          </div>
        </section>

        {/* ── CAPABILITIES ───────────────────────────────────── */}
        <section id="platform" className="scroll-mt-20 border-b border-[var(--line)] bg-[var(--surface)]">
          <div className="mx-auto max-w-[1200px] px-6 py-20 lg:py-28">
            <Reveal>
              <div className="max-w-[62ch]">
                <Eyebrow>The platform</Eyebrow>
                <h2 className="display mt-4 text-[clamp(2rem,4.4vw,3.1rem)]">
                  Four things a contract team does badly.
                  <br />
                  Bontraco does all four.
                </h2>
                <p className="mt-5 text-[16.5px] leading-[1.65] text-[var(--fg-muted)]">
                  Not a repository with search bolted on. Bontraco reads the language,
                  understands your position on it, and acts before the deadline does.
                </p>
              </div>
            </Reveal>

            <div className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-[var(--line)]
              bg-[var(--line)] md:grid-cols-2">
              {capabilities.map((c, i) => (
                <Reveal key={c.title} delay={i * 80}>
                  <div className="group h-full bg-[var(--surface)] p-7 transition-colors duration-300
                    hover:bg-[var(--surface-2)] lg:p-9">
                    <span className="inline-flex size-11 items-center justify-center rounded-lg
                      border border-brand-600/20 bg-brand-50 text-brand-700
                      transition-transform duration-300 group-hover:scale-105
                      dark:bg-brand-500/12 dark:text-brand-300">
                      <c.icon className="size-5" />
                    </span>
                    <h3 className="mt-5 text-[19px] font-semibold tracking-[-0.015em]">{c.title}</h3>
                    <p className="mt-3 text-[14.5px] leading-[1.65] text-[var(--fg-muted)]">{c.body}</p>
                    <p className="mt-5 border-t border-[var(--line)] pt-4 font-mono text-[11.5px]
                      tracking-tight text-[var(--fg-subtle)]">
                      {c.detail}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ───────────────────────────────────── */}
        <section id="how" className="scroll-mt-20 border-b border-[var(--line)]">
          <div className="mx-auto max-w-[1200px] px-6 py-20 lg:py-28">
            <div className="grid grid-cols-1 gap-14 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-20">
              <Reveal>
                <div className="lg:sticky lg:top-28">
                  <Eyebrow>How it works</Eyebrow>
                  <h2 className="display mt-4 text-[clamp(2rem,4.4vw,3.1rem)]">
                    Live in a fortnight.
                    <br />
                    Useful on day one.
                  </h2>
                  <p className="mt-5 max-w-[46ch] text-[16.5px] leading-[1.65] text-[var(--fg-muted)]">
                    There is no taxonomy workshop and no eighteen-month data-migration
                    project. Bontraco starts from the contracts you already have.
                  </p>
                  <div className="mt-8">
                    <Link href="/dashboard">
                      <Button variant="outline" className="group">
                        Explore a live workspace
                        <ArrowUpRight className="size-4 transition-transform duration-200
                          group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Reveal>

              <ol className="relative">
                <span
                  aria-hidden
                  className="absolute left-[27px] top-3 bottom-3 w-px bg-[var(--line)]"
                />
                {steps.map((s, i) => (
                  <Reveal key={s.n} delay={i * 90}>
                    <li className="relative flex gap-6 pb-10 last:pb-0">
                      <span className="relative z-10 flex size-14 shrink-0 items-center justify-center
                        rounded-full border border-[var(--line-strong)] bg-[var(--surface)]
                        font-mono text-[13px] font-medium text-[var(--fg-muted)]">
                        {s.n}
                      </span>
                      <div className="pt-3">
                        <h3 className="text-[18px] font-semibold tracking-[-0.015em]">{s.title}</h3>
                        <p className="mt-2 max-w-[52ch] text-[14.5px] leading-[1.65] text-[var(--fg-muted)]">
                          {s.body}
                        </p>
                      </div>
                    </li>
                  </Reveal>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* ── QUOTE ──────────────────────────────────────────── */}
        <section className="border-b border-[var(--line)] bg-ink-900 text-white dark:bg-[var(--surface)]">
          <div className="mx-auto max-w-[1200px] px-6 py-20 lg:py-24">
            <Reveal>
              <figure className="mx-auto max-w-[68ch] text-center">
                <blockquote className="display text-[clamp(1.6rem,3.4vw,2.5rem)] text-white
                  dark:text-[var(--fg)]">
                  &ldquo;We stopped negotiating from memory. Bontraco showed us we had
                  accepted a 3× liability cap eleven times in two years — nobody
                  had ever put those eleven contracts side by side.&rdquo;
                </blockquote>
                <figcaption className="mt-8 flex items-center justify-center gap-3 text-[14px]">
                  <span className="inline-flex size-9 items-center justify-center rounded-full
                    bg-flag-500/20 text-[12px] font-semibold text-flag-400">
                    DW
                  </span>
                  <span className="text-left">
                    <span className="block font-medium text-white dark:text-[var(--fg)]">Dana Whitfield</span>
                    <span className="block text-ink-300 dark:text-[var(--fg-muted)]">
                      General Counsel, Harborview Group
                    </span>
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          </div>
        </section>

        {/* ── SECURITY ───────────────────────────────────────── */}
        <section id="security" className="scroll-mt-20 border-b border-[var(--line)] bg-[var(--surface)]">
          <div className="mx-auto max-w-[1200px] px-6 py-20 lg:py-28">
            <Reveal>
              <div className="max-w-[58ch]">
                <Eyebrow>Security &amp; trust</Eyebrow>
                <h2 className="display mt-4 text-[clamp(2rem,4.4vw,3.1rem)]">
                  Your contracts are the most sensitive documents you own.
                </h2>
                <p className="mt-5 text-[16.5px] leading-[1.65] text-[var(--fg-muted)]">
                  We built Bontraco for teams whose security review is the hardest
                  part of any purchase. Here is what ours answers.
                </p>
              </div>
            </Reveal>

            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {securityItems.map((s, i) => (
                <Reveal key={s.title} delay={i * 70}>
                  <div className="h-full rounded-xl border border-[var(--line)] bg-[var(--bg)] p-6">
                    <s.icon className="size-5 text-brand-700 dark:text-brand-400" />
                    <h3 className="mt-4 text-[15px] font-semibold">{s.title}</h3>
                    <p className="mt-2 text-[13.5px] leading-[1.6] text-[var(--fg-muted)]">{s.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRICING ────────────────────────────────────────── */}
        <section id="pricing" className="scroll-mt-20 border-b border-[var(--line)]">
          <div className="mx-auto max-w-[1200px] px-6 py-20 lg:py-28">
            <Reveal>
              <div className="mx-auto max-w-[54ch] text-center">
                <Eyebrow>Pricing</Eyebrow>
                <h2 className="display mt-4 text-[clamp(2rem,4.4vw,3.1rem)]">
                  Priced against the contract, not the seat.
                </h2>
                <p className="mt-5 text-[16.5px] leading-[1.65] text-[var(--fg-muted)]">
                  Everyone who touches a contract should be able to open it. Charging
                  per user just means fewer people check.
                </p>
              </div>
            </Reveal>

            <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3">
              {plans.map((p, i) => (
                <Reveal key={p.name} delay={i * 80}>
                  <div
                    className={`relative flex h-full flex-col rounded-xl border p-7 lg:p-8
                      ${p.highlight
                        ? "border-brand-600/40 bg-[var(--surface)] shadow-[var(--shadow-lg)] lg:-mt-4 lg:mb-4"
                        : "border-[var(--line)] bg-[var(--surface)]"}`}
                  >
                    {p.highlight && (
                      <span className="absolute -top-3 left-7">
                        <Badge tone="accent" className="shadow-[var(--shadow-sm)]">Most chosen</Badge>
                      </span>
                    )}
                    <h3 className="text-[15px] font-semibold">{p.name}</h3>
                    <p className="mt-1.5 min-h-[42px] text-[13.5px] leading-[1.55] text-[var(--fg-muted)]">
                      {p.for}
                    </p>
                    <div className="mt-6 flex items-baseline gap-2">
                      <span className="numeral text-[46px] text-[var(--fg)]">{p.price}</span>
                      <span className="text-[13px] text-[var(--fg-subtle)]">{p.cadence}</span>
                    </div>
                    <ul className="mt-7 flex-1 space-y-3">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-[13.5px] leading-snug">
                          <Check className="mt-0.5 size-4 shrink-0 text-brand-600 dark:text-brand-400" />
                          <span className="text-[var(--fg-muted)]">{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href="/dashboard" className="mt-8 block">
                      <Button
                        variant={p.highlight ? "primary" : "outline"}
                        className="w-full"
                      >
                        {p.cta}
                      </Button>
                    </Link>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ────────────────────────────────────────────── */}
        <section className="border-b border-[var(--line)] bg-[var(--surface)]">
          <div className="mx-auto max-w-[1200px] px-6 py-20 lg:py-24">
            <Reveal>
              <div className="relative overflow-hidden rounded-2xl bg-ink-900 px-8 py-14 text-center lg:px-16 lg:py-20">
                <div
                  aria-hidden
                  className="hairline-grid pointer-events-none absolute inset-0 opacity-[0.06]"
                />
                <div className="relative">
                  <Layers className="mx-auto size-7 text-flag-400" />
                  <h2 className="display mx-auto mt-6 max-w-[22ch] text-[clamp(2rem,4.4vw,3.2rem)] text-white">
                    See Bontraco read one of your contracts.
                  </h2>
                  <p className="mx-auto mt-5 max-w-[52ch] text-[16px] leading-[1.65] text-ink-300">
                    Send us a redacted agreement. We will return the clause report,
                    the deviation scores, and the drafted redline within one business day —
                    before you talk to anyone in sales.
                  </p>
                  <div className="mt-9 flex flex-wrap justify-center gap-3">
                    <Link href="/dashboard">
                      <Button size="lg" className="group">
                        Open the dashboard
                        <ArrowRight className="size-4 transition-transform duration-200
                          group-hover:translate-x-0.5" />
                      </Button>
                    </Link>
                    <a href="mailto:hello@bontraco.com">
                      <Button
                        size="lg"
                        variant="outline"
                        className="border-ink-600 bg-transparent text-white hover:bg-ink-800 hover:border-ink-500"
                      >
                        Talk to us
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer className="bg-[var(--bg)]">
        <div className="mx-auto max-w-[1200px] px-6 py-14">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
            <div>
              <Logo />
              <p className="mt-4 max-w-[34ch] text-[13.5px] leading-[1.6] text-[var(--fg-muted)]">
                Contract intelligence for teams who sign things that matter.
              </p>
            </div>
            {[
              { h: "Product", items: ["Platform", "Clause library", "Obligations", "Integrations", "Changelog"] },
              { h: "Company", items: ["About", "Customers", "Careers", "Press", "Contact"] },
              { h: "Legal", items: ["Privacy", "Terms", "DPA", "Sub-processors", "Trust centre"] },
            ].map((col) => (
              <div key={col.h}>
                <h3 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--fg-subtle)]">
                  {col.h}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {col.items.map((it) => (
                    <li key={it}>
                      <a
                        href="#"
                        className="inline-block cursor-pointer py-1 text-[13.5px]
                          text-[var(--fg-muted)] transition-colors duration-200
                          hover:text-[var(--fg)]"
                      >
                        {it}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-col gap-3 border-t border-[var(--line)] pt-6
            sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[12.5px] text-[var(--fg-subtle)]">
              © 2026 Bontraco, Inc. All rights reserved.
            </p>
            <p className="text-[12.5px] text-[var(--fg-subtle)]">
              Demonstration environment. All contracts, counterparties and figures are fictional.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
