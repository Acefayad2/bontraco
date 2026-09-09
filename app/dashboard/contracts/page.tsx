import { Upload, Download } from "lucide-react";
import { PageHeader } from "@/components/dash/page-header";
import { ContractsTable } from "@/components/dash/contracts-table";
import { Button } from "@/components/ui/primitives";
import { contracts, portfolioValue, money } from "@/lib/data";

export const metadata = { title: "Contracts" };

export default function ContractsPage() {
  return (
    <>
      <PageHeader
        title="Contracts"
        description={`${contracts.length} agreements under management, ${money(portfolioValue, true)} total contract value. Every one has been read and scored against Vendor Playbook v4.`}
        actions={
          <>
            <Button variant="outline" size="sm"><Download className="size-3.5" />Export</Button>
            <Button size="sm"><Upload className="size-3.5" />Upload contract</Button>
          </>
        }
      />
      <ContractsTable contracts={contracts} />
    </>
  );
}
