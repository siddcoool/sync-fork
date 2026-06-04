import { connectToDatabase } from "@/lib/mongo";
import { Maintainer } from "@/models/maintainer";

export type MaintainerItem = {
  id: string;
  label: string;
  authorName: string;
  authorEmail: string;
};

export async function getMaintainers(): Promise<MaintainerItem[]> {
  await connectToDatabase();
  const maintainers = await Maintainer.find()
    .sort({ createdAt: -1 })
    .select("-patEncrypted")
    .lean();
  return maintainers.map((m) => ({
    id: String(m._id),
    label: m.label,
    authorName: m.authorName,
    authorEmail: m.authorEmail,
  }));
}
