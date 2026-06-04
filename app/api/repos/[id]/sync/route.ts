import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongo";
import { Repo } from "@/models/repo";
import { Maintainer } from "@/models/maintainer";
import { decrypt } from "@/lib/crypto";
import {
  createOctokit,
  mergeUpstream,
  upsertSyncforkFile,
} from "@/lib/github";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }

  await connectToDatabase();

  const repo = await Repo.findById(id);
  if (!repo) {
    return NextResponse.json({ error: "Fork not found." }, { status: 404 });
  }

  const maintainer = await Maintainer.findById(repo.maintainerId).select(
    "+patEncrypted",
  );
  if (!maintainer) {
    return NextResponse.json(
      { error: "Maintainer not found for this fork." },
      { status: 404 },
    );
  }

  let pat: string;
  try {
    pat = decrypt(maintainer.patEncrypted);
  } catch {
    return NextResponse.json(
      { error: "Failed to decrypt the maintainer PAT." },
      { status: 500 },
    );
  }

  const octokit = createOctokit(pat);

  try {
    const merge = await mergeUpstream(
      octokit,
      repo.owner,
      repo.repo,
      repo.defaultBranch,
    );

    const commit = await upsertSyncforkFile(octokit, {
      owner: repo.owner,
      repo: repo.repo,
      defaultBranch: repo.defaultBranch,
      upstreamOwner: repo.upstreamOwner,
      upstreamRepo: repo.upstreamRepo,
      authorName: maintainer.authorName,
      authorEmail: maintainer.authorEmail,
    });

    repo.lastSyncedAt = new Date();
    repo.lastSyncStatus = "success";
    repo.lastSyncMessage = merge.message;
    repo.lastCommitUrl = commit.commitUrl;
    await repo.save();

    return NextResponse.json({
      ok: true,
      mergeType: merge.mergeType,
      message: merge.message,
      commitUrl: commit.commitUrl,
    });
  } catch (err: unknown) {
    const isConflict = (err as { isConflict?: boolean })?.isConflict === true;
    const message =
      err instanceof Error ? err.message : "Sync failed unexpectedly.";

    repo.lastSyncedAt = new Date();
    repo.lastSyncStatus = isConflict ? "conflict" : "error";
    repo.lastSyncMessage = message;
    await repo.save();

    return NextResponse.json(
      { error: message },
      { status: isConflict ? 409 : 502 },
    );
  }
}
