import { Download } from "lucide-react";
import { PageHeader } from "@/components/dash/page-header";
import { ContractsTable } from "@/components/dash/contracts-table";
import { Button } from "@/components/ui/primitives";
import { money } from "@/lib/data";
import { requireSession } from "@/lib/server/auth";
import { listContracts } from "@/lib/server/repo";
import { UploadContract } from "@/components/dash/upload-contract";

export const metadata = { title: "Contracts" };
export const dynamic = "force-dynamic";

export default async function ContractsPage() {
  const session = await requireSession();
  const contracts = await listContracts(session.orgId);
  const portfolioValue = contracts.reduce((n, c) => n + c.value, 0);

  return (
    <>
      <PageHeader
        title="Contracts"
        description={`${contracts.length} agreements under management, ${money(portfolioValue, true)} total contract value. Every one has been read and scored against Vendor Playbook v4.`}
        actions={
          <>
            <Button variant="outline" size="sm"><Download className="size-3.5" />Export</Button>
            <UploadContract />
          </>
        }
      />
      <ContractsTable contracts={contracts} />
    </>
  );
}
