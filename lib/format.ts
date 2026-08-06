const DEFAULT_TIMEZONE = "Europe/Bucharest";

export function formatCurrency(
  amount: number,
  currency: string = "RON",
  locale: string = "ro-RO",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(
  value: string | Date,
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  },
  timeZone: string = DEFAULT_TIMEZONE,
): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ro-RO", { ...options, timeZone }).format(date);
}

export function formatDateTime(
  value: string | Date,
  timeZone: string = DEFAULT_TIMEZONE,
): string {
  return formatDate(
    value,
    {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
    timeZone,
  );
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const cleaned = trimmed.replace(/[^\d+]/g, "");
  return cleaned || null;
}
