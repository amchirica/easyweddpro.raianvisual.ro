import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppShell } from "@/components/dashboard/app-shell";
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

  return (
    <AppShell workspaceName={workspaceName} userName={userName} isDemo={isDemo}>
      {children}
    </AppShell>
  );
}
