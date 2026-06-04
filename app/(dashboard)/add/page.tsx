"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import EmptyState from "@/app/components/EmptyState";
import PageShell from "@/app/components/PageShell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface MaintainerOption {
  id: string;
  label: string;
  authorName: string;
  authorEmail: string;
}

export default function AddForkPage() {
  const router = useRouter();
  const [forkUrl, setForkUrl] = useState("");
  const [maintainerId, setMaintainerId] = useState("");
  const [maintainers, setMaintainers] = useState<MaintainerOption[]>([]);
  const [loadingMaintainers, setLoadingMaintainers] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/maintainers");
        const data = await res.json().catch(() => ({}));
        if (!cancelled && res.ok) {
          const list = (data.maintainers ?? []).map(
            (m: {
              _id: string;
              label: string;
              authorName: string;
              authorEmail: string;
            }) => ({
              id: String(m._id),
              label: m.label,
              authorName: m.authorName,
              authorEmail: m.authorEmail,
            }),
          );
          setMaintainers(list);
          if (list.length === 1) setMaintainerId(list[0].id);
        }
      } finally {
        if (!cancelled) setLoadingMaintainers(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/repos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forkUrl, maintainerId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to register fork.");
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const selected = maintainers.find((m) => m.id === maintainerId);

  return (
    <PageShell narrow>
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Register a fork
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a maintainer whose PAT has{" "}
          <span className="font-medium text-foreground">Contents: Read and write</span>{" "}
          on this fork. The same maintainer can be used for multiple forks.
        </p>
      </div>

      {loadingMaintainers ? (
        <div className="mt-8 space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : maintainers.length === 0 ? (
        <div className="mt-8">
          <EmptyState>
            <p className="text-sm">
              Add a maintainer (PAT + commit identity) before registering a fork.
            </p>
            <Button className="mt-4" size="sm" asChild>
              <Link href="/maintainers/add">Add maintainer</Link>
            </Button>
          </EmptyState>
        </div>
      ) : (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Fork details</CardTitle>
            <CardDescription>
              We validate the fork URL and PAT access with GitHub on submit.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="forkUrl">Fork URL</Label>
                <Input
                  id="forkUrl"
                  value={forkUrl}
                  onChange={(e) => setForkUrl(e.target.value)}
                  placeholder="https://github.com/owner/repo"
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="maintainer">Maintainer</Label>
                <Select
                  value={maintainerId}
                  onValueChange={setMaintainerId}
                  required
                >
                  <SelectTrigger id="maintainer" className="w-full">
                    <SelectValue placeholder="Select maintainer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {maintainers.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.label} ({m.authorName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selected ? (
                  <p className="text-xs text-muted-foreground">
                    Commits as {selected.authorName} &lt;{selected.authorEmail}&gt;
                  </p>
                ) : null}
                <Button variant="link" size="sm" className="h-auto self-start px-0" asChild>
                  <Link href="/maintainers/add">
                    <Plus data-icon="inline-start" />
                    Add another maintainer
                  </Link>
                </Button>
              </div>

              {error ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}

              <Button
                type="submit"
                disabled={loading || !maintainerId}
                className="self-start"
              >
                {loading ? "Validating with GitHub..." : "Register fork"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
