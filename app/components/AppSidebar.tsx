"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { GitFork, Plus, Users, LayoutList } from "lucide-react";
import type { SidebarRepo } from "@/lib/repos";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

const statusDot: Record<SidebarRepo["lastSyncStatus"], string> = {
  never: "bg-muted-foreground/50",
  success: "bg-primary",
  error: "bg-destructive",
  conflict: "bg-amber-500",
};

export default function AppSidebar({
  repoCount,
  recentRepos,
}: {
  repoCount: number;
  recentRepos: SidebarRepo[];
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeQuery = pathname === "/" ? searchParams.get("q")?.toLowerCase() : null;

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="Sync Fork">
              <Link href="/">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <GitFork className="size-4" />
                </span>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Sync Fork</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {repoCount} fork{repoCount === 1 ? "" : "s"}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/" && !activeQuery}
                  tooltip="All repositories"
                >
                  <Link href="/">
                    <LayoutList />
                    <span>All repositories</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {recentRepos.length > 0 ? (
          <SidebarGroup>
            <SidebarGroupLabel>Recently synced</SidebarGroupLabel>
            {repoCount > recentRepos.length ? (
              <SidebarGroupAction asChild>
                <Link href="/" title="View all">
                  <span className="text-xs">All</span>
                </Link>
              </SidebarGroupAction>
            ) : null}
            <SidebarGroupContent>
              <SidebarMenu>
                {recentRepos.map((r) => {
                  const repoSlug = `${r.owner}/${r.repo}`.toLowerCase();
                  const isActive =
                    pathname === "/" && activeQuery === repoSlug;
                  return (
                    <SidebarMenuItem key={r.id}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={`${r.owner}/${r.repo}`}
                      >
                        <Link
                          href={`/?q=${encodeURIComponent(`${r.owner}/${r.repo}`)}`}
                        >
                          <span
                            className={cn(
                              "size-2 shrink-0 rounded-full",
                              statusDot[r.lastSyncStatus],
                            )}
                          />
                          <span className="truncate">
                            {r.owner}/{r.repo}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith("/maintainers")}
              tooltip="Maintainers"
            >
              <Link href="/maintainers">
                <Users />
                <span>Maintainers</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/add"}
              tooltip="Add fork"
            >
              <Link href="/add">
                <Plus />
                <span>Add fork</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
