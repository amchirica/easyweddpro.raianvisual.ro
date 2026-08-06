import type { ReactNode } from "react";

import { PageHeader } from "@/components/shared/page-header";

type ModuleShellProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function ModuleShell({ title, description, actions, children }: ModuleShellProps) {
  return (
    <div>
      <PageHeader title={title} description={description} actions={actions} />
      {children}
    </div>
  );
}
