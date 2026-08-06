import { Info } from "lucide-react";

import { cn } from "@/lib/utils";

type DemoBannerProps = {
  className?: string;
};

export function DemoBanner({ className }: DemoBannerProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border border-champagne/30 bg-champagne/10 px-4 py-2.5 text-sm text-champagne-soft",
        className,
      )}
      role="status"
    >
      <Info className="h-4 w-4 shrink-0" aria-hidden />
      <span>Mod demo — datele nu sunt persistate.</span>
    </div>
  );
}
