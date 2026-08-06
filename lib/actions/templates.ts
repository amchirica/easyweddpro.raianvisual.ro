"use server";

import { revalidatePath } from "next/cache";

import { logActivity } from "@/lib/activity/log";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/types";
import { archiveRow, softDeleteRow, unarchiveRow } from "@/lib/data/soft-delete";
import { isAllowedTemplateVariable } from "@/lib/contracts/templates";
import { collectTemplateVariableTokens, idsToUnsetDefault } from "@/lib/templates/rules";
import { templateFormSchema, TEMPLATE_TYPE_LABELS, type TemplateType } from "@/lib/validations/templates";
import { requireWorkspaceAction } from "@/lib/workspace/permissions";
import type { Database, Json } from "@/types/database";

type TemplateRow = Database["public"]["Tables"]["workspace_templates"]["Row"];

function contentToJson(content: {
  subject?: string;
  body?: string;
  description?: string;
  checklist: string[];
  stages: string[];
}): Json {
  return {
    subject: content.subject?.trim() || null,
    body: content.body?.trim() || "",
    description: content.description?.trim() || null,
    checklist: content.checklist,
    stages: content.stages,
  } as Json;
}

function computeAllowedVariables(content: {
  subject?: string;
  body?: string;
  checklist: string[];
  stages: string[];
}): string[] {
  const tokens = collectTemplateVariableTokens([
    content.subject ?? "",
    content.body ?? "",
    ...content.checklist,
    ...content.stages,
  ]);
  return tokens.filter((token) => isAllowedTemplateVariable(token));
}

export async function createTemplateAction(
  input: unknown,
): Promise<ActionResult<{ template: TemplateRow }>> {
  const parsed = templateFormSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Date invalide");
  }

  try {
    const ctx = await requireWorkspaceAction("templates.write");
    const data = parsed.data;
    const variables = computeAllowedVariables(data.content);

    const { data: template, error } = await ctx.supabase
      .from("workspace_templates")
      .insert({
        workspace_id: ctx.activeWorkspace.id,
        type: data.type,
        name: data.name.trim(),
        category: data.category.trim() || "general",
        business_type: data.businessType?.trim() || null,
        content: contentToJson(data.content),
        variables,
        is_default: false,
        created_by: ctx.user.id,
      })
      .select("*")
      .single();

    if (error || !template) {
      if (process.env.NODE_ENV === "development") {
        console.error("[templates.create]", error?.message);
      }
      return actionError("Nu am putut crea template-ul.");
    }

    if (data.isDefault) {
      await setDefaultInternal(ctx.supabase, ctx.activeWorkspace.id, template.id, data.type);
      template.is_default = true;
    }

    await logActivity(ctx.supabase, {
      workspaceId: ctx.activeWorkspace.id,
      actorId: ctx.user.id,
      entityType: "template",
      entityId: template.id,
      action: "template.created",
      title: "Template creat",
      description: template.name,
      metadata: { type: data.type },
    });

    revalidatePath("/dashboard/templates");
    return actionSuccess("Template creat.", { template });
  } catch (error) {
    if (error instanceof Error && error.message === "forbidden") {
      return actionError("Nu ai permisiunea de a crea template-uri.");
    }
    return actionError("Nu am putut crea template-ul.");
  }
}

export async function updateTemplateAction(
  templateId: string,
  input: unknown,
): Promise<ActionResult<{ template: TemplateRow }>> {
  const parsed = templateFormSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Date invalide");
  }

  try {
    const ctx = await requireWorkspaceAction("templates.write");
    const data = parsed.data;
    const variables = computeAllowedVariables(data.content);

    const { data: template, error } = await ctx.supabase
      .from("workspace_templates")
      .update({
        name: data.name.trim(),
        category: data.category.trim() || "general",
        business_type: data.businessType?.trim() || null,
        content: contentToJson(data.content),
        variables,
        updated_at: new Date().toISOString(),
      })
      .eq("id", templateId)
      .eq("workspace_id", ctx.activeWorkspace.id)
      .is("deleted_at", null)
      .select("*")
      .maybeSingle();

    if (error) return actionError("Nu am putut actualiza template-ul.");
    if (!template) return actionError("Template-ul nu a fost găsit.");

    if (data.isDefault && !template.is_default) {
      await setDefaultInternal(ctx.supabase, ctx.activeWorkspace.id, template.id, template.type as TemplateType);
      template.is_default = true;
    }

    await logActivity(ctx.supabase, {
      workspaceId: ctx.activeWorkspace.id,
      actorId: ctx.user.id,
      entityType: "template",
      entityId: template.id,
      action: "template.updated",
      title: "Template actualizat",
      description: template.name,
    });

    revalidatePath("/dashboard/templates");
    revalidatePath(`/dashboard/templates/${templateId}`);
    return actionSuccess("Template actualizat.", { template });
  } catch (error) {
    if (error instanceof Error && error.message === "forbidden") {
      return actionError("Nu ai permisiunea de a edita template-uri.");
    }
    return actionError("Nu am putut actualiza template-ul.");
  }
}

export async function duplicateTemplateAction(
  templateId: string,
): Promise<ActionResult<{ template: TemplateRow }>> {
  try {
    const ctx = await requireWorkspaceAction("templates.write");

    const { data: source } = await ctx.supabase
      .from("workspace_templates")
      .select("*")
      .eq("id", templateId)
      .eq("workspace_id", ctx.activeWorkspace.id)
      .is("deleted_at", null)
      .maybeSingle();

    if (!source) return actionError("Template-ul nu a fost găsit.");

    const { data: created, error } = await ctx.supabase
      .from("workspace_templates")
      .insert({
        workspace_id: ctx.activeWorkspace.id,
        type: source.type,
        name: `${source.name} (copie)`,
        category: source.category,
        business_type: source.business_type,
        content: source.content,
        variables: source.variables,
        is_default: false,
        created_by: ctx.user.id,
      })
      .select("*")
      .single();

    if (error || !created) return actionError("Nu am putut duplica template-ul.");

    await logActivity(ctx.supabase, {
      workspaceId: ctx.activeWorkspace.id,
      actorId: ctx.user.id,
      entityType: "template",
      entityId: created.id,
      action: "template.duplicated",
      title: "Template duplicat",
      description: created.name,
      metadata: { source_id: templateId },
    });

    revalidatePath("/dashboard/templates");
    return actionSuccess("Template duplicat.", { template: created });
  } catch (error) {
    if (error instanceof Error && error.message === "forbidden") {
      return actionError("Nu ai permisiunea de a duplica template-uri.");
    }
    return actionError("Nu am putut duplica template-ul.");
  }
}

async function setDefaultInternal(
  supabase: Awaited<ReturnType<typeof requireWorkspaceAction>>["supabase"],
  workspaceId: string,
  templateId: string,
  type: TemplateType,
): Promise<void> {
  const { data: siblings } = await supabase
    .from("workspace_templates")
    .select("id, type, is_default")
    .eq("workspace_id", workspaceId)
    .eq("type", type)
    .is("deleted_at", null);

  const toUnset = idsToUnsetDefault(
    (siblings ?? []).map((row) => ({ id: row.id, type: row.type, isDefault: row.is_default })),
    templateId,
  );

  if (toUnset.length) {
    await supabase
      .from("workspace_templates")
      .update({ is_default: false })
      .eq("workspace_id", workspaceId)
      .in("id", toUnset);
  }

  await supabase
    .from("workspace_templates")
    .update({ is_default: true })
    .eq("id", templateId)
    .eq("workspace_id", workspaceId);
}

export async function setDefaultTemplateAction(templateId: string): Promise<ActionResult> {
  try {
    const ctx = await requireWorkspaceAction("templates.write");

    const { data: template } = await ctx.supabase
      .from("workspace_templates")
      .select("id, type, name, archived_at")
      .eq("id", templateId)
      .eq("workspace_id", ctx.activeWorkspace.id)
      .is("deleted_at", null)
      .maybeSingle();

    if (!template) return actionError("Template-ul nu a fost găsit.");
    if (template.archived_at) return actionError("Un template arhivat nu poate fi setat implicit.");

    await setDefaultInternal(
      ctx.supabase,
      ctx.activeWorkspace.id,
      templateId,
      template.type as TemplateType,
    );

    await logActivity(ctx.supabase, {
      workspaceId: ctx.activeWorkspace.id,
      actorId: ctx.user.id,
      entityType: "template",
      entityId: templateId,
      action: "template.set_default",
      title: "Template setat implicit",
      description: template.name,
      metadata: { type: template.type },
    });

    revalidatePath("/dashboard/templates");
    revalidatePath(`/dashboard/templates/${templateId}`);
    return actionSuccess(
      `Template setat implicit pentru ${TEMPLATE_TYPE_LABELS[template.type as TemplateType] ?? template.type}.`,
    );
  } catch (error) {
    if (error instanceof Error && error.message === "forbidden") {
      return actionError("Nu ai permisiunea de a modifica template-uri.");
    }
    return actionError("Nu am putut seta template-ul implicit.");
  }
}

export async function archiveTemplateAction(templateId: string): Promise<ActionResult> {
  try {
    const ctx = await requireWorkspaceAction("templates.write");

    const { data: template } = await ctx.supabase
      .from("workspace_templates")
      .select("id, name")
      .eq("id", templateId)
      .eq("workspace_id", ctx.activeWorkspace.id)
      .is("deleted_at", null)
      .maybeSingle();

    if (!template) return actionError("Template-ul nu a fost găsit.");

    if (template) {
      await ctx.supabase
        .from("workspace_templates")
        .update({ is_default: false })
        .eq("id", templateId)
        .eq("workspace_id", ctx.activeWorkspace.id);
    }

    const result = await archiveRow(
      ctx.supabase,
      "workspace_templates",
      ctx.activeWorkspace.id,
      templateId,
    );
    if (!result.ok) return actionError("Nu am putut arhiva template-ul.");

    await logActivity(ctx.supabase, {
      workspaceId: ctx.activeWorkspace.id,
      actorId: ctx.user.id,
      entityType: "template",
      entityId: templateId,
      action: "template.archived",
      title: "Template arhivat",
      description: template.name,
    });

    revalidatePath("/dashboard/templates");
    return actionSuccess("Template arhivat.");
  } catch (error) {
    if (error instanceof Error && error.message === "forbidden") {
      return actionError("Nu ai permisiunea de a arhiva template-uri.");
    }
    return actionError("Nu am putut arhiva template-ul.");
  }
}

export async function unarchiveTemplateAction(templateId: string): Promise<ActionResult> {
  try {
    const ctx = await requireWorkspaceAction("templates.write");

    const result = await unarchiveRow(
      ctx.supabase,
      "workspace_templates",
      ctx.activeWorkspace.id,
      templateId,
    );
    if (!result.ok) return actionError("Nu am putut restaura template-ul.");

    await logActivity(ctx.supabase, {
      workspaceId: ctx.activeWorkspace.id,
      actorId: ctx.user.id,
      entityType: "template",
      entityId: templateId,
      action: "template.unarchived",
      title: "Template restaurat din arhivă",
    });

    revalidatePath("/dashboard/templates");
    return actionSuccess("Template restaurat.");
  } catch (error) {
    if (error instanceof Error && error.message === "forbidden") {
      return actionError("Nu ai permisiunea de a restaura template-uri.");
    }
    return actionError("Nu am putut restaura template-ul.");
  }
}

export async function softDeleteTemplateAction(templateId: string): Promise<ActionResult> {
  try {
    const ctx = await requireWorkspaceAction("templates.write");

    const { data: template } = await ctx.supabase
      .from("workspace_templates")
      .select("id, name")
      .eq("id", templateId)
      .eq("workspace_id", ctx.activeWorkspace.id)
      .is("deleted_at", null)
      .maybeSingle();

    if (!template) return actionError("Template-ul nu a fost găsit.");

    const result = await softDeleteRow(
      ctx.supabase,
      "workspace_templates",
      ctx.activeWorkspace.id,
      templateId,
    );
    if (!result.ok) return actionError("Nu am putut șterge template-ul.");

    await logActivity(ctx.supabase, {
      workspaceId: ctx.activeWorkspace.id,
      actorId: ctx.user.id,
      entityType: "template",
      entityId: templateId,
      action: "template.deleted",
      title: "Template șters",
      description: template.name,
    });

    revalidatePath("/dashboard/templates");
    return actionSuccess("Template șters.");
  } catch (error) {
    if (error instanceof Error && error.message === "forbidden") {
      return actionError("Nu ai permisiunea de a șterge template-uri.");
    }
    return actionError("Nu am putut șterge template-ul.");
  }
}
