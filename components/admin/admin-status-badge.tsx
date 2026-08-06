import { cn } from "@/lib/utils";

const TONES = {
  success: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
  warning: "border-amber-400/30 bg-amber-500/10 text-amber-200",
  danger: "border-rose-400/30 bg-rose-500/10 text-rose-300",
  muted: "border-border bg-surface-elevated text-muted-foreground",
  accent: "border-champagne/30 bg-champagne/10 text-champagne-soft",
} as const;

export function AdminStatusBadge({
  label,
  tone = "muted",
}: {
  label: string;
  tone?: keyof typeof TONES;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        TONES[tone],
      )}
    >
      {label}
    </span>
  );
}
