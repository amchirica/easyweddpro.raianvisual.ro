import type { LucideIcon } from "lucide-react";

type AdminMetricCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
};

export function AdminMetricCard({ label, value, hint, icon: Icon }: AdminMetricCardProps) {
  return (
    <div className="surface-card p-5">
      <p className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
        {Icon ? <Icon className="h-3.5 w-3.5" aria-hidden /> : null}
        {label}
      </p>
      <p className="mt-3 font-heading text-2xl font-medium text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-soft">{hint}</p> : null}
    </div>
  );
}
