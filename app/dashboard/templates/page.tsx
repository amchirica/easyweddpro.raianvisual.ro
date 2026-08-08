import type { Metadata } from "next";
import { getTranslator } from "@/lib/i18n/t";

import { TemplatesList, type TemplateListItem } from "@/components/templates/templates-list";
import { listTemplates, type TemplateRow } from "@/lib/data/templates";
import { permissionsForRole } from "@/lib/workspace/permissions";
import { getWorkspaceOrDemo } from "@/lib/workspace/session";

export async function generateMetadata() {
  const { t } = await getTranslator();
  return { title: `${t("modules.templates.title")} · EasyWedd Pro` };
}

function mapTemplateRow(row: TemplateRow): TemplateListItem {
  return {
    id: row.id,
    type: row.type as TemplateListItem["type"],
    name: row.name,
    category: row.category,
    isDefault: row.is_default,
    archivedAt: row.archived_at,
    updatedAt: row.updated_at,
    variableCount: row.variables?.length ?? 0,
  };
}

export default async function TemplatesPage() {
  const { t } = await getTranslator();
  const ctx = await getWorkspaceOrDemo();
  const permissions = permissionsForRole(ctx.role);

  let templates: TemplateListItem[] = [];
  let error: string | null = null;

  try {
    const rows = await listTemplates(ctx.supabase, ctx.workspace.id, {
      includeArchived: true,
      limit: 300,
    });
    templates = rows.map(mapTemplateRow);
  } catch (err) {
    error = err instanceof Error ? err.message : t("modules.templates.loadFailed");
  }

  return (
    <TemplatesList
      initialTemplates={templates}
      canWrite={permissions.canWriteTemplates}
      error={error}
    />
  );
}
