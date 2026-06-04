import { Octokit } from "octokit";

export interface ParsedFork {
  owner: string;
  repo: string;
}

export interface RepoMeta {
  owner: string;
  repo: string;
  defaultBranch: string;
  isFork: boolean;
  upstreamOwner: string | null;
  upstreamRepo: string | null;
}

export interface MergeUpstreamResult {
  merged: boolean;
  mergeType: string;
  message: string;
}

export interface UpsertResult {
  commitSha: string;
  commitUrl: string;
}

const SYNCFORK_PATH = "syncfork.md";

/**
 * Parses a GitHub fork URL (or owner/repo string) into its owner and repo.
 * Accepts forms like:
 *   https://github.com/owner/repo
 *   https://github.com/owner/repo.git
 *   git@github.com:owner/repo.git
 *   owner/repo
 */
export function parseForkUrl(input: string): ParsedFork {
  const trimmed = input.trim();

  // owner/repo shorthand
  const shorthand = /^([\w.-]+)\/([\w.-]+?)(?:\.git)?$/;
  if (!trimmed.includes("github.com") && shorthand.test(trimmed)) {
    const [, owner, repo] = trimmed.match(shorthand)!;
    return { owner, repo };
  }

  // Normalize SSH form to a parseable path
  const normalized = trimmed.replace(/^git@github\.com:/, "https://github.com/");

  let pathname: string;
  try {
    pathname = new URL(normalized).pathname;
  } catch {
    throw new Error("Invalid fork URL. Expected a GitHub repository URL or owner/repo.");
  }

  const parts = pathname.split("/").filter(Boolean);
  if (parts.length < 2) {
    throw new Error("Invalid fork URL. Could not find owner and repository.");
  }

  const owner = parts[0];
  const repo = parts[1].replace(/\.git$/, "");
  return { owner, repo };
}

export function createOctokit(token: string): Octokit {
  return new Octokit({ auth: token });
}

/**
 * Fetches repository metadata: default branch, whether it's a fork, and its upstream parent.
 */
export async function getRepoMeta(
  octokit: Octokit,
  owner: string,
  repo: string,
): Promise<RepoMeta> {
  const { data } = await octokit.rest.repos.get({ owner, repo });
  return {
    owner: data.owner.login,
    repo: data.name,
    defaultBranch: data.default_branch,
    isFork: data.fork,
    upstreamOwner: data.parent?.owner?.login ?? null,
    upstreamRepo: data.parent?.name ?? null,
  };
}

/**
 * Syncs the fork's branch with its upstream repository.
 * Returns merge details, or throws with a friendly message on conflict.
 */
export async function mergeUpstream(
  octokit: Octokit,
  owner: string,
  repo: string,
  branch: string,
): Promise<MergeUpstreamResult> {
  try {
    const { data } = await octokit.rest.repos.mergeUpstream({
      owner,
      repo,
      branch,
    });
    return {
      merged: true,
      mergeType: data.merge_type ?? "unknown",
      message: data.message ?? "Synced with upstream.",
    };
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status;
    const message =
      (err as { message?: string })?.message ?? "Failed to sync with upstream.";
    if (status === 409) {
      const conflict = new Error(
        "Merge conflict with upstream. The fork could not be fast-forwarded automatically.",
      );
      (conflict as Error & { isConflict?: boolean }).isConflict = true;
      throw conflict;
    }
    throw new Error(message);
  }
}

function buildSyncforkContent(meta: {
  owner: string;
  repo: string;
  defaultBranch: string;
  upstreamOwner: string;
  upstreamRepo: string;
}): string {
  const now = new Date().toISOString();
  return [
    "# Sync Fork",
    "",
    "This file is maintained automatically by the Sync Fork app to keep the",
    "fork owner as the latest committer after each upstream sync.",
    "",
    `- Last synced: ${now}`,
    `- Synced from upstream: ${meta.upstreamOwner}/${meta.upstreamRepo}`,
    `- Fork: ${meta.owner}/${meta.repo}@${meta.defaultBranch}`,
    "",
  ].join("\n");
}

/**
 * Creates or updates syncfork.md as a commit authored by the fork owner,
 * ensuring the owner is always the latest committer.
 */
export async function upsertSyncforkFile(
  octokit: Octokit,
  params: {
    owner: string;
    repo: string;
    defaultBranch: string;
    upstreamOwner: string;
    upstreamRepo: string;
    authorName: string;
    authorEmail: string;
  },
): Promise<UpsertResult> {
  const { owner, repo, defaultBranch, authorName, authorEmail } = params;

  let sha: string | undefined;
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: SYNCFORK_PATH,
      ref: defaultBranch,
    });
    if (!Array.isArray(data) && data.type === "file") {
      sha = data.sha;
    }
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status;
    if (status !== 404) {
      throw err;
    }
    // 404 -> file does not exist yet, will be created.
  }

  const content = buildSyncforkContent(params);
  const author = { name: authorName, email: authorEmail };

  const { data } = await octokit.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: SYNCFORK_PATH,
    branch: defaultBranch,
    message: `chore: sync fork (${new Date().toISOString()})`,
    content: Buffer.from(content, "utf8").toString("base64"),
    sha,
    author,
    committer: author,
  });

  return {
    commitSha: data.commit.sha ?? "",
    commitUrl: data.commit.html_url ?? "",
  };
}
