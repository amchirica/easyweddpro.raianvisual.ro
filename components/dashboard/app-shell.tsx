"use client";

import { useState } from "react";

import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { AssistantWidget } from "@/components/assistant/assistant-widget";
import { FeedbackButton } from "@/components/feedback/feedback-button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

type AppShellProps = {
  children: React.ReactNode;
  workspaceName?: string;
  userName?: string;
  isDemo?: boolean;
};

export function AppShell({ children, workspaceName, userName, isDemo = false }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:block">
        <div className="sticky top-0 h-screen">
          <Sidebar
            collapsed={collapsed}
            onToggle={() => setCollapsed((v) => !v)}
            workspaceName={workspaceName}
            isDemo={isDemo}
          />
        </div>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[280px] border-sidebar-border bg-sidebar p-0">
          <SheetTitle className="sr-only">Navigare</SheetTitle>
          <Sidebar
            collapsed={false}
            onToggle={() => setMobileOpen(false)}
            onNavigate={() => setMobileOpen(false)}
            className="w-full border-0"
            workspaceName={workspaceName}
            isDemo={isDemo}
          />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          onOpenMobileNav={() => setMobileOpen(true)}
          workspaceName={workspaceName}
          userName={userName}
          isDemo={isDemo}
        />
        <main className="flex-1 px-4 py-6 md:px-6 md:py-8">{children}</main>
      </div>

      <AssistantWidget surface="dashboard" />
      {!isDemo ? <FeedbackButton /> : null}
    </div>
  );
}
