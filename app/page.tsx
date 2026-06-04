import Link from "next/link";
import { connectToDatabase } from "@/lib/mongo";
import { Repo } from "@/models/repo";
import ForkList, { ForkItem } from "@/app/components/ForkList";
import LogoutButton from "@/app/components/LogoutButton";

export const dynamic = "force-dynamic";

async function getForks(): Promise<ForkItem[]> {
  await connectToDatabase();
  const repos = await Repo.find().sort({ createdAt: -1 }).lean();
  return repos.map((r) => ({
    id: String(r._id),
    owner: r.owner,
    repo: r.repo,
    defaultBranch: r.defaultBranch,
    upstreamOwner: r.upstreamOwner,
    upstreamRepo: r.upstreamRepo,
    authorName: r.authorName,
    authorEmail: r.authorEmail,
    lastSyncedAt: r.lastSyncedAt ? new Date(r.lastSyncedAt).toISOString() : null,
    lastSyncStatus: r.lastSyncStatus,
    lastSyncMessage: r.lastSyncMessage,
    lastCommitUrl: r.lastCommitUrl,
  }));
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

        <div className="my-6 flex justify-end">
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
