export type ProposalUnitDefinition = {
  code: string;
  label: string;
  shortDescription: string;
};

export const PROPOSAL_UNITS: ProposalUnitDefinition[] = [
  { code: "service", label: "Serviciu", shortDescription: "Linie de tip serviciu." },
  { code: "hour", label: "Oră", shortDescription: "Tarif orar." },
  { code: "day", label: "Zi", shortDescription: "Tarif pe zi." },
  { code: "person", label: "Persoană", shortDescription: "Tarif per persoană." },
  { code: "piece", label: "Bucată", shortDescription: "Unitate pe bucată." },
  { code: "set", label: "Set", shortDescription: "Set sau pachet de elemente." },
  { code: "km", label: "Km", shortDescription: "Distanță sau transport." },
  { code: "package", label: "Pachet", shortDescription: "Pachet de servicii." },
  { code: "event", label: "Eveniment", shortDescription: "Tarif pe eveniment." },
];

export const PROPOSAL_UNIT_CODES = PROPOSAL_UNITS.map((item) => item.code);

export const PROPOSAL_UNIT_LABELS = Object.fromEntries(
  PROPOSAL_UNITS.map((item) => [item.code, item.label]),
) as Record<string, string>;

export const DEFAULT_PROPOSAL_UNITS = [
  "service",
  "hour",
  "day",
  "person",
  "piece",
  "package",
  "event",
] as const;
