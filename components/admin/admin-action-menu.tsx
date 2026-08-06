import type { ReactNode } from "react";

export function AdminActionMenu({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}
