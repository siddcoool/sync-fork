import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongo";
import { Maintainer, Repo } from "@/models";

export const runtime = "nodejs";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }

  await connectToDatabase();

  const inUse = await Repo.exists({ maintainerId: id });
  if (inUse) {
    return NextResponse.json(
      {
        error:
          "This maintainer is linked to one or more forks. Remove those forks first.",
      },
      { status: 409 },
    );
  }

  const deleted = await Maintainer.findByIdAndDelete(id);
  if (!deleted) {
    return NextResponse.json({ error: "Maintainer not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
