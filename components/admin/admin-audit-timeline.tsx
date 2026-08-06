export type AdminAuditItem = {
  id: string;
  action: string;
  title?: string;
  reason?: string | null;
  createdAt: string;
  actorLabel?: string | null;
};

export function AdminAuditTimeline({ items }: { items: AdminAuditItem[] }) {
  if (!items.length) {
    return <p className="text-sm text-muted-soft">Nicio înregistrare de audit.</p>;
  }

  return (
    <ol className="space-y-4">
      {items.map((item) => (
        <li key={item.id} className="border-l border-border pl-4">
          <p className="text-sm text-foreground">{item.title ?? item.action}</p>
          <p className="mt-0.5 text-xs text-muted-soft">
            {new Date(item.createdAt).toLocaleString("ro-RO")}
            {item.actorLabel ? ` · ${item.actorLabel}` : ""}
          </p>
          {item.reason ? <p className="mt-1 text-xs text-muted-foreground">Motiv: {item.reason}</p> : null}
        </li>
      ))}
    </ol>
  );
}
