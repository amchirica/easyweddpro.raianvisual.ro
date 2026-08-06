export type ContractServiceItem = {
  name: string;
  description?: string | null;
  quantity: number;
  unitPrice: number;
  discount?: number;
  lineTotal: number;
};

export type ContractInstallment = {
  label: string;
  amount: number;
  dueDate?: string | null;
};

export type CustomContractSection = {
  id: string;
  title: string;
  content: string;
  sortOrder: number;
  isRequired?: boolean;
};

export type ContractSections = {
  introduction?: string;
  object?: string;
  products?: string;
  schedule?: string;
  access_logistics?: string;
  transport?: string;
  setup_teardown?: string;
  payments?: string;
  deposit_terms?: string;
  installments_terms?: string;
  reschedule?: string;
  liability?: string;
  provider_obligations: string;
  client_obligations: string;
  delivery: string;
  cancellation: string;
  force_majeure: string;
  copyright: string;
  privacy: string;
  special_clauses: string;
  notes?: string;
};

export const CONTRACT_SECTION_KEYS = [
  "introduction",
  "object",
  "provider_obligations",
  "client_obligations",
  "products",
  "schedule",
  "access_logistics",
  "transport",
  "setup_teardown",
  "delivery",
  "payments",
  "deposit_terms",
  "installments_terms",
  "cancellation",
  "reschedule",
  "force_majeure",
  "liability",
  "copyright",
  "privacy",
  "special_clauses",
  "notes",
] as const satisfies ReadonlyArray<keyof ContractSections>;

export const REQUIRED_CONTRACT_SECTION_KEYS = [
  "provider_obligations",
  "client_obligations",
  "cancellation",
  "force_majeure",
  "privacy",
] as const satisfies ReadonlyArray<keyof ContractSections>;

export type ContractParty = {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  fiscalCode?: string | null;
  regCom?: string | null;
};

export type ContractContent = {
  provider: ContractParty;
  client: ContractParty;
  services: ContractServiceItem[];
  installments?: ContractInstallment[];
  sections: ContractSections;
  customSections?: CustomContractSection[];
  eventLocation?: string | null;
};

export type ContractSnapshot = {
  source?: string;
  proposal_id?: string | null;
  proposal_number?: string | null;
  proposal_accepted_at?: string | null;
  provider: ContractParty;
  client: ContractParty;
  items: ContractServiceItem[];
  installments?: ContractInstallment[];
  sections: ContractSections;
  currency: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total: number;
  deposit_amount: number;
  remaining_amount: number;
  event_date?: string | null;
  event_location?: string | null;
  terms?: string | null;
  title: string;
  contract_number?: string | null;
  version: number;
  contract_content_hash?: string | null;
};

export const DEFAULT_CONTRACT_SECTIONS: ContractSections = {
  introduction: "",
  object: "Obiectul prezentului contract îl reprezintă prestarea serviciilor descrise mai jos.",
  products: "",
  schedule: "",
  access_logistics: "",
  transport: "",
  setup_teardown: "",
  payments: "",
  deposit_terms: "",
  installments_terms: "",
  reschedule: "",
  liability: "",
  provider_obligations:
    "Furnizorul va presta serviciile și/sau va livra produsele descrise în prezentul contract, conform programului agreat.",
  client_obligations:
    "Clientul va respecta termenele de plată, accesul, logistica și programul agreat pentru eveniment.",
  delivery:
    "Livrarea serviciilor, produselor sau materialelor se face conform termenilor și calendarului agreat.",
  cancellation: "Anularea și reprogramarea se fac conform clauzelor din termeni.",
  force_majeure: "Cazurile de forță majoră suspendă obligațiile pe durata evenimentului.",
  copyright:
    "Drepturile de autor și drepturile conexe, acolo unde se aplică, rămân ale furnizorului, cu licența de utilizare acordată clientului conform clauzelor speciale.",
  privacy: "Datele personale sunt prelucrate conform politicii de confidențialitate.",
  special_clauses: "",
  notes: "",
};

function parseCustomSections(raw: unknown): CustomContractSection[] {
  if (!Array.isArray(raw)) return [];
  const sections: CustomContractSection[] = [];
  for (const [index, item] of raw.entries()) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const id = typeof row.id === "string" && row.id ? row.id : `custom_${index}`;
    const title = typeof row.title === "string" ? row.title : "";
    const content = typeof row.content === "string" ? row.content : "";
    const sortOrder =
      typeof row.sortOrder === "number" && Number.isFinite(row.sortOrder) ? row.sortOrder : index;
    if (!title.trim() && !content.trim()) continue;
    sections.push({
      id,
      title,
      content,
      sortOrder,
      isRequired: Boolean(row.isRequired),
    });
  }
  return sections.sort((a, b) => a.sortOrder - b.sortOrder);
}

export function parseContractContent(raw: unknown): ContractContent | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const sections = (obj.sections as ContractSections | undefined) ?? DEFAULT_CONTRACT_SECTIONS;
  return {
    provider: (obj.provider as ContractParty) ?? { name: "" },
    client: (obj.client as ContractParty) ?? { name: "" },
    services: Array.isArray(obj.services) ? (obj.services as ContractServiceItem[]) : [],
    installments: Array.isArray(obj.installments)
      ? (obj.installments as ContractInstallment[])
      : [],
    sections: { ...DEFAULT_CONTRACT_SECTIONS, ...sections },
    customSections: parseCustomSections(obj.customSections),
    eventLocation: (obj.eventLocation as string | null | undefined) ?? null,
  };
}
