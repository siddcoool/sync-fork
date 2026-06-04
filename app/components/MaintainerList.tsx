"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "lucide-react";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ConfirmDeleteDialog from "@/app/components/ConfirmDeleteDialog";
import EmptyState from "@/app/components/EmptyState";

import type { MaintainerItem } from "@/lib/maintainers";

export default function MaintainerList({
  maintainers,
}: {
  maintainers: MaintainerItem[];
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleDelete(id: string) {
    setBusyId(id);
    setError("");
    try {
      const res = await fetch(`/api/maintainers/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to remove maintainer.");
        return;
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  if (maintainers.length === 0) {
    return (
      <EmptyState>
        <p className="text-sm">
          No maintainers yet. Add one to store a reusable PAT and commit identity.
        </p>
      </EmptyState>
    );
  }

  return (
    <>
      {error ? (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <ul className="flex flex-col gap-3">
        {maintainers.map((m) => (
          <li key={m.id}>
            <Card className="transition-shadow hover:ring-primary/20 hover:shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <CardTitle className="truncate">{m.label}</CardTitle>
                    <CardDescription className="truncate">
                      commits as: {m.authorName} &lt;{m.authorEmail}&gt;
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardFooter className="border-t-0 bg-transparent pt-0">
                <ConfirmDeleteDialog
                  title="Remove maintainer?"
                  description="Their PAT will be deleted. Remove all forks using this maintainer first."
                  triggerLabel="Remove"
                  busy={busyId === m.id}
                  disabled={busyId === m.id}
                  onConfirm={() => handleDelete(m.id)}
                />
              </CardFooter>
            </Card>
          </li>
        ))}
      </ul>
    </>
  );
}
