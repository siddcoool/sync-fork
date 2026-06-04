import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongo";
import { Repo } from "@/models/repo";
import { encrypt } from "@/lib/crypto";
import {
  createOctokit,
  getRepoMeta,
  parseForkUrl,
} from "@/lib/github";

const createSchema = z.object({
  forkUrl: z.string().min(1, "Fork URL is required."),
  pat: z.string().min(1, "A fine-grained PAT is required."),
  authorName: z.string().min(1, "Author name is required."),
  authorEmail: z.string().email("A valid author email is required."),
});

export async function GET() {
  await connectToDatabase();
  const repos = await Repo.find().sort({ createdAt: -1 }).lean();
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

  const { forkUrl, pat, authorName, authorEmail } = parsed.data;

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

  // Validate the PAT and the repo via GitHub before storing anything.
  let meta;
  try {
    const octokit = createOctokit(pat);
    meta = await getRepoMeta(octokit, owner, repo);
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status;
    if (status === 401) {
      return NextResponse.json(
        { error: "The PAT is invalid or expired." },
        { status: 400 },
      );
    }
    if (status === 404) {
      return NextResponse.json(
        { error: "Repository not found, or the PAT cannot access it." },
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

  await connectToDatabase();

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
    patEncrypted: encrypt(pat),
    authorName,
    authorEmail,
  });

  return NextResponse.json({ id: String(created._id) }, { status: 201 });
}
