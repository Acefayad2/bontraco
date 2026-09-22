import { redirect } from "next/navigation";
import { Shell } from "@/components/dash/shell";
import { getSession } from "@/lib/server/auth";
import { listContracts, listObligations, orgStats, getDefaultPlaybook } from "@/lib/server/repo";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const stats = orgStats(session.orgId);
  const playbook = getDefaultPlaybook(session.orgId);
  const overdue = listObligations(session.orgId).filter((o) => o.status === "overdue").length;

  return (
    <Shell
      contracts={listContracts(session.orgId)}
      user={{
        name: session.name,
        initials: session.initials,
        email: session.email,
        openFindings: stats.open_findings,
        overdueObligations: overdue,
        playbookName: playbook?.name ?? "No playbook",
        playbookVersion: playbook?.version ?? 0,
      }}
    >
      {children}
    </Shell>
  );
}
