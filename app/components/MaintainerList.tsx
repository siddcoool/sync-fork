"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface MaintainerItem {
  id: string;
  label: string;
  authorName: string;
  authorEmail: string;
}

export default function MaintainerList({
  maintainers,
}: {
  maintainers: MaintainerItem[];
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleDelete(id: string) {
    if (
      !confirm(
        "Remove this maintainer? Their PAT will be deleted. Forks using them must be removed first.",
      )
    ) {
      return;
    }
    setBusyId(id);
    setError("");
    try {
      const res = await fetch(`/api/maintainers/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to remove maintainer.");
        return;
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  if (maintainers.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No maintainers yet. Add one to store a reusable PAT and commit identity.
        </p>
      </div>
    );
  }

  return (
    <>
      {error ? (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}
      <ul className="flex flex-col gap-3">
        {maintainers.map((m) => (
          <li
            key={m.id}
            className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <p className="font-medium text-zinc-900 dark:text-zinc-50">{m.label}</p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              commits as: {m.authorName} &lt;{m.authorEmail}&gt;
            </p>
            <button
              onClick={() => handleDelete(m.id)}
              disabled={busyId === m.id}
              className="mt-4 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              {busyId === m.id ? "Removing..." : "Remove"}
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
