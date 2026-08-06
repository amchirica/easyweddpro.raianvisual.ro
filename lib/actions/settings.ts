"use server";

import { revalidatePath } from "next/cache";

import { logActivity } from "@/lib/activity/log";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/types";
import {
  deleteWorkspaceSchema,
  profileFormSchema,
  transferOwnershipSchema,
  workspaceFormSchema,
} from "@/lib/validations/settings";
import { requireWorkspaceAction } from "@/lib/workspace/permissions";
import { requireWorkspace, type WorkspaceSettings } from "@/lib/workspace/session";
import type { Database, Json } from "@/types/database";

type WorkspaceRow = Database["public"]["Tables"]["workspaces"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

const LOGO_BUCKET = "workspace-assets";
const LEGACY_LOGO_BUCKET = "workspace-logos";
const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const ALLOWED_LOGO_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export async function updateProfileAction(
  input: unknown,
): Promise<ActionResult<{ profile: ProfileRow }>> {
  const parsed = profileFormSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Date invalide");
  }

  const ctx = await requireWorkspace();

  const { data: profile, error } = await ctx.supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName.trim(), updated_at: new Date().toISOString() })
    .eq("id", ctx.user.id)
    .select("*")
    .maybeSingle();

  if (error || !profile) {
    if (process.env.NODE_ENV === "development") {
      console.error("[settings.updateProfile]", error?.message);
    }
    return actionError("Nu am putut actualiza profilul.");
  }

  revalidatePath("/dashboard/settings");
  return actionSuccess("Profil actualizat.", { profile });
}

export async function updateWorkspaceAction(
  input: unknown,
): Promise<ActionResult<{ workspace: WorkspaceRow }>> {
  const parsed = workspaceFormSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Date invalide");
  }

  try {
    const ctx = await requireWorkspaceAction("workspace.manage");
    const data = parsed.data;

    const existingSettings = (ctx.activeWorkspace.settings as WorkspaceSettings | null) ?? {};
    const nextSettings: Json = {
      ...existingSettings,
      language: data.language,
      default_project_pipeline: data.defaultProjectPipeline || "generic",
      notifications: {
        emailNotifications: data.notifications.emailNotifications,
        weeklyDigest: data.notifications.weeklyDigest,
        productUpdates: data.notifications.productUpdates,
      },
    } as Json;

    const fiscalData: Json | null =
      data.fiscalCui || data.fiscalAddress
        ? ({ cui: data.fiscalCui || null, address: data.fiscalAddress || null } as Json)
        : null;

    const { data: workspace, error } = await ctx.supabase
      .from("workspaces")
      .update({
        name: data.name.trim(),
        city: data.city?.trim() || null,
        country: data.country?.trim() || null,
        currency: data.currency,
        timezone: data.timezone,
        brand_primary: data.brandPrimary?.trim() || null,
        brand_accent: data.brandAccent?.trim() || null,
        fiscal_data: fiscalData,
        settings: nextSettings,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ctx.activeWorkspace.id)
      .select("*")
      .maybeSingle();

    if (error || !workspace) {
      if (process.env.NODE_ENV === "development") {
        console.error("[settings.updateWorkspace]", error?.message);
      }
      return actionError("Nu am putut actualiza workspace-ul.");
    }

    await logActivity(ctx.supabase, {
      workspaceId: ctx.activeWorkspace.id,
      actorId: ctx.user.id,
      entityType: "workspace",
      entityId: ctx.activeWorkspace.id,
      action: "workspace.updated",
      title: "Setări workspace actualizate",
    });

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");
    return actionSuccess("Setări actualizate.", { workspace });
  } catch (error) {
    if (error instanceof Error && error.message === "forbidden") {
      return actionError("Nu ai permisiunea de a modifica setările workspace-ului.");
    }
    return actionError("Nu am putut actualiza workspace-ul.");
  }
}

/** Mint a short-lived signed upload URL so the browser never posts the file through Server Actions. */
export async function createWorkspaceLogoUploadAction(input: {
  contentType: string;
  fileSize: number;
}): Promise<ActionResult<{ path: string; token: string; contentType: string }>> {
  try {
    const ctx = await requireWorkspaceAction("workspace.manage");
    const contentType = input.contentType.trim().toLowerCase();
    const extension = ALLOWED_LOGO_MIME[contentType];
    if (!extension) {
      return actionError("Format neacceptat. Folosește PNG, JPG sau WEBP.");
    }
    if (!Number.isFinite(input.fileSize) || input.fileSize <= 0) {
      return actionError("Fișierul este gol.");
    }
    if (input.fileSize > MAX_LOGO_BYTES) {
      return actionError("Logo-ul trebuie să aibă cel mult 2MB.");
    }

    const path = `${ctx.activeWorkspace.id}/logo-${Date.now()}.${extension}`;
    const { data, error } = await ctx.supabase.storage
      .from(LOGO_BUCKET)
      .createSignedUploadUrl(path, { upsert: true });

    if (error || !data?.token) {
      if (process.env.NODE_ENV === "development") {
        console.error("[settings.createLogoUpload]", error?.message);
      }
      return actionError("Nu am putut pregăti încărcarea logo-ului.");
    }

    return actionSuccess("Upload pregătit.", {
      path: data.path,
      token: data.token,
      contentType,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "forbidden") {
      return actionError("Nu ai permisiunea de a modifica logo-ul workspace-ului.");
    }
    return actionError("Nu am putut pregăti încărcarea logo-ului.");
  }
}

export async function confirmWorkspaceLogoAction(input: {
  path: string;
}): Promise<ActionResult<{ logoUrl: string }>> {
  try {
    const ctx = await requireWorkspaceAction("workspace.manage");
    const path = input.path.trim();
    const prefix = `${ctx.activeWorkspace.id}/logo-`;
    if (!path.startsWith(prefix) || path.includes("..")) {
      return actionError("Calea logo-ului este invalidă.");
    }

    const { data: publicUrlData } = ctx.supabase.storage.from(LOGO_BUCKET).getPublicUrl(path);
    const logoUrl = publicUrlData.publicUrl;
    const previousLogoUrl = ctx.activeWorkspace.logo_url;

    const { error: updateError } = await ctx.supabase
      .from("workspaces")
      .update({ logo_url: logoUrl, updated_at: new Date().toISOString() })
      .eq("id", ctx.activeWorkspace.id);

    if (updateError) {
      return actionError("Logo-ul a fost încărcat, dar nu am putut actualiza workspace-ul.");
    }

    await removePreviousLogoBestEffort(ctx.supabase, previousLogoUrl);

    await logActivity(ctx.supabase, {
      workspaceId: ctx.activeWorkspace.id,
      actorId: ctx.user.id,
      entityType: "workspace",
      entityId: ctx.activeWorkspace.id,
      action: "workspace.logo_updated",
      title: "Logo workspace actualizat",
    });

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");
    return actionSuccess("Logo actualizat.", { logoUrl });
  } catch (error) {
    if (error instanceof Error && error.message === "forbidden") {
      return actionError("Nu ai permisiunea de a modifica logo-ul workspace-ului.");
    }
    return actionError("Nu am putut confirma logo-ul.");
  }
}

/** @deprecated Prefer signed upload via createWorkspaceLogoUploadAction + confirmWorkspaceLogoAction. */
export async function uploadWorkspaceLogoAction(
  formData: FormData,
): Promise<ActionResult<{ logoUrl: string }>> {
  try {
    const ctx = await requireWorkspaceAction("workspace.manage");

    const file = formData.get("file");
    if (!(file instanceof File)) {
      return actionError("Fișierul este obligatoriu.");
    }
    if (file.size <= 0) {
      return actionError("Fișierul este gol.");
    }
    if (file.size > MAX_LOGO_BYTES) {
      return actionError("Logo-ul trebuie să aibă cel mult 2MB.");
    }
    const extension = ALLOWED_LOGO_MIME[file.type];
    if (!extension) {
      return actionError("Format neacceptat. Folosește PNG, JPG sau WEBP.");
    }

    const path = `${ctx.activeWorkspace.id}/logo-${Date.now()}.${extension}`;

    const { error: uploadError } = await ctx.supabase.storage
      .from(LOGO_BUCKET)
      .upload(path, file, { contentType: file.type, upsert: true });

    if (uploadError) {
      if (process.env.NODE_ENV === "development") {
        console.error("[settings.uploadLogo]", uploadError.message);
      }
      return actionError("Nu am putut încărca logo-ul.");
    }

    return confirmWorkspaceLogoAction({ path });
  } catch (error) {
    if (error instanceof Error && error.message === "forbidden") {
      return actionError("Nu ai permisiunea de a modifica logo-ul workspace-ului.");
    }
    return actionError("Nu am putut încărca logo-ul.");
  }
}

export async function removeWorkspaceLogoAction(): Promise<ActionResult> {
  try {
    const ctx = await requireWorkspaceAction("workspace.manage");
    const previousLogoUrl = ctx.activeWorkspace.logo_url;

    const { error } = await ctx.supabase
      .from("workspaces")
      .update({ logo_url: null, updated_at: new Date().toISOString() })
      .eq("id", ctx.activeWorkspace.id);

    if (error) return actionError("Nu am putut elimina logo-ul.");

    await removePreviousLogoBestEffort(ctx.supabase, previousLogoUrl);

    await logActivity(ctx.supabase, {
      workspaceId: ctx.activeWorkspace.id,
      actorId: ctx.user.id,
      entityType: "workspace",
      entityId: ctx.activeWorkspace.id,
      action: "workspace.logo_removed",
      title: "Logo workspace eliminat",
    });

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");
    return actionSuccess("Logo eliminat.");
  } catch (error) {
    if (error instanceof Error && error.message === "forbidden") {
      return actionError("Nu ai permisiunea de a modifica logo-ul workspace-ului.");
    }
    return actionError("Nu am putut elimina logo-ul.");
  }
}

async function removePreviousLogoBestEffort(
  supabase: Awaited<ReturnType<typeof requireWorkspaceAction>>["supabase"],
  previousLogoUrl: string | null,
): Promise<void> {
  if (!previousLogoUrl) return;
  for (const bucket of [LOGO_BUCKET, LEGACY_LOGO_BUCKET]) {
    const marker = `/${bucket}/`;
    const index = previousLogoUrl.indexOf(marker);
    if (index === -1) continue;
    const path = previousLogoUrl.slice(index + marker.length);
    if (!path) return;
    await supabase.storage.from(bucket).remove([path]);
    return;
  }
}

export async function deleteWorkspaceAction(input: unknown): Promise<ActionResult> {
  const parsed = deleteWorkspaceSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Date invalide");
  }

  try {
    const ctx = await requireWorkspaceAction("workspace.manage");

    if (ctx.role !== "owner") {
      return actionError("Doar proprietarul (owner) poate șterge workspace-ul.");
    }

    if (parsed.data.confirmation.trim() !== ctx.activeWorkspace.name) {
      return actionError("Textul de confirmare nu corespunde numelui workspace-ului.");
    }

    const { error } = await ctx.supabase
      .from("workspaces")
      .delete()
      .eq("id", ctx.activeWorkspace.id);

    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("[settings.deleteWorkspace]", error.message);
      }
      return actionError("Nu am putut șterge workspace-ul.");
    }

    return actionSuccess("Workspace șters.");
  } catch (error) {
    if (error instanceof Error && error.message === "forbidden") {
      return actionError("Nu ai permisiunea de a șterge workspace-ul.");
    }
    return actionError("Nu am putut șterge workspace-ul.");
  }
}

export async function requestOwnershipTransferAction(input: unknown): Promise<ActionResult> {
  const parsed = transferOwnershipSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Date invalide");
  }

  try {
    const ctx = await requireWorkspaceAction("workspace.manage");

    if (ctx.role !== "owner") {
      return actionError("Doar proprietarul (owner) poate transfera proprietatea.");
    }

    if (parsed.data.confirmation.trim() !== ctx.activeWorkspace.name) {
      return actionError("Textul de confirmare nu corespunde numelui workspace-ului.");
    }

    const { data: target } = await ctx.supabase
      .from("workspace_members")
      .select("id, user_id, role")
      .eq("id", parsed.data.targetMembershipId)
      .eq("workspace_id", ctx.activeWorkspace.id)
      .maybeSingle();

    if (!target) return actionError("Membrul țintă nu a fost găsit.");
    if (target.user_id === ctx.user.id) {
      return actionError("Alege un alt membru pentru a transfera proprietatea.");
    }

    const { error: promoteError } = await ctx.supabase
      .from("workspace_members")
      .update({ role: "owner" })
      .eq("id", target.id)
      .eq("workspace_id", ctx.activeWorkspace.id);

    if (promoteError) return actionError("Nu am putut promova noul proprietar.");

    const { error: demoteError } = await ctx.supabase
      .from("workspace_members")
      .update({ role: "admin" })
      .eq("workspace_id", ctx.activeWorkspace.id)
      .eq("user_id", ctx.user.id);

    if (demoteError) {
      return actionError("Proprietatea a fost transferată parțial. Contactează suportul.");
    }

    await logActivity(ctx.supabase, {
      workspaceId: ctx.activeWorkspace.id,
      actorId: ctx.user.id,
      entityType: "workspace",
      entityId: ctx.activeWorkspace.id,
      action: "workspace.ownership_transferred",
      title: "Proprietate workspace transferată",
      metadata: { new_owner_membership_id: target.id },
    });

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/team");
    return actionSuccess("Proprietatea a fost transferată. Rolul tău a devenit admin.");
  } catch (error) {
    if (error instanceof Error && error.message === "forbidden") {
      return actionError("Nu ai permisiunea de a transfera proprietatea.");
    }
    return actionError("Nu am putut transfera proprietatea.");
  }
}
