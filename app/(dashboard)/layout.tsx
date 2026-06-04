import { Suspense } from "react";
import { getForks, getRecentSidebarRepos } from "@/lib/repos";
import AppSidebar from "@/app/components/AppSidebar";
import NavbarUserMenu from "@/app/components/NavbarUserMenu";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const forks = await getForks();

  return (
    <SidebarProvider>
      <Suspense fallback={null}>
        <AppSidebar
          repoCount={forks.length}
          recentRepos={getRecentSidebarRepos(forks)}
        />
      </Suspense>
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-1 h-4" />
          <span className="text-sm text-muted-foreground md:hidden">
            Sync Fork
          </span>
          <div className="ml-auto">
            <NavbarUserMenu />
          </div>
        </header>
        <div className="flex flex-1 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
