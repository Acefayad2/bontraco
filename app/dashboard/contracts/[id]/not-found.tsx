import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/primitives";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-32 text-center">
      <span className="inline-flex size-12 items-center justify-center rounded-full
        bg-[var(--surface-2)] text-[var(--fg-subtle)]">
        <FileQuestion className="size-6" />
      </span>
      <h1 className="mt-5 text-[20px] font-semibold">Contract not found</h1>
      <p className="mt-2 max-w-[46ch] text-[14px] text-[var(--fg-muted)]">
        That reference does not match anything in this workspace. It may have been
        archived, or the link may be stale.
      </p>
      <Link href="/dashboard/contracts" className="mt-6">
        <Button>Back to contracts</Button>
      </Link>
    </div>
  );
}
