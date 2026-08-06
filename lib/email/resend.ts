/**
 * Resend is an optional dependency at runtime: without RESEND_API_KEY we must
 * never pretend an email was sent. Callers should check `isResendConfigured()`
 * first and fall back to a "prepared" / "skipped" outcome otherwise.
 *
 * No `server-only` — also used from Cloudflare `scheduled()` background jobs.
 */
export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

export type SendEmailResult = {
  /** Resend's message id, when the API returns one. */
  providerMessageId: string | null;
};

export async function sendTransactionalEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("resend_not_configured");
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim() || "notificari@easyweddpro.raianvisual.ro";
  const fromName = process.env.RESEND_FROM_NAME?.trim() || "EasyWedd Pro";

  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);

  const { data, error } = await resend.emails.send({
    from: `${fromName} <${fromEmail}>`,
    to: input.to,
    subject: input.subject,
    html: input.html,
  });

  if (error) {
    throw new Error(typeof error.message === "string" ? error.message : "resend_send_failed");
  }

  return { providerMessageId: data?.id ?? null };
}
