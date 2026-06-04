import Link from "next/link";
import { connectToDatabase } from "@/lib/mongo";
import { Maintainer } from "@/models/maintainer";
import MaintainerList, { MaintainerItem } from "@/app/components/MaintainerList";

export const dynamic = "force-dynamic";

async function getMaintainers(): Promise<MaintainerItem[]> {
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

export default async function MaintainersPage() {
  const maintainers = await getMaintainers();

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 p-4 dark:bg-black">
      <div className="w-full max-w-2xl py-12">
        <Link
          href="/"
          className="text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          &larr; Back
        </Link>
        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Maintainers
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Reusable PAT + commit identity. Link any number of forks to one maintainer.
            </p>
          </div>
          <Link
            href="/maintainers/add"
            className="shrink-0 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            + Add
          </Link>
        </div>

        <div className="mt-8">
          <MaintainerList maintainers={maintainers} />
        </div>
      </div>
    </div>
  );
}
