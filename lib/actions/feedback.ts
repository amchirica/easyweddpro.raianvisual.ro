"use server";

import { z } from "zod";

import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/types";
import { requireWorkspace } from "@/lib/workspace/session";

const feedbackSchema = z.object({
  type: z.enum(["bug", "idea", "unclear", "general"]),
  message: z.string().trim().min(5, "Descrie puțin mai mult, te rog.").max(4000),
  rating: z.number().int().min(1).max(5).optional().nullable(),
  pageUrl: z.string().trim().max(500).optional().nullable(),
});

export async function submitFeedbackAction(input: unknown): Promise<ActionResult> {
  const parsed = feedbackSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Date invalide.");
  }

  const ctx = await requireWorkspace();
  const data = parsed.data;

  const { error } = await ctx.supabase.from("user_feedback").insert({
    workspace_id: ctx.activeWorkspace.id,
    user_id: ctx.user.id,
    type: data.type,
    message: data.message,
    rating: data.rating ?? null,
    page_url: data.pageUrl ?? null,
  });

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[feedback.submit]", error.message);
    }
    return actionError("Nu am putut trimite feedback-ul. Încearcă din nou.");
  }

  return actionSuccess("Mulțumim pentru feedback! Am notat mesajul tău.");
}
