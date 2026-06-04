"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AddForkPage() {
  const router = useRouter();
  const [forkUrl, setForkUrl] = useState("");
  const [pat, setPat] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/repos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forkUrl, pat, authorName, authorEmail }),
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
          The PAT is encrypted at rest and never shown again. It needs the
          <span className="font-medium"> Contents: Read and write </span>
          permission on the fork.
        </p>

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
            <label className={labelClass}>Fine-grained PAT</label>
            <input
              type="password"
              className={inputClass}
              value={pat}
              onChange={(e) => setPat(e.target.value)}
              placeholder="github_pat_..."
            />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Commit author name</label>
              <input
                className={inputClass}
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Jane Doe"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Commit author email</label>
              <input
                type="email"
                className={inputClass}
                value={authorEmail}
                onChange={(e) => setAuthorEmail(e.target.value)}
                placeholder="jane@example.com"
              />
            </div>
          </div>

          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="self-start rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {loading ? "Validating with GitHub..." : "Register fork"}
          </button>
        </form>
      </div>
    </div>
  );
}
