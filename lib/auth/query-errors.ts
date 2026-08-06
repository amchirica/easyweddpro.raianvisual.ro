/** Map auth redirect query codes to safe Romanian messages. */
export function mapAuthQueryError(code: string | null | undefined): string | null {
  if (!code) return null;

  const normalized = decodeURIComponent(code).toLowerCase();

  if (
    normalized === "email_confirmed" ||
    normalized === "confirmed"
  ) {
    return "Emailul a fost confirmat. Poți continua configurarea contului.";
  }

  if (
    normalized === "session_initialization_failed" ||
    normalized === "session_missing" ||
    normalized.includes("session_initialization")
  ) {
    return "Sesiunea nu a putut fi inițializată. Autentifică-te din nou.";
  }

  if (
    normalized === "invalid_or_expired_link" ||
    normalized.includes("otp_expired") ||
    normalized.includes("expired") ||
    normalized.includes("invalid") ||
    normalized === "missing_token" ||
    normalized === "auth_confirmation_failed" ||
    normalized === "password_reset_failed"
  ) {
    return "Linkul este invalid, expirat sau a fost deja utilizat.";
  }

  if (normalized === "password_updated") {
    return "Parola a fost actualizată. Autentifică-te cu noua parolă.";
  }

  if (normalized === "account_suspended") {
    return "Contul este suspendat. Contactează suportul.";
  }

  if (normalized === "auth_not_configured" || normalized === "supabase_not_configured") {
    return "Autentificarea nu este configurată în acest mediu.";
  }

  if (normalized === "missing_auth_code" || normalized === "missing_code") {
    return "Linkul de autentificare este incomplet. Solicită unul nou.";
  }

  // Never surface raw Supabase codes to end users.
  return "Nu am putut finaliza autentificarea. Încearcă din nou.";
}

export function mapAuthQueryMessage(code: string | null | undefined): string | null {
  if (!code) return null;
  const normalized = decodeURIComponent(code).toLowerCase();
  if (normalized === "password_updated") {
    return "Parola a fost actualizată. Autentifică-te cu noua parolă.";
  }
  if (normalized === "email_confirmed") {
    return "Emailul a fost confirmat. Poți continua configurarea contului.";
  }
  return null;
}
