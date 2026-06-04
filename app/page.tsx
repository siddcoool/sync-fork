import Link from "next/link";
import { connectToDatabase } from "@/lib/mongo";
import { Repo } from "@/models/repo";
import ForkList, { ForkItem } from "@/app/components/ForkList";
import LogoutButton from "@/app/components/LogoutButton";

export const dynamic = "force-dynamic";

type PopulatedMaintainer = {
  _id: unknown;
  label: string;
  authorName: string;
  authorEmail: string;
};

async function getForks(): Promise<ForkItem[]> {
  await connectToDatabase();
  const repos = await Repo.find()
    .populate("maintainerId", "label authorName authorEmail")
    .sort({ createdAt: -1 })
    .lean();

  return repos.map((r) => {
    const m = r.maintainerId as unknown as PopulatedMaintainer | null;
    return {
      id: String(r._id),
      owner: r.owner,
      repo: r.repo,
      defaultBranch: r.defaultBranch,
      upstreamOwner: r.upstreamOwner,
      upstreamRepo: r.upstreamRepo,
      maintainerLabel: m?.label ?? "Unknown",
      authorName: m?.authorName ?? "",
      authorEmail: m?.authorEmail ?? "",
      lastSyncedAt: r.lastSyncedAt ? new Date(r.lastSyncedAt).toISOString() : null,
      lastSyncStatus: r.lastSyncStatus,
      lastSyncMessage: r.lastSyncMessage,
      lastCommitUrl: r.lastCommitUrl,
    };
  });
}

export default async function Home() {
  const forks = await getForks();

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 p-4 dark:bg-black">
      <div className="w-full max-w-2xl py-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Sync Fork
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Sync any registered fork from its upstream, on the owner&apos;s behalf.
            </p>
          </div>
          <LogoutButton />
        </div>

        <div className="my-6 flex flex-wrap justify-end gap-2">
          <Link
            href="/maintainers"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Maintainers
          </Link>
          <Link
            href="/add"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            + Add fork
          </Link>
        </div>

        <ForkList forks={forks} />
      </div>
    </div>
  );
}
