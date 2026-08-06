import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminDetailPanel } from "@/components/admin/admin-detail-panel";
import { AdminErrorState } from "@/components/admin/admin-error-state";
import { InspectSessionForm } from "@/components/admin/inspect-session-form";
import { requirePlatformPermission } from "@/lib/platform/session";

export default async function AdminWorkspaceInspectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = await requirePlatformPermission("workspaces.inspect");
  const { data: workspace, error } = await admin.supabase
    .from("workspaces")
    .select("id, name, slug")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-3xl font-medium text-foreground">Inspectare</h1>
        <AdminErrorState message={error.message} />
      </div>
    );
  }
  if (!workspace) notFound();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link
          href={`/admin/workspaces/${workspace.id}`}
          className="text-sm text-muted-soft hover:text-foreground"
        >
          ← Înapoi la workspace
        </Link>
        <h1 className="font-heading text-3xl font-medium text-foreground">
          Inspectare: {workspace.name}
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Deschide o sesiune read-only în dashboard-ul workspace-ului. Nu poți modifica date, șterge
          înregistrări sau trimite invitații în timpul inspectării.
        </p>
      </div>

      <AdminDetailPanel title="Sesiune de inspectare">
        <InspectSessionForm workspaceId={workspace.id} />
      </AdminDetailPanel>
    </div>
  );
}
