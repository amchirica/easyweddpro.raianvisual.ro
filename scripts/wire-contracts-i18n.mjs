/**
 * Wire contracts components to t()/useI18n().
 */
import fs from "node:fs";

function mergeKeys(loc, ns, keys) {
  const p = `messages/${loc}/${ns}.json`;
  const m = JSON.parse(fs.readFileSync(p, "utf8"));
  function deepAssign(target, source) {
    for (const [k, v] of Object.entries(source)) {
      if (v && typeof v === "object" && !Array.isArray(v)) {
        if (!target[k] || typeof target[k] !== "object") target[k] = {};
        deepAssign(target[k], v);
      } else target[k] = v;
    }
  }
  deepAssign(m, keys);
  fs.writeFileSync(p, JSON.stringify(m, null, 2) + "\n");
}

function patch(file, reps) {
  let text = fs.readFileSync(file, "utf8");
  let n = 0;
  for (const [from, to] of reps) {
    if (!text.includes(from)) {
      console.warn("MISS", file, JSON.stringify(from).slice(0, 90));
      continue;
    }
    const c = text.split(from).length - 1;
    text = text.split(from).join(to);
    n += c;
  }
  if ((text.includes('t("') || text.includes("t(`")) && !text.includes("useI18n")) {
    text = text.replace(
      '"use client";\n',
      '"use client";\n\nimport { useI18n } from "@/components/providers/i18n-provider";\n',
    );
  }
  fs.writeFileSync(file, text);
  console.log("patched", file, n);
}

function ensureHook(file, marker) {
  let text = fs.readFileSync(file, "utf8");
  if (text.includes("const { t } = useI18n()")) return;
  if (!text.includes(marker)) {
    console.warn("NO HOOK", file);
    return;
  }
  text = text.replace(marker, marker + "\n  const { t } = useI18n();");
  fs.writeFileSync(file, text);
  console.log("hook", file);
}

const sectionsRo = {
  introduction: "Introducere",
  object: "Obiectul contractului",
  provider_obligations: "Obligațiile furnizorului",
  client_obligations: "Obligațiile clientului",
  products: "Produse",
  schedule: "Program",
  access_logistics: "Acces și logistică",
  transport: "Transport",
  setup_teardown: "Montaj și demontaj",
  delivery: "Livrare",
  payments: "Plăți",
  deposit_terms: "Avans",
  installments_terms: "Tranșe",
  cancellation: "Anulare",
  reschedule: "Reprogramare",
  force_majeure: "Forță majoră",
  liability: "Răspundere",
  copyright: "Drepturi de autor",
  privacy: "Protecția datelor",
  privacy_gdpr: "Protecția datelor (GDPR)",
  special_clauses: "Clauze speciale",
  notes: "Observații",
};

const sectionsEn = {
  introduction: "Introduction",
  object: "Contract object",
  provider_obligations: "Provider obligations",
  client_obligations: "Client obligations",
  products: "Products",
  schedule: "Schedule",
  access_logistics: "Access and logistics",
  transport: "Transport",
  setup_teardown: "Setup and teardown",
  delivery: "Delivery",
  payments: "Payments",
  deposit_terms: "Deposit",
  installments_terms: "Installments",
  cancellation: "Cancellation",
  reschedule: "Reschedule",
  force_majeure: "Force majeure",
  liability: "Liability",
  copyright: "Copyright",
  privacy: "Data protection",
  privacy_gdpr: "Data protection (GDPR)",
  special_clauses: "Special clauses",
  notes: "Notes",
};

mergeKeys("ro", "modules", {
  contracts: {
    sections: sectionsRo,
    published: "Contract publicat.",
    duplicated: "Contract duplicat.",
    cancelledToast: "Contract anulat.",
    projectCreated: "Proiect creat.",
    noClientLinked: "Contractul nu are client asociat.",
    portalLinkGenerated: "Link portal generat.",
    linkCopyFailed: "Nu am putut copia linkul.",
    publicLink: "Link public contract",
    deposit: "Avans",
    remaining: "Rest",
    event: "Eveniment",
    fromAcceptedProposal: "Generat din ofertă acceptată.",
    viewProposal: "Vezi oferta {number}",
    unresolvedCritical:
      "Placeholder-uri critice nerezolvate: {vars}. Publicarea poate eșua până le completezi.",
    noNumber: "Fără număr",
    unitPrice: "Preț unitar",
    noCustomSections: "Nicio secțiune personalizată încă.",
    services: "Servicii",
    contractedServices: "Servicii contractate",
    service: "Serviciu",
    taxes: "Taxe",
    generalTerms: "Termeni generali",
    documentId: "ID document: {hash}…",
    acceptedDigital: "Contract acceptat digital.",
    cancelledByProvider: "Acest contract a fost anulat de furnizor.",
    acceptExpired: "Termenul de acceptare a expirat.",
    acceptContract: "Accept contractul",
    loadingContract: "Se încarcă contractul…",
    toBeSet: "De stabilit",
    depositRemaining: "Avans {deposit} · Rest {remaining}",
    publishedBy: "Publicat de {provider}",
    validUntilLabel: "Valabil până la",
  },
});

mergeKeys("en", "modules", {
  contracts: {
    sections: sectionsEn,
    published: "Contract published.",
    duplicated: "Contract duplicated.",
    cancelledToast: "Contract cancelled.",
    projectCreated: "Project created.",
    noClientLinked: "The contract has no linked client.",
    portalLinkGenerated: "Portal link generated.",
    linkCopyFailed: "Could not copy the link.",
    publicLink: "Public contract link",
    deposit: "Deposit",
    remaining: "Remaining",
    event: "Event",
    fromAcceptedProposal: "Generated from an accepted proposal.",
    viewProposal: "View proposal {number}",
    unresolvedCritical:
      "Unresolved critical placeholders: {vars}. Publishing may fail until you fill them in.",
    noNumber: "No number",
    unitPrice: "Unit price",
    noCustomSections: "No custom sections yet.",
    services: "Services",
    contractedServices: "Contracted services",
    service: "Service",
    taxes: "Taxes",
    generalTerms: "General terms",
    documentId: "Document ID: {hash}…",
    acceptedDigital: "Contract accepted digitally.",
    cancelledByProvider: "This contract was cancelled by the provider.",
    acceptExpired: "The acceptance deadline has expired.",
    acceptContract: "Accept contract",
    loadingContract: "Loading contract…",
    toBeSet: "To be set",
    depositRemaining: "Deposit {deposit} · Remaining {remaining}",
    publishedBy: "Published by {provider}",
    validUntilLabel: "Valid until",
  },
});

// Replace SECTION_LABELS blocks with key maps (no RO display strings)
const sectionKeysBlock = `const SECTION_KEYS = [
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
] as const;`;

const sectionKeysBlockEditor = `const SECTION_KEYS = CONTRACT_SECTION_KEYS;`;

// ---- contract-detail ----
{
  let text = fs.readFileSync("components/contracts/contract-detail.tsx", "utf8");
  text = text.replace(
    /const SECTION_LABELS: Partial<Record<keyof ContractSections, string>> = \{[\s\S]*?\};/,
    sectionKeysBlock,
  );
  text = text.replace(
    "{(Object.keys(SECTION_LABELS) as Array<keyof ContractSections>).map((key) => {",
    "{(SECTION_KEYS as readonly (keyof ContractSections)[]).map((key) => {",
  );
  text = text.replace("{SECTION_LABELS[key]}", '{t(`modules.contracts.sections.${key}`)}');
  // ContractReadOnlyPreview may also use SECTION_LABELS - check after
  fs.writeFileSync("components/contracts/contract-detail.tsx", text);
}

patch("components/contracts/contract-detail.tsx", [
  [
    'if (!requireLive("Publicarea contractelor necesită un cont conectat.")) {',
    'if (!requireLive(t("modules.contracts.needAccountPublish"))) {',
  ],
  [
    'toast(result?.success ?? "Contract publicat.", "success");',
    'toast(result?.success ?? t("modules.contracts.published"), "success");',
  ],
  ['toast("Link copiat în clipboard.", "success");', 'toast(t("common.linkCopied"), "success");'],
  [
    'toast("Nu am putut copia linkul.", "error");',
    'toast(t("modules.contracts.linkCopyFailed"), "error");',
  ],
  [
    'if (!requireLive("Duplicarea contractelor necesită un cont conectat.")) return;',
    'if (!requireLive(t("modules.contracts.needAccountDuplicate"))) return;',
  ],
  [
    'toast(result?.success ?? "Contract duplicat.", "success");',
    'toast(result?.success ?? t("modules.contracts.duplicated"), "success");',
  ],
  [
    'if (!requireLive("Anularea contractelor necesită un cont conectat.")) {',
    'if (!requireLive(t("modules.contracts.needAccountCancel"))) {',
  ],
  [
    'toast(result?.success ?? "Contract anulat.", "success");',
    'toast(result?.success ?? t("modules.contracts.cancelledToast"), "success");',
  ],
  [
    'if (!requireLive("Versiunea nouă necesită un cont conectat.")) return;',
    'if (!requireLive(t("modules.contracts.needAccountVersion"))) return;',
  ],
  [
    'toast(result?.success ?? "Versiune nouă creată.", "success");',
    'toast(result?.success ?? t("modules.contracts.versionCreated"), "success");',
  ],
  [
    'if (!requireLive("Crearea proiectelor necesită un cont conectat.")) return;',
    'if (!requireLive(t("modules.contracts.needAccountProjects"))) return;',
  ],
  [
    'toast(result?.success ?? "Proiect creat.", "success");',
    'toast(result?.success ?? t("modules.contracts.projectCreated"), "success");',
  ],
  [
    'toast("Contractul nu are client asociat.", "error");',
    'toast(t("modules.contracts.noClientLinked"), "error");',
  ],
  [
    'if (!requireLive("Portalul client necesită un cont conectat.")) return;',
    'if (!requireLive(t("modules.contracts.needAccountPortal"))) return;',
  ],
  [
    'toast("Link portal copiat în clipboard.", "success");',
    'toast(t("modules.contracts.portalLinkCopied"), "success");',
  ],
  [
    'toast("Link portal generat.", "success");',
    'toast(t("modules.contracts.portalLinkGenerated"), "success");',
  ],
  ["Înapoi la contracte", '{t("modules.contracts.backToList")}'],
  [
    "label={CONTRACT_STATUS_LABELS[contract.effectiveStatus]}",
    'label={t(`status.contract.${contract.effectiveStatus}`)}',
  ],
  [
    '{contract.contractNumber ?? "Fără număr"} · {contract.clientName ?? "Fără client"}',
    '{contract.contractNumber ?? t("modules.contracts.noNumber")} · {contract.clientName ?? t("common.noClient")}',
  ],
  [
    `Editează draft
            </Button>`,
    `{t("modules.contracts.editDraft")}
            </Button>`,
  ],
  [
    `Publică
            </Button>`,
    `{t("common.publish")}
            </Button>`,
  ],
  [
    `Copiază link
            </Button>`,
    `{t("common.copyLink")}
            </Button>`,
  ],
  [
    '{duplicating ? "Se duplică…" : "Duplică"}',
    '{duplicating ? t("modules.proposals.duplicating") : t("common.duplicate")}',
  ],
  [
    '{versioning ? "Se creează…" : "Versiune nouă"}',
    '{versioning ? t("common.creating") : t("modules.contracts.newVersion")}',
  ],
  [
    `Anulează
            </Button>`,
    `{t("common.cancel")}
            </Button>`,
  ],
  [
    '{creatingProject ? "Se creează…" : "Creează proiect"}',
    '{creatingProject ? t("common.creating") : t("modules.contracts.createProject")}',
  ],
  [
    '{portalBusy ? "Se generează…" : "Portal client"}',
    '{portalBusy ? t("common.generating") : t("modules.contracts.clientPortal")}',
  ],
  [">Link public contract<", '>{t("modules.contracts.publicLink")}<'],
  [
    `Deschide
            <ExternalLink`,
    `{t("common.open")}
            <ExternalLink`,
  ],
  [">Total<", '>{t("modules.proposals.total")}<'],
  [">Avans<", '>{t("modules.contracts.deposit")}<'],
  [">Rest<", '>{t("modules.contracts.remaining")}<'],
  [">Eveniment<", '>{t("modules.contracts.event")}<'],
  [
    ">Generat din ofertă acceptată.<",
    '>{t("modules.contracts.fromAcceptedProposal")}<',
  ],
  [
    'Vezi oferta {contract.proposalNumber ? `· ${contract.proposalNumber}` : ""}',
    '{t("modules.contracts.viewProposal", { number: contract.proposalNumber ? `· ${contract.proposalNumber}` : "" })}',
  ],
  [
    "Contractul este în draft. Poți modifica liber clauzele și conținutul, apoi salvează.",
    '{t("modules.contracts.draftHint")}',
  ],
  [">Publici acest contract?<", '>{t("modules.contracts.publishTitle")}<'],
  [
    `Clientul va primi un link public pentru vizualizare și acceptare digitală. După
              publicare, conținutul nu mai poate fi editat liber.`,
    `{t("modules.contracts.publishHintAfter")}`,
  ],
  [
    `Placeholder-uri critice nerezolvate:{" "}
              {unresolvedCritical.map((v) => \`{{\${v}}}\`).join(", ")}. Publicarea poate eșua până le
              completezi.`,
    `{t("modules.contracts.unresolvedCritical", { vars: unresolvedCritical.map((v) => \`{{\${v}}}\`).join(", ") })}`,
  ],
  [
    `Renunță
            </Button>
            <Button type="button" onClick={handlePublish}`,
    `{t("common.dismiss")}
            </Button>
            <Button type="button" onClick={handlePublish}`,
  ],
  [
    '{publishing ? "Se publică…" : "Publică contract"}',
    '{publishing ? t("common.publishing") : t("modules.contracts.publishContract")}',
  ],
  [">Anulezi acest contract?<", '>{t("modules.contracts.cancelTitle")}<'],
  [
    "Contractul va fi marcat drept anulat și nu va mai putea fi acceptat de client.",
    '{t("modules.contracts.cancelConfirm")}',
  ],
  [
    `Renunță
            </Button>
            <Button type="button" variant="destructive" onClick={handleCancel}`,
    `{t("common.dismiss")}
            </Button>
            <Button type="button" variant="destructive" onClick={handleCancel}`,
  ],
  [
    '{cancelling ? "Se anulează…" : "Anulează contract"}',
    '{cancelling ? t("common.cancelling") : t("modules.contracts.cancelContract")}',
  ],
]);

ensureHook("components/contracts/contract-detail.tsx", "}: ContractDetailProps) {");

// Fix ContractReadOnlyPreview if it uses SECTION_LABELS / has RO
{
  let text = fs.readFileSync("components/contracts/contract-detail.tsx", "utf8");
  if (text.includes("SECTION_LABELS")) {
    text = text.replaceAll("SECTION_LABELS[key]", 't(`modules.contracts.sections.${key}`)');
    text = text.replaceAll(
      "(Object.keys(SECTION_LABELS) as Array<keyof ContractSections>)",
      "(SECTION_KEYS as readonly (keyof ContractSections)[])",
    );
  }
  // Valabil până la
  text = text.replace(
    ">Valabil până la<",
    '>{t("modules.contracts.validUntilLabel")}<',
  );
  // Remove unused CONTRACT_STATUS_LABELS import if unused
  if (!text.includes("CONTRACT_STATUS_LABELS[")) {
    text = text.replace(
      /import \{ CONTRACT_STATUS_LABELS, type ContractStatus \} from "@\/lib\/constants";/,
      'import { type ContractStatus } from "@/lib/constants";',
    );
  }
  // Nested ContractReadOnlyPreview needs its own useI18n
  if (text.includes("function ContractReadOnlyPreview") && !text.includes("ContractReadOnlyPreview")) {
    // always true - check hook inside
  }
  fs.writeFileSync("components/contracts/contract-detail.tsx", text);
}

// Ensure nested preview has hook
{
  let text = fs.readFileSync("components/contracts/contract-detail.tsx", "utf8");
  const marker = "function ContractReadOnlyPreview({ contract }: { contract: ContractDetailData }) {";
  if (text.includes(marker) && !text.split(marker)[1]?.slice(0, 80).includes("useI18n")) {
    text = text.replace(marker, marker + "\n  const { t } = useI18n();");
    fs.writeFileSync("components/contracts/contract-detail.tsx", text);
    console.log("hook nested preview");
  }
}

console.log("contract-detail done");
