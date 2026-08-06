import type { LucideIcon } from "lucide-react";

export function AdminEmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="surface-card flex flex-col items-center px-6 py-14 text-center">
      <Icon className="h-8 w-8 text-muted-soft" aria-hidden />
      <h2 className="mt-4 font-heading text-xl font-medium text-foreground">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
