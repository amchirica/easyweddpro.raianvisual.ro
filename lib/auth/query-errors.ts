/** Map auth redirect query codes to safe Romanian messages. */
export function mapAuthQueryError(code: string | null | undefined): string | null {
  if (!code) return null;

  const normalized = decodeURIComponent(code).toLowerCase();

  if (
    normalized.includes("otp_expired") ||
    normalized.includes("expired") ||
    normalized.includes("invalid") ||
    normalized === "missing_token" ||
    normalized === "auth_confirmation_failed"
  ) {
    return "Linkul de confirmare este invalid, expirat sau a fost deja utilizat.";
  }

  if (normalized.includes("session") || normalized === "session_missing") {
    return "Contul a fost confirmat, dar sesiunea nu a putut fi inițializată. Autentifică-te din nou.";
  }

  if (normalized === "account_suspended") {
    return "Contul este suspendat. Contactează suportul.";
  }

  if (normalized === "auth_not_configured" || normalized === "supabase_not_configured") {
    return "Autentificarea nu este configurată în acest mediu.";
  }

  if (normalized === "missing_code") {
    return "Linkul de autentificare este incomplet. Solicită unul nou.";
  }

  // Never surface raw Supabase codes to end users.
  return "Nu am putut finaliza autentificarea. Încearcă din nou.";
}
