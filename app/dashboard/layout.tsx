import type { Metadata } from "next";
import type { ReactNode } from "react";

import { InspectBanner } from "@/components/admin/inspect-banner";
import { AppShell } from "@/components/dashboard/app-shell";
import { getActiveInspectSession } from "@/lib/platform/inspect";
import { getSessionContext } from "@/lib/workspace/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const ctx = await getSessionContext();
  const isDemo = !ctx || ctx.isDemo;
  const workspaceName = !isDemo ? (ctx?.activeWorkspace?.name ?? undefined) : undefined;
  const userName = !isDemo
    ? (ctx?.profile?.full_name ?? ctx?.user?.email ?? undefined)
    : undefined;

  const inspect =
    !isDemo && ctx?.isPlatformAdmin ? await getActiveInspectSession() : null;

  return (
    <>
      {inspect ? (
        <InspectBanner
          workspaceName={inspect.workspaceName}
          reason={inspect.reason}
          adminEmail={ctx?.user?.email ?? undefined}
        />
      ) : null}
      <AppShell workspaceName={workspaceName} userName={userName} isDemo={isDemo}>
        {children}
      </AppShell>
    </>
  );
}
