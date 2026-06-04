"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface MaintainerOption {
  id: string;
  label: string;
  authorName: string;
  authorEmail: string;
}

export default function AddForkPage() {
  const router = useRouter();
  const [forkUrl, setForkUrl] = useState("");
  const [maintainerId, setMaintainerId] = useState("");
  const [maintainers, setMaintainers] = useState<MaintainerOption[]>([]);
  const [loadingMaintainers, setLoadingMaintainers] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/maintainers");
        const data = await res.json().catch(() => ({}));
        if (!cancelled && res.ok) {
          const list = (data.maintainers ?? []).map(
            (m: {
              _id: string;
              label: string;
              authorName: string;
              authorEmail: string;
            }) => ({
              id: String(m._id),
              label: m.label,
              authorName: m.authorName,
              authorEmail: m.authorEmail,
            }),
          );
          setMaintainers(list);
          if (list.length === 1) setMaintainerId(list[0].id);
        }
      } finally {
        if (!cancelled) setLoadingMaintainers(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/repos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forkUrl, maintainerId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to register fork.");
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";
  const labelClass =
    "text-sm font-medium text-zinc-700 dark:text-zinc-300";

  const selected = maintainers.find((m) => m.id === maintainerId);

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 p-4 dark:bg-black">
      <div className="w-full max-w-xl py-12">
        <Link
          href="/"
          className="text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          &larr; Back
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Register a fork
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Pick a maintainer whose PAT has{" "}
          <span className="font-medium">Contents: Read and write</span> on this fork.
          The same maintainer can be used for multiple forks.
        </p>

        {loadingMaintainers ? (
          <p className="mt-8 text-sm text-zinc-500">Loading maintainers...</p>
        ) : maintainers.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Add a maintainer (PAT + commit identity) before registering a fork.
            </p>
            <Link
              href="/maintainers/add"
              className="mt-4 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
            >
              Add maintainer
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Fork URL</label>
              <input
                className={inputClass}
                value={forkUrl}
                onChange={(e) => setForkUrl(e.target.value)}
                placeholder="https://github.com/owner/repo"
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Maintainer</label>
              <select
                className={inputClass}
                value={maintainerId}
                onChange={(e) => setMaintainerId(e.target.value)}
                required
              >
                <option value="">Select maintainer...</option>
                {maintainers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label} ({m.authorName})
                  </option>
                ))}
              </select>
              {selected ? (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Commits as {selected.authorName} &lt;{selected.authorEmail}&gt;
                </p>
              ) : null}
              <Link
                href="/maintainers/add"
                className="text-xs text-zinc-500 underline hover:text-zinc-800 dark:hover:text-zinc-200"
              >
                + Add another maintainer
              </Link>
            </div>

            {error ? (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            ) : null}

            <button
              type="submit"
              disabled={loading || !maintainerId}
              className="self-start rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {loading ? "Validating with GitHub..." : "Register fork"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
