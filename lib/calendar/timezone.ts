/**
 * Pure, framework-free date helpers for the calendar module.
 * Kept dependency-free (no supabase / next imports) so they stay trivially testable.
 */

export const CALENDAR_DEFAULT_TIMEZONE = "Europe/Bucharest";

function toValidDate(value: string | Date): Date | null {
  const date = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Ends must be the same instant as, or after, starts. Invalid dates are never valid. */
export function isEndAfterStart(startsAt: string, endsAt: string): boolean {
  const start = toValidDate(startsAt);
  const end = toValidDate(endsAt);
  if (!start || !end) return false;
  return end.getTime() >= start.getTime();
}

export function formatEventTime(
  value: string | Date,
  timeZone: string = CALENDAR_DEFAULT_TIMEZONE,
): string {
  const date = toValidDate(value);
  if (!date) return "—";
  return new Intl.DateTimeFormat("ro-RO", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(date);
}

export function formatEventDay(
  value: string | Date,
  timeZone: string = CALENDAR_DEFAULT_TIMEZONE,
): string {
  const date = toValidDate(value);
  if (!date) return "—";
  return new Intl.DateTimeFormat("ro-RO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone,
  }).format(date);
}

/** Stable YYYY-MM-DD bucket key for a given instant, in the target timezone. */
export function dateKeyInTimeZone(
  value: string | Date,
  timeZone: string = CALENDAR_DEFAULT_TIMEZONE,
): string {
  const date = toValidDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(date);
}

export function formatEventRange(
  startsAt: string,
  endsAt: string,
  options?: { allDay?: boolean; timeZone?: string },
): string {
  const timeZone = options?.timeZone ?? CALENDAR_DEFAULT_TIMEZONE;
  const start = toValidDate(startsAt);
  const end = toValidDate(endsAt);
  if (!start || !end) return "—";

  if (options?.allDay) {
    const startDay = formatEventDay(start, timeZone);
    const endDay = formatEventDay(end, timeZone);
    return startDay === endDay ? `${startDay} · toată ziua` : `${startDay} – ${endDay} · toată ziua`;
  }

  const sameDay = dateKeyInTimeZone(start, timeZone) === dateKeyInTimeZone(end, timeZone);

  if (sameDay) {
    return `${formatEventDay(start, timeZone)} · ${formatEventTime(start, timeZone)} – ${formatEventTime(end, timeZone)}`;
  }

  return `${formatEventDay(start, timeZone)} ${formatEventTime(start, timeZone)} – ${formatEventDay(end, timeZone)} ${formatEventTime(end, timeZone)}`;
}
