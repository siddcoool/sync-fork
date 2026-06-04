import Link from "next/link";
import { Suspense } from "react";
import { GitFork, Plus } from "lucide-react";
import { getForks } from "@/lib/repos";
import ReposTable from "@/app/components/ReposTable";
import EmptyState from "@/app/components/EmptyState";
import PageShell from "@/app/components/PageShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function TableSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-full max-w-md" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

export default async function Home() {
  const forks = await getForks();

  return (
    <PageShell wide>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <GitFork className="size-5" />
          </span>
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Repositories
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {forks.length} registered fork{forks.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <Button size="sm" asChild>
          <Link href="/add">
            <Plus data-icon="inline-start" />
            Add fork
          </Link>
        </Button>
      </div>

      {forks.length === 0 ? (
        <EmptyState>
          <p className="text-sm">
            No forks registered yet. Add a maintainer, then register a fork.
          </p>
          <Button className="mt-4" size="sm" asChild>
            <Link href="/add">
              <Plus data-icon="inline-start" />
              Add fork
            </Link>
          </Button>
        </EmptyState>
      ) : (
        <Suspense fallback={<TableSkeleton />}>
          <ReposTable forks={forks} />
        </Suspense>
      )}
    </PageShell>
  );
}
