import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongo";
import { Repo } from "@/models/repo";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }

  await connectToDatabase();
  const deleted = await Repo.findByIdAndDelete(id);

  if (!deleted) {
    return NextResponse.json({ error: "Fork not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
