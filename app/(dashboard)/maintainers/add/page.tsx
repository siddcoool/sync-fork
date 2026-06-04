"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageShell from "@/app/components/PageShell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AddMaintainerPage() {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [pat, setPat] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/maintainers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, pat, authorName, authorEmail }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to add maintainer.");
        return;
      }
      router.replace("/maintainers");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell narrow>
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Add maintainer
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Store a fine-grained PAT and commit identity once, then reuse them for any fork.
          The PAT is encrypted at rest and never shown again.
        </p>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Credentials</CardTitle>
          <CardDescription>
            The PAT is validated against GitHub when you save.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="label">Label</Label>
              <Input
                id="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Jane — org maintainer"
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="pat">Fine-grained PAT</Label>
              <Input
                id="pat"
                type="password"
                value={pat}
                onChange={(e) => setPat(e.target.value)}
                placeholder="github_pat_..."
              />
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="authorName">Commit author name</Label>
                <Input
                  id="authorName"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Jane Doe"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="authorEmail">Commit author email</Label>
                <Input
                  id="authorEmail"
                  type="email"
                  value={authorEmail}
                  onChange={(e) => setAuthorEmail(e.target.value)}
                  placeholder="jane@example.com"
                />
              </div>
            </div>

            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <Button type="submit" disabled={loading} className="self-start">
              {loading ? "Validating with GitHub..." : "Save maintainer"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </PageShell>
  );
}
