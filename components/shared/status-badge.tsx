import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const toneClasses = {
  neutral: "border-border bg-muted/40 text-muted-foreground",
  accent: "border-champagne/30 bg-champagne/10 text-champagne-soft",
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/10 text-warning",
  danger: "border-destructive/30 bg-destructive/10 text-destructive",
} as const;

type StatusBadgeProps = {
  label: string;
  tone?: keyof typeof toneClasses;
  className?: string;
};

export function StatusBadge({ label, tone = "neutral", className }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn(toneClasses[tone], className)}>
      {label}
    </Badge>
  );
}
