import Link from "next/link";
import { Plus } from "lucide-react";
import { getMaintainers } from "@/lib/maintainers";
import MaintainerList from "@/app/components/MaintainerList";
import PageShell from "@/app/components/PageShell";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function MaintainersPage() {
  const maintainers = await getMaintainers();

  return (
    <PageShell>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Maintainers
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Reusable PAT + commit identity. Link any number of forks to one maintainer.
          </p>
        </div>
        <Button size="sm" asChild>
          <Link href="/maintainers/add">
            <Plus data-icon="inline-start" />
            Add
          </Link>
        </Button>
      </div>

      <div className="mt-8">
        <MaintainerList maintainers={maintainers} />
      </div>
    </PageShell>
  );
}
