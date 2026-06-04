import { NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongo";
import { Repo } from "@/models/repo";
import { Maintainer } from "@/models/maintainer";
import { decrypt } from "@/lib/crypto";
import {
  createOctokit,
  getRepoMeta,
  parseForkUrl,
} from "@/lib/github";

const createSchema = z.object({
  forkUrl: z.string().min(1, "Fork URL is required."),
  maintainerId: z.string().min(1, "Select a maintainer."),
});

export async function GET() {
  await connectToDatabase();
  const repos = await Repo.find()
    .populate("maintainerId", "label authorName authorEmail")
    .sort({ createdAt: -1 })
    .lean();
  return NextResponse.json({ repos });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const { forkUrl, maintainerId } = parsed.data;

  if (!mongoose.Types.ObjectId.isValid(maintainerId)) {
    return NextResponse.json({ error: "Invalid maintainer." }, { status: 400 });
  }

  let owner: string;
  let repo: string;
  try {
    ({ owner, repo } = parseForkUrl(forkUrl));
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid fork URL." },
      { status: 400 },
    );
  }

  await connectToDatabase();

  const maintainer = await Maintainer.findById(maintainerId).select("+patEncrypted");
  if (!maintainer) {
    return NextResponse.json({ error: "Maintainer not found." }, { status: 404 });
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

  let meta;
  try {
    const octokit = createOctokit(pat);
    meta = await getRepoMeta(octokit, owner, repo);
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status;
    if (status === 401) {
      return NextResponse.json(
        { error: "The maintainer PAT is invalid or expired." },
        { status: 400 },
      );
    }
    if (status === 404) {
      return NextResponse.json(
        {
          error:
            "Repository not found, or the maintainer PAT cannot access it.",
        },
        { status: 400 },
      );
    }
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to validate the repository with GitHub.",
      },
      { status: 400 },
    );
  }

  if (!meta.isFork || !meta.upstreamOwner || !meta.upstreamRepo) {
    return NextResponse.json(
      { error: "This repository is not a fork (no upstream parent found)." },
      { status: 400 },
    );
  }

  const existing = await Repo.findOne({ owner: meta.owner, repo: meta.repo });
  if (existing) {
    return NextResponse.json(
      { error: "This fork is already registered." },
      { status: 409 },
    );
  }

  const created = await Repo.create({
    owner: meta.owner,
    repo: meta.repo,
    defaultBranch: meta.defaultBranch,
    upstreamOwner: meta.upstreamOwner,
    upstreamRepo: meta.upstreamRepo,
    maintainerId: maintainer._id,
  });

  return NextResponse.json({ id: String(created._id) }, { status: 201 });
}
