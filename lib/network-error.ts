/** User-facing message for connectivity / failed fetch failures. */
export const CONNECTION_ERROR_MESSAGE =
  "Conexiunea cu serverul nu a putut fi realizată. Verifică configurația și încearcă din nou.";

export function isNetworkError(error: unknown): boolean {
  if (!error) return false;
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error
        ? String((error as { message: unknown }).message)
        : String(error);

  const normalized = message.toLowerCase();
  return (
    normalized.includes("networkerror") ||
    normalized.includes("failed to fetch") ||
    normalized.includes("network request failed") ||
    normalized.includes("load failed") ||
    normalized.includes("fetch failed")
  );
}

export function logRequestFailure(input: {
  operation: string;
  url?: string | null;
  error: unknown;
}) {
  if (process.env.NODE_ENV !== "development") return;

  const message =
    input.error instanceof Error ? input.error.message : String(input.error);

  console.error("Request failed", {
    operation: input.operation,
    url: input.url ?? undefined,
    message,
  });
}

export function toUserFacingRequestError(error: unknown, fallback?: string): string {
  if (isNetworkError(error)) return CONNECTION_ERROR_MESSAGE;
  if (error instanceof Error && error.message.trim()) {
    // Never surface raw SQL / internal RPC details in UI.
    if (/digest\(|function .* does not exist|42883|42P01/i.test(error.message)) {
      return "Serviciul de date nu este disponibil momentan. Verifică dacă migrațiile Supabase sunt aplicate.";
    }
  }
  return fallback ?? CONNECTION_ERROR_MESSAGE;
}
