"use server";

import { z } from "zod";

import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/types";
import { getSessionContext } from "@/lib/workspace/session";

const schema = z.object({
  eventId: z.string().uuid(),
  helpful: z.boolean(),
});

export async function submitAssistantFeedbackAction(
  input: unknown,
): Promise<ActionResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return actionError("Feedback invalid.");
  }

  const session = await getSessionContext();
  if (!session || session.isDemo || !session.user || !session.supabase) {
    return actionError("Trebuie să fii autentificat.");
  }

  const { error } = await session.supabase
    .from("assistant_events")
    .update({ helpful: parsed.data.helpful })
    .eq("id", parsed.data.eventId)
    .eq("user_id", session.user.id);

  if (error) {
    return actionError("Nu am putut salva feedback-ul.");
  }

  return actionSuccess("Mulțumim!");
}
