"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface ForkItem {
  id: string;
  owner: string;
  repo: string;
  defaultBranch: string;
  upstreamOwner: string;
  upstreamRepo: string;
  authorName: string;
  authorEmail: string;
  lastSyncedAt: string | null;
  lastSyncStatus: "never" | "success" | "error" | "conflict";
  lastSyncMessage: string;
  lastCommitUrl: string;
}

const statusStyles: Record<ForkItem["lastSyncStatus"], string> = {
  never: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  success: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  error: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  conflict: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

function formatDate(iso: string | null): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleString();
}

export default function ForkList({ forks }: { forks: ForkItem[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, string>>({});

  async function handleSync(id: string) {
    setBusyId(id);
    setFeedback((f) => ({ ...f, [id]: "" }));
    try {
      const res = await fetch(`/api/repos/${id}/sync`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFeedback((f) => ({ ...f, [id]: data.error ?? "Sync failed." }));
      } else {
        setFeedback((f) => ({
          ...f,
          [id]: `Synced (${data.mergeType ?? "ok"}).`,
        }));
      }
      router.refresh();
    } catch {
      setFeedback((f) => ({ ...f, [id]: "Network error." }));
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this fork? The stored PAT will be deleted.")) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/repos/${id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  if (forks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No forks registered yet. Add one to get started.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {forks.map((fork) => (
        <li
          key={fork.id}
          className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <a
                href={`https://github.com/${fork.owner}/${fork.repo}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-zinc-900 hover:underline dark:text-zinc-50"
              >
                {fork.owner}/{fork.repo}
              </a>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                upstream: {fork.upstreamOwner}/{fork.upstreamRepo} &middot; branch:{" "}
                {fork.defaultBranch}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                commits as: {fork.authorName} &lt;{fork.authorEmail}&gt;
              </p>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[fork.lastSyncStatus]}`}
            >
              {fork.lastSyncStatus}
            </span>
          </div>

          <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
            Last synced: {formatDate(fork.lastSyncedAt)}
            {fork.lastSyncMessage ? ` \u2014 ${fork.lastSyncMessage}` : ""}
            {fork.lastCommitUrl ? (
              <>
                {" "}
                &middot;{" "}
                <a
                  href={fork.lastCommitUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-700 underline dark:text-zinc-300"
                >
                  latest commit
                </a>
              </>
            ) : null}
          </div>

          {feedback[fork.id] ? (
            <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-300">
              {feedback[fork.id]}
            </p>
          ) : null}

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => handleSync(fork.id)}
              disabled={busyId === fork.id}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {busyId === fork.id ? "Syncing..." : "Sync now"}
            </button>
            <button
              onClick={() => handleDelete(fork.id)}
              disabled={busyId === fork.id}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Remove
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
