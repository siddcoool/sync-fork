import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongo";
import { Maintainer } from "@/models/maintainer";
import { encrypt } from "@/lib/crypto";
import { createOctokit } from "@/lib/github";

const createSchema = z.object({
  label: z.string().min(1, "A label is required."),
  pat: z.string().min(1, "A fine-grained PAT is required."),
  authorName: z.string().min(1, "Author name is required."),
  authorEmail: z.string().email("A valid author email is required."),
});

export async function GET() {
  await connectToDatabase();
  const maintainers = await Maintainer.find()
    .sort({ createdAt: -1 })
    .select("-patEncrypted")
    .lean();
  return NextResponse.json({ maintainers });
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

  const { label, pat, authorName, authorEmail } = parsed.data;

  try {
    const octokit = createOctokit(pat);
    await octokit.rest.users.getAuthenticated();
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status;
    if (status === 401) {
      return NextResponse.json(
        { error: "The PAT is invalid or expired." },
        { status: 400 },
      );
    }
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to validate the PAT with GitHub.",
      },
      { status: 400 },
    );
  }

  await connectToDatabase();

  const created = await Maintainer.create({
    label,
    authorName,
    authorEmail,
    patEncrypted: encrypt(pat),
  });

  return NextResponse.json({ id: String(created._id) }, { status: 201 });
}
