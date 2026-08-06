export type EventTypeDefinition = {
  code: string;
  label: string;
  shortDescription: string;
};

export const EVENT_TYPES: EventTypeDefinition[] = [
  { code: "wedding", label: "Nuntă", shortDescription: "Ceremonie și recepție de nuntă." },
  { code: "civil_wedding", label: "Cununie civilă", shortDescription: "Cununie civilă și celebrare." },
  { code: "baptism", label: "Botez", shortDescription: "Botez și petrecere asociată." },
  { code: "anniversary", label: "Aniversare", shortDescription: "Aniversări private." },
  { code: "coming_of_age", label: "Majorat", shortDescription: "Petreceri de majorat." },
  { code: "private_party", label: "Petrecere privată", shortDescription: "Evenimente private diverse." },
  { code: "corporate", label: "Eveniment corporate", shortDescription: "Evenimente de firmă și team building." },
  { code: "conference", label: "Conferință", shortDescription: "Conferințe și evenimente profesionale." },
  { code: "launch", label: "Lansare", shortDescription: "Lansări de produs sau brand." },
  { code: "festival", label: "Festival", shortDescription: "Festivaluri și evenimente outdoor." },
  { code: "concert", label: "Concert", shortDescription: "Concerte și spectacole." },
  { code: "photo_session", label: "Ședință foto", shortDescription: "Ședințe foto dedicate." },
  { code: "video_production", label: "Producție video", shortDescription: "Producții video și filmări." },
  { code: "educational", label: "Eveniment educațional", shortDescription: "Workshop-uri și evenimente educaționale." },
  { code: "religious", label: "Eveniment religios", shortDescription: "Evenimente religioase." },
  { code: "other", label: "Altul", shortDescription: "Alt tip de eveniment." },
];

export const EVENT_TYPE_CODES = EVENT_TYPES.map((item) => item.code);

export const EVENT_TYPE_LABELS = Object.fromEntries(
  EVENT_TYPES.map((item) => [item.code, item.label]),
) as Record<string, string>;

export function getEventTypeLabel(codeOrLabel: string | null | undefined): string {
  if (!codeOrLabel) return "—";
  return EVENT_TYPE_LABELS[codeOrLabel] ?? codeOrLabel;
}

export function isKnownEventType(value: string): boolean {
  return EVENT_TYPE_CODES.includes(value);
}
