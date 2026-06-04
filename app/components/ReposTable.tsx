"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  Search,
} from "lucide-react";
import type { ForkItem } from "@/lib/repos";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ConfirmDeleteDialog from "@/app/components/ConfirmDeleteDialog";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

function formatDate(iso: string | null): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function syncStatusBadge(status: ForkItem["lastSyncStatus"]) {
  switch (status) {
    case "success":
      return { variant: "default" as const, label: "success" };
    case "error":
      return { variant: "destructive" as const, label: "error" };
    case "conflict":
      return {
        variant: "outline" as const,
        label: "conflict",
        className:
          "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400",
      };
    default:
      return { variant: "secondary" as const, label: "never" };
  }
}

function matchesSearch(fork: ForkItem, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  const haystack = [
    fork.owner,
    fork.repo,
    `${fork.owner}/${fork.repo}`,
    fork.upstreamOwner,
    fork.upstreamRepo,
    `${fork.upstreamOwner}/${fork.upstreamRepo}`,
    fork.maintainerLabel,
    fork.defaultBranch,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

function RepoRow({
  fork,
  onRefresh,
}: {
  fork: ForkItem;
  onRefresh: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const status = syncStatusBadge(fork.lastSyncStatus);

  async function handleSync() {
    setBusy(true);
    try {
      await fetch(`/api/repos/${fork.id}/sync`, { method: "POST" });
      onRefresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    try {
      const res = await fetch(`/api/repos/${fork.id}`, { method: "DELETE" });
      if (res.ok) onRefresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <TableRow>
      <TableCell className="font-medium">
        <a
          href={`https://github.com/${fork.owner}/${fork.repo}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 hover:underline"
        >
          {fork.owner}/{fork.repo}
          <ExternalLink className="size-3 text-muted-foreground" />
        </a>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {fork.upstreamOwner}/{fork.upstreamRepo}
      </TableCell>
      <TableCell>{fork.defaultBranch}</TableCell>
      <TableCell className="max-w-[140px] truncate" title={fork.maintainerLabel}>
        {fork.maintainerLabel}
      </TableCell>
      <TableCell>
        <Badge variant={status.variant} className={cn(status.className)}>
          {status.label}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {formatDate(fork.lastSyncedAt)}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button size="sm" onClick={handleSync} disabled={busy}>
            {busy ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              "Sync"
            )}
          </Button>
          <ConfirmDeleteDialog
            title="Remove fork?"
            description="This fork registration will be deleted. You can register it again later."
            triggerLabel="Remove"
            busy={busy}
            disabled={busy}
            onConfirm={handleDelete}
          />
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function ReposTable({ forks }: { forks: ForkItem[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const urlPage = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);

  const [searchInput, setSearchInput] = useState(urlQuery);

  const filtered = useMemo(
    () => forks.filter((f) => matchesSearch(f, urlQuery)),
    [forks, urlQuery],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(urlPage, totalPages);
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, filtered.length);

  const pushParams = useCallback(
    (q: string, page: number) => {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (page > 1) params.set("page", String(page));
      const qs = params.toString();
      router.push(qs ? `/?${qs}` : "/");
    },
    [router],
  );

  useEffect(() => {
    setSearchInput(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    if (urlPage > totalPages && filtered.length > 0) {
      pushParams(urlQuery, totalPages);
    }
  }, [urlPage, totalPages, filtered.length, urlQuery, pushParams]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    pushParams(searchInput, 1);
  }

  function handleRefresh() {
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by repo, upstream, or maintainer..."
            className="pl-8"
          />
        </div>
        <Button type="submit" variant="secondary">
          Search
        </Button>
        {urlQuery ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setSearchInput("");
              pushParams("", 1);
            }}
          >
            Clear
          </Button>
        ) : null}
      </form>

      <div className="rounded-xl ring-1 ring-foreground/10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Repository</TableHead>
              <TableHead>Upstream</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Maintainer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last synced</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground"
                >
                  {urlQuery
                    ? "No repositories match your search."
                    : "No repositories registered."}
                </TableCell>
              </TableRow>
            ) : (
              pageItems.map((fork) => (
                <RepoRow key={fork.id} fork={fork} onRefresh={handleRefresh} />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {filtered.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Showing {rangeStart}–{rangeEnd} of {filtered.length}
            {urlQuery ? ` (filtered from ${forks.length})` : ""}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => pushParams(urlQuery, currentPage - 1)}
            >
              <ChevronLeft data-icon="inline-start" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => pushParams(urlQuery, currentPage + 1)}
            >
              Next
              <ChevronRight data-icon="inline-end" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
