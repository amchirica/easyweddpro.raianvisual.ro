/**
 * Wire portal page thoroughly.
 */
import fs from "node:fs";

const file = "app/portal/[token]/page.tsx";
let text = fs.readFileSync(file, "utf8");

if (!text.includes('from "@/lib/i18n/t"')) {
  text = text.replace(
    'import { createClient } from "@/lib/supabase/server";\n',
    'import { createClient } from "@/lib/supabase/server";\nimport { getTranslator } from "@/lib/i18n/t";\n',
  );
}

text = text.replace(
  /const SECTIONS = \[[\s\S]*?\];/,
  `const SECTION_DEFS = [
  { id: "overview", labelKey: "portal.overviewShort", icon: FileText },
  { id: "offer", labelKey: "portal.proposal", icon: FileText },
  { id: "contract", labelKey: "portal.contract", icon: ScrollText },
  { id: "payments", labelKey: "portal.payments", icon: CircleDollarSign },
  { id: "event", labelKey: "portal.event", icon: CalendarDays },
  { id: "contact", labelKey: "portal.contact", icon: Mail },
] as const;`,
);

text = text.replace(
  /function paymentStatusLabel\(status: string\): string \{[\s\S]*?\n\}/,
  `function paymentStatusLabel(status: string, t: (k: string) => string): string {
  const key = \`status.payment.\${status}\`;
  const label = t(key);
  return label === key ? status : label;
}`,
);
text = text.replace(
  /function projectStatusLabel\(status: string\): string \{[\s\S]*?\n\}/,
  `function projectStatusLabel(status: string, t: (k: string) => string): string {
  const key = \`status.project.\${status}\`;
  const label = t(key);
  return label === key ? status : label;
}`,
);
text = text.replace(
  /function proposalStatusLabel\(status: string\): string \{[\s\S]*?\n\}/,
  `function proposalStatusLabel(status: string, t: (k: string) => string): string {
  const key = \`status.proposal.\${status}\`;
  const label = t(key);
  return label === key ? status : label;
}`,
);
text = text.replace(
  /function contractStatusLabel\(status: string\): string \{[\s\S]*?\n\}/,
  `function contractStatusLabel(status: string, t: (k: string) => string): string {
  const key = \`status.contract.\${status}\`;
  const label = t(key);
  return label === key ? status : label;
}`,
);

// Add t to PortalLayoutProps
if (!text.includes("t: (key: string")) {
  text = text.replace(
    "type PortalLayoutProps = {\n  clientName: string;",
    `type PortalLayoutProps = {
  t: (key: string, params?: Record<string, string | number>) => string;
  clientName: string;`,
  );
  text = text.replace(
    `function PortalLayout({
  clientName,
  overview,
  offer,
  contract,
  project,
  payments,
  event,
  contact,
}: PortalLayoutProps) {`,
    `function PortalLayout({
  t,
  clientName,
  overview,
  offer,
  contract,
  project,
  payments,
  event,
  contact,
}: PortalLayoutProps) {`,
  );
}

const uiReps = [
  ["Bine ai venit,", '{t("portal.welcome")},'],
  [
    "Portalul tău personal — oferta, contractul și detaliile evenimentului, într-un singur loc.",
    '{t("portal.personalIntro")}',
  ],
  [">Prezentare generală<", '>{t("portal.overview")}<'],
  [">Ofertă<", '>{t("portal.proposal")}<'],
  [">Contract<", '>{t("portal.contract")}<'],
  [">Plăți<", '>{t("portal.payments")}<'],
  [">Eveniment<", '>{t("portal.event")}<'],
  [">Contact<", '>{t("portal.contact")}<'],
  [
    "Valabilă până la {formatDate(offer.validUntil)}",
    '{t("portal.validUntil")} {formatDate(offer.validUntil)}',
  ],
  [">Nu există ofertă asociată momentan.<", '>{t("portal.noOffer")}<'],
  ["Descarcă PDF contract", '{t("portal.downloadPdf")}'],
  [
    "PDF-ul contractului va fi disponibil după publicarea linkului de către furnizor.",
    '{t("portal.pdfAfterPublish")}',
  ],
  [
    "Contractul va apărea aici imediat după acceptarea ofertei.",
    '{t("portal.contractAfterAccept")}',
  ],
  [
    "Nu există încă un plan de plăți asociat.",
    '{t("portal.noPaymentPlan")}',
  ],
  [
    '{payment.dueDate ? `Scadent la ${formatDate(payment.dueDate)}` : "Fără scadență"}',
    '{payment.dueDate ? t("portal.dueOn", { date: formatDate(payment.dueDate) }) : t("portal.noDue")}',
  ],
  [
    `Pentru întrebări despre ofertă, contract sau eveniment, contactează direct echipa
            studioului.`,
    `{t("portal.contactTeam", { name: contact.providerName || "EasyWedd Pro" })}`,
  ],
  [">Portal indisponibil<", '>{t("portal.unavailable")}<'],
  [
    `Conexiunea cu serverul nu a putut fi realizată. Verifică configurația și încearcă din
            nou.`,
    `{t("portal.connectionFailed")}`,
  ],
  ['rpcError = error instanceof Error ? error.message : "Eroare portal.";', 'rpcError = error instanceof Error ? error.message : t("portal.error");'],
];

for (const [from, to] of uiReps) {
  if (!text.includes(from)) {
    console.warn("MISS", JSON.stringify(from).slice(0, 90));
    continue;
  }
  text = text.split(from).join(to);
}

text = text.replaceAll("SECTIONS.map", "SECTION_DEFS.map");
text = text.replace(/\{section\.label\}/g, "{t(section.labelKey)}");

// PortalPage: get t and pass it
if (!text.includes("const { t } = await getTranslator()")) {
  text = text.replace(
    "export default async function PortalPage({ params }: PortalPageProps) {\n  const { token } = await params;",
    `export default async function PortalPage({ params }: PortalPageProps) {
  const { token } = await params;
  const { t } = await getTranslator();`,
  );
}

text = text.replace(
  "<PortalLayout\n          clientName={portal.client.name}",
  "<PortalLayout\n          t={t}\n          clientName={portal.client.name}",
);

text = text.replaceAll(
  "statusLabel: proposalStatusLabel(proposalStatus)",
  "statusLabel: proposalStatusLabel(proposalStatus, t)",
);
text = text.replaceAll(
  "statusLabel: contractStatusLabel(contractStatus)",
  "statusLabel: contractStatusLabel(contractStatus, t)",
);
text = text.replace(
  /statusLabel: paymentStatusLabel\(([^)]+)\)/g,
  "statusLabel: paymentStatusLabel($1, t)",
);
text = text.replace(
  /statusLabel: projectStatusLabel\(([^)]+)\)/g,
  "statusLabel: projectStatusLabel($1, t)",
);

// Remove unused STATUS_LABELS imports if no longer used
if (
  !text.includes("PROPOSAL_STATUS_LABELS[") &&
  !text.includes("CONTRACT_STATUS_LABELS[") &&
  !text.includes("PAYMENT_STATUS_LABELS[") &&
  !text.includes("PROJECT_STATUS_LABELS[")
) {
  text = text.replace(
    /import \{\n  CONTRACT_STATUS_LABELS,\n  PAYMENT_STATUS_LABELS,\n  PROJECT_STATUS_LABELS,\n  PROPOSAL_STATUS_LABELS,\n  type ContractStatus,\n  type PaymentStatus,\n  type ProjectStatus,\n  type ProposalStatus,\n\} from "@\/lib\/constants";/,
    `import {
  type ContractStatus,
  type PaymentStatus,
  type ProjectStatus,
  type ProposalStatus,
} from "@/lib/constants";`,
  );
}

fs.writeFileSync(file, text);
console.log("portal done");
