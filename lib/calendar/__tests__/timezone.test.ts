import { describe, expect, it } from "vitest";

import {
  CALENDAR_DEFAULT_TIMEZONE,
  dateKeyInTimeZone,
  formatEventDay,
  formatEventRange,
  formatEventTime,
  isEndAfterStart,
} from "@/lib/calendar/timezone";

describe("CALENDAR_DEFAULT_TIMEZONE", () => {
  it("defaults to Europe/Bucharest", () => {
    expect(CALENDAR_DEFAULT_TIMEZONE).toBe("Europe/Bucharest");
  });
});

describe("isEndAfterStart", () => {
  it("accepts an end equal to the start", () => {
    expect(isEndAfterStart("2026-08-05T10:00:00.000Z", "2026-08-05T10:00:00.000Z")).toBe(true);
  });

  it("accepts an end after the start", () => {
    expect(isEndAfterStart("2026-08-05T10:00:00.000Z", "2026-08-05T12:00:00.000Z")).toBe(true);
  });

  it("rejects an end before the start", () => {
    expect(isEndAfterStart("2026-08-05T12:00:00.000Z", "2026-08-05T10:00:00.000Z")).toBe(false);
  });

  it("rejects invalid dates", () => {
    expect(isEndAfterStart("not-a-date", "2026-08-05T10:00:00.000Z")).toBe(false);
    expect(isEndAfterStart("2026-08-05T10:00:00.000Z", "not-a-date")).toBe(false);
  });
});

describe("dateKeyInTimeZone", () => {
  it("buckets an instant into the correct local day", () => {
    // 22:30 UTC on Aug 5 is already Aug 6 in Europe/Bucharest (UTC+3 in summer).
    expect(dateKeyInTimeZone("2026-08-05T22:30:00.000Z", "Europe/Bucharest")).toBe("2026-08-06");
  });

  it("returns an empty string for invalid input", () => {
    expect(dateKeyInTimeZone("not-a-date")).toBe("");
  });
});

describe("formatEventTime / formatEventDay", () => {
  it("formats a valid instant", () => {
    expect(formatEventTime("2026-08-05T10:00:00.000Z")).toMatch(/\d{2}:\d{2}/);
    expect(formatEventDay("2026-08-05T10:00:00.000Z")).toContain("2026");
  });

  it("falls back to a placeholder for invalid input", () => {
    expect(formatEventTime("invalid")).toBe("—");
    expect(formatEventDay("invalid")).toBe("—");
  });
});

describe("formatEventRange", () => {
  it("formats a same-day range with a single day label", () => {
    const result = formatEventRange("2026-08-05T10:00:00.000Z", "2026-08-05T12:00:00.000Z");
    expect(result).toContain("–");
    expect(result.match(/2026/g)?.length).toBe(1);
  });

  it("formats a multi-day range with two day labels", () => {
    const result = formatEventRange("2026-08-05T22:00:00.000Z", "2026-08-07T10:00:00.000Z");
    expect(result.match(/2026/g)?.length).toBe(2);
  });

  it("formats all-day ranges without times", () => {
    const result = formatEventRange("2026-08-05T00:00:00.000Z", "2026-08-05T00:00:00.000Z", {
      allDay: true,
    });
    expect(result).toContain("toată ziua");
    expect(result).not.toMatch(/\d{2}:\d{2}/);
  });

  it("returns a placeholder for invalid input", () => {
    expect(formatEventRange("invalid", "2026-08-05T10:00:00.000Z")).toBe("—");
  });
});
