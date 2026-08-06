import { ScrollText } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { listRecentActivityForAdmin } from "@/lib/data/admin";
import { formatDateTime } from "@/lib/format";
import { requirePlatformAdmin } from "@/lib/workspace/session";

export default async function AdminAuditPage() {
  const admin = await requirePlatformAdmin();
  const activity = await listRecentActivityForAdmin(admin.supabase);

  return (
    <div>
      <PageHeader
        title="Audit platformă"
        description="Activitate recentă din toate workspace-urile — vizibilă doar pentru admin platformă."
      />

      {activity.length === 0 ? (
        <EmptyState icon={ScrollText} title="Fără activitate" description="Nu există încă evenimente înregistrate." />
      ) : (
        <div className="surface-card divide-y divide-border">
          {activity.map((item) => (
            <div key={item.id} className="flex flex-wrap items-start justify-between gap-3 p-4">
              <div>
                <p className="text-sm text-foreground">{item.title}</p>
                {item.description ? (
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                ) : null}
                <p className="mt-1 text-xs text-muted-soft">
                  {item.workspaceName}
                  {item.action ? ` · ${item.action}` : ""}
                </p>
              </div>
              <p className="whitespace-nowrap text-xs text-muted-soft">{formatDateTime(item.createdAt)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
