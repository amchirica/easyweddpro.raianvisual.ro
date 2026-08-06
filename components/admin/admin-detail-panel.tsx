import type { ReactNode } from "react";

export function AdminDetailPanel({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="surface-card overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border px-5 py-4">
        <div>
          <h2 className="font-heading text-lg font-medium text-foreground">{title}</h2>
          {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function AdminDetailGrid({ items }: { items: Array<{ label: string; value: ReactNode }> }) {
  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{item.label}</dt>
          <dd className="mt-1 text-sm text-foreground">{item.value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
