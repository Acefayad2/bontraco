import {
  Building2, Check, KeyRound, Plug, ShieldCheck, Users, Scale,
} from "lucide-react";
import { PageHeader } from "@/components/dash/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardBody, Button, Badge, Avatar, Meter } from "@/components/ui/primitives";

export const metadata = { title: "Settings" };

const playbooks = [
  { name: "Vendor Playbook", version: "v4", positions: 34, trained: "6 days ago", coverage: 92, active: true },
  { name: "Customer Paper", version: "v2", positions: 21, trained: "3 weeks ago", coverage: 78, active: true },
  { name: "Employment Standard", version: "v1", positions: 12, trained: "2 months ago", coverage: 64, active: false },
];

const integrations = [
  { name: "SharePoint", note: "4,182 documents indexed", status: "Connected" },
  { name: "DocuSign", note: "Envelope status sync", status: "Connected" },
  { name: "Salesforce", note: "Opportunity → contract linkage", status: "Connected" },
  { name: "Slack", note: "Obligation and renewal alerts", status: "Connected" },
  { name: "Google Drive", note: "Not configured", status: "Available" },
  { name: "NetSuite", note: "Not configured", status: "Available" },
];

const team = [
  { name: "Priya Raman", initials: "PR", role: "Admin", dept: "Procurement" },
  { name: "Dana Whitfield", initials: "DW", role: "Legal approver", dept: "Legal" },
  { name: "Marcus Chen", initials: "MC", role: "Editor", dept: "IT & Engineering" },
  { name: "Sofia Alvarez", initials: "SA", role: "Editor", dept: "Sales & Marketing" },
  { name: "Elena Ruiz", initials: "ER", role: "Finance approver", dept: "Finance" },
];

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Workspace configuration — the playbooks Bontraco scores against, the systems it reads from, and who can act on what."
      />

      <div className="grid grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="size-4 text-[var(--fg-subtle)]" />
                  Playbooks
                </CardTitle>
                <CardDescription>
                  The positions Bontraco measures every contract against. Coverage is how much of
                  your signed history the playbook explains.
                </CardDescription>
              </div>
              <Button size="sm" variant="outline">New playbook</Button>
            </CardHeader>
            <ul className="divide-y divide-[var(--line)]">
              {playbooks.map((p) => (
                <li key={p.name} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-medium">{p.name}</span>
                      <Badge tone="neutral">{p.version}</Badge>
                      {p.active
                        ? <Badge tone="accent"><Check className="size-3" />Active</Badge>
                        : <Badge tone="neutral">Paused</Badge>}
                    </div>
                    <p className="mt-1 text-[12.5px] text-[var(--fg-muted)]">
                      {p.positions} positions · retrained {p.trained}
                    </p>
                  </div>
                  <div className="w-full shrink-0 sm:w-[160px]">
                    <div className="mb-1.5 flex items-baseline justify-between">
                      <span className="text-[10.5px] uppercase tracking-wider text-[var(--fg-subtle)]">
                        Coverage
                      </span>
                      <span className="tabular text-[12px] font-semibold">{p.coverage}%</span>
                    </div>
                    <Meter value={p.coverage} tone="accent" label={`${p.name} coverage`} />
                  </div>
                  <Button size="sm" variant="ghost">Edit</Button>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Plug className="size-4 text-[var(--fg-subtle)]" />
                  Integrations
                </CardTitle>
                <CardDescription>Where Bontraco reads contracts from and writes status back to</CardDescription>
              </div>
            </CardHeader>
            <ul className="grid grid-cols-1 gap-px bg-[var(--line)] sm:grid-cols-2">
              {integrations.map((i) => (
                <li key={i.name} className="flex items-center gap-3 bg-[var(--surface)] px-5 py-4">
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg
                    bg-[var(--surface-2)] font-semibold text-[12px] text-[var(--fg-muted)]">
                    {i.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-medium">{i.name}</p>
                    <p className="truncate text-[12px] text-[var(--fg-muted)]">{i.note}</p>
                  </div>
                  {i.status === "Connected"
                    ? <Badge tone="accent" dot>Connected</Badge>
                    : <Button size="sm" variant="outline">Connect</Button>}
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="size-4 text-[var(--fg-subtle)]" />
                  Team &amp; permissions
                </CardTitle>
                <CardDescription>Five members across four departments</CardDescription>
              </div>
              <Button size="sm" variant="outline">Invite</Button>
            </CardHeader>
            <ul className="divide-y divide-[var(--line)]">
              {team.map((t) => (
                <li key={t.name} className="flex items-center gap-3 px-5 py-3.5">
                  <Avatar initials={t.initials} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-medium">{t.name}</p>
                    <p className="text-[12px] text-[var(--fg-subtle)]">{t.dept}</p>
                  </div>
                  <Badge tone={t.role === "Admin" ? "accent" : "neutral"}>{t.role}</Badge>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Workspace</CardTitle></CardHeader>
            <CardBody className="space-y-3.5">
              {[
                { icon: Building2, k: "Organisation", v: "Harborview Group" },
                { icon: KeyRound, k: "Plan", v: "Business" },
                { icon: ShieldCheck, k: "Data residency", v: "US-East" },
              ].map((r) => (
                <div key={r.k} className="flex items-center gap-3">
                  <r.icon className="size-4 shrink-0 text-[var(--fg-subtle)]" />
                  <span className="text-[13px] text-[var(--fg-muted)]">{r.k}</span>
                  <span className="ml-auto text-[13px] font-medium">{r.v}</span>
                </div>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader><CardTitle>Security posture</CardTitle></CardHeader>
            <CardBody className="space-y-3">
              {[
                { k: "SSO enforced", on: true },
                { k: "SCIM provisioning", on: true },
                { k: "Audit log export", on: true },
                { k: "Customer-managed keys", on: false },
                { k: "IP allowlist", on: false },
              ].map((s) => (
                <div key={s.k} className="flex items-center justify-between gap-3">
                  <span className="text-[13px]">{s.k}</span>
                  <span
                    role="switch"
                    aria-checked={s.on}
                    aria-label={s.k}
                    tabIndex={0}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center
                      rounded-full transition-colors duration-200 ${
                        s.on ? "bg-[var(--accent)]" : "bg-[var(--line-strong)]"}`}
                  >
                    <span className={`inline-block size-3.5 rounded-full bg-white shadow-sm
                      transition-transform duration-200 ${s.on ? "translate-x-[19px]" : "translate-x-[3px]"}`} />
                  </span>
                </div>
              ))}
            </CardBody>
            <CardBody className="border-t border-[var(--line)] bg-[var(--surface-2)]">
              <p className="text-[12.5px] leading-snug text-[var(--fg-muted)]">
                Customer-managed keys are available on your plan but not yet enabled.
                Turning them on requires a key from your KMS.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
