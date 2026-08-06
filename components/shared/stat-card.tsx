import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  trend?: string;
  className?: string;
};

export function StatCard({ label, value, hint, icon: Icon, trend, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "surface-card group p-5 transition-colors hover:border-champagne/25",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 font-heading text-3xl font-medium text-champagne">{value}</p>
          {hint ? <p className="mt-1 text-sm text-muted-foreground">{hint}</p> : null}
          {trend ? <p className="mt-2 text-xs text-success">{trend}</p> : null}
        </div>
        {Icon ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background/40 text-champagne/80 transition-colors group-hover:border-champagne/30">
            <Icon className="h-4 w-4" aria-hidden />
          </div>
        ) : null}
      </div>
    </div>
  );
}
