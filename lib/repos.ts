import { connectToDatabase } from "@/lib/mongo";
import { Repo } from "@/models/repo";

export type ForkItem = {
  id: string;
  owner: string;
  repo: string;
  defaultBranch: string;
  upstreamOwner: string;
  upstreamRepo: string;
  maintainerLabel: string;
  authorName: string;
  authorEmail: string;
  lastSyncedAt: string | null;
  lastSyncStatus: "never" | "success" | "error" | "conflict";
  lastSyncMessage: string;
  lastCommitUrl: string;
};

export type SidebarRepo = Pick<
  ForkItem,
  "id" | "owner" | "repo" | "lastSyncStatus"
>;

type PopulatedMaintainer = {
  _id: unknown;
  label: string;
  authorName: string;
  authorEmail: string;
};

export async function getForks(): Promise<ForkItem[]> {
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
      lastSyncedAt: r.lastSyncedAt
        ? new Date(r.lastSyncedAt).toISOString()
        : null,
      lastSyncStatus: r.lastSyncStatus,
      lastSyncMessage: r.lastSyncMessage,
      lastCommitUrl: r.lastCommitUrl,
    };
  });
}

const SIDEBAR_RECENT_LIMIT = 8;

export function toSidebarRepos(forks: ForkItem[]): SidebarRepo[] {
  return forks.map(({ id, owner, repo, lastSyncStatus }) => ({
    id,
    owner,
    repo,
    lastSyncStatus,
  }));
}

/** Most recently synced repos first; never-synced repos sink to the bottom. */
export function getRecentSidebarRepos(
  forks: ForkItem[],
  limit = SIDEBAR_RECENT_LIMIT,
): SidebarRepo[] {
  return [...forks]
    .sort((a, b) => {
      const aTime = a.lastSyncedAt ? new Date(a.lastSyncedAt).getTime() : null;
      const bTime = b.lastSyncedAt ? new Date(b.lastSyncedAt).getTime() : null;
      if (aTime === null && bTime === null) return 0;
      if (aTime === null) return 1;
      if (bTime === null) return -1;
      return bTime - aTime;
    })
    .slice(0, limit)
    .map(({ id, owner, repo, lastSyncStatus }) => ({
      id,
      owner,
      repo,
      lastSyncStatus,
    }));
}
