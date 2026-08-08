/**
 * Finish contracts editor, public view, notice + add missing keys.
 * Then wire high-priority CRM dialogs in a follow-up script.
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
      console.warn("MISS", file, JSON.stringify(from).slice(0, 100));
      continue;
    }
    text = text.split(from).join(to);
    n += 1;
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
    console.warn("NO HOOK", file, marker.slice(0, 60));
    return;
  }
  text = text.replace(marker, marker + "\n  const { t } = useI18n();");
  fs.writeFileSync(file, text);
  console.log("hook", file);
}

mergeKeys("ro", "modules", {
  contracts: {
    createdLabel: "Creat",
    publishedLabel: "Publicat",
    viewedLabel: "Vizualizat",
    acceptedLabel: "Acceptat",
    privacyKeyNote: "For editor privacy section use privacy_gdpr in display",
  },
});
mergeKeys("en", "modules", {
  contracts: {
    createdLabel: "Created",
    publishedLabel: "Published",
    viewedLabel: "Viewed",
    acceptedLabel: "Accepted",
  },
});

// ---- contract-editor: replace SECTION_LABELS ----
{
  let text = fs.readFileSync("components/contracts/contract-editor.tsx", "utf8");
  text = text.replace(
    /const SECTION_LABELS: Record<\(typeof CONTRACT_SECTION_KEYS\)\[number\], string> = \{[\s\S]*?\};/,
    "/* section labels via t(`modules.contracts.sections.*`) */",
  );
  text = text.replaceAll("{SECTION_LABELS[key]}", '{t(`modules.contracts.sections.${key === "privacy" ? "privacy_gdpr" : key}`)}');
  text = text.replace(
    'title: "Secțiune personalizată",',
    'title: "", // set via t when adding',
  );
  fs.writeFileSync("components/contracts/contract-editor.tsx", text);
}

patch("components/contracts/contract-editor.tsx", [
  [
    "setCustomSections((prev) => [...prev, createCustomSection(prev.length)])",
    'setCustomSections((prev) => [...prev, { ...createCustomSection(prev.length), title: t("modules.contracts.customSection") }])',
  ],
  [
    "title: section.title.trim() || `Secțiune ${index + 1}`,",
    'title: section.title.trim() || t("modules.contracts.sectionN", { n: index + 1 }),',
  ],
  [
    '<Label htmlFor="contract-event-location">Locație eveniment</Label>',
    '<Label htmlFor="contract-event-location">{t("modules.contracts.eventLocation")}</Label>',
  ],
  [
    '<Label htmlFor="contract-valid-until">Acceptare până la</Label>',
    '<Label htmlFor="contract-valid-until">{t("modules.contracts.acceptUntil")}</Label>',
  ],
  [
    '<Label className="text-xs text-muted-soft">Preț unitar</Label>',
    '<Label className="text-xs text-muted-soft">{t("modules.contracts.unitPrice")}</Label>',
  ],
  ['aria-label="Șterge linie"', 'aria-label={t("modules.contracts.deleteLine")}'],
  [
    "Rest de plată: {formatCurrency(moneyPreview.remainingAmount, initial.currency)}",
    '{t("modules.contracts.remainingPayment", { amount: formatCurrency(moneyPreview.remainingAmount, initial.currency) })}',
  ],
  [
    `Secțiuni personalizate
`,
    `{t("modules.contracts.customSections")}
`,
  ],
  [
    `Adaugă secțiune
`,
    `{t("modules.contracts.addSection")}
`,
  ],
  [
    ">Nicio secțiune personalizată încă.<",
    '>{t("modules.contracts.noCustomSections")}<',
  ],
  [
    "<Label htmlFor={`custom-title-${section.id}`}>Titlu secțiune</Label>",
    '<Label htmlFor={`custom-title-${section.id}`}>{t("modules.contracts.sectionTitle")}</Label>',
  ],
  ['aria-label="Mută în sus"', 'aria-label={t("modules.contracts.moveUp")}'],
  ['aria-label="Mută în jos"', 'aria-label={t("modules.contracts.moveDown")}'],
  ['aria-label="Șterge secțiune"', 'aria-label={t("modules.contracts.deleteSection")}'],
  [
    '{saving ? "Se salvează…" : "Salvează draft"}',
    '{saving ? t("common.saving") : t("modules.contracts.saveDraft")}',
  ],
  [
    "<Label htmlFor={`${prefix}-address`}>Adresă</Label>",
    '<Label htmlFor={`${prefix}-address`}>{t("common.address")}</Label>',
  ],
]);
ensureHook("components/contracts/contract-editor.tsx", "export function ContractEditor({ contractId, initial, canWrite, onSaved }: ContractEditorProps) {");

// More editor labels that may remain - common ones
{
  let text = fs.readFileSync("components/contracts/contract-editor.tsx", "utf8");
  const extra = [
    ['>Titlu contract<', '>{t("common.title")}<'],
    ['>Data evenimentului<', '>{t("modules.contracts.event")}<'],
    ['>Termeni generali<', '>{t("modules.contracts.generalTerms")}<'],
    ['>Furnizor<', '>{t("modules.contracts.providerFallback")}<'],
    ['>Client<', '>{t("common.client")}<'],
    ['>Servicii<', '>{t("modules.contracts.services")}<'],
    ['>Denumire<', '>{t("modules.proposals.itemName")}<'],
    ['>Cantitate<', '>{t("modules.proposals.qty")}<'],
    ['>Total linie<', '>{t("modules.proposals.lineTotal")}<'],
    ['>Avans (deposit)<', '>{t("modules.contracts.deposit")}<'],
    ['>Subtotal<', '>{t("common.subtotal")}<'],
    ['>Discount<', '>{t("modules.proposals.discount")}<'],
    ['>Taxe<', '>{t("modules.contracts.taxes")}<'],
    ['>Total<', '>{t("modules.proposals.total")}<'],
    ['Adaugă serviciu', '{t("modules.contracts.addService")}'],
    ['Clauze contract', '{t("modules.contracts.clauses")}'],
  ];
  for (const [from, to] of extra) {
    if (text.includes(from)) text = text.split(from).join(to);
  }
  fs.writeFileSync("components/contracts/contract-editor.tsx", text);
}

mergeKeys("ro", "modules", {
  contracts: { addService: "Adaugă serviciu", clauses: "Clauze contract" },
});
mergeKeys("en", "modules", {
  contracts: { addService: "Add service", clauses: "Contract clauses" },
});

// ---- non-editable notice ----
patch("components/contracts/contract-non-editable-notice.tsx", [
  [
    `Acest contract nu mai poate fi editat direct. Creează o versiune nouă pentru
        modificări.`,
    '{t("modules.contracts.nonEditable")}',
  ],
  [
    '{busy ? "Se creează…" : "Creează versiune nouă"}',
    '{busy ? t("common.creating") : t("modules.contracts.createNewVersion")}',
  ],
  [
    'toast(result?.success ?? "Versiune nouă creată.", "success");',
    'toast(result?.success ?? t("modules.contracts.versionCreated"), "success");',
  ],
]);
ensureHook(
  "components/contracts/contract-non-editable-notice.tsx",
  "}: ContractNonEditableNoticeProps) {",
);

// ---- public-contract-view ----
{
  let text = fs.readFileSync("components/contracts/public-contract-view.tsx", "utf8");
  text = text.replace(
    /const SECTION_LABELS: Partial<Record<keyof ContractSections, string>> = \{[\s\S]*?\};/,
    `const SECTION_KEYS = [
  "introduction","object","provider_obligations","client_obligations","products","schedule",
  "access_logistics","transport","setup_teardown","delivery","payments","deposit_terms",
  "installments_terms","cancellation","reschedule","force_majeure","liability","copyright",
  "privacy","special_clauses","notes",
] as const;`,
  );
  text = text.replace(
    "{(Object.keys(SECTION_LABELS) as Array<keyof ContractSections>).map((key) => {",
    "{(SECTION_KEYS as readonly (keyof ContractSections)[]).map((key) => {",
  );
  text = text.replace("{SECTION_LABELS[key]}", '{t(`modules.contracts.sections.${key}`)}');
  fs.writeFileSync("components/contracts/public-contract-view.tsx", text);
}

patch("components/contracts/public-contract-view.tsx", [
  ['setFormError("Introdu numele tău complet.");', 'setFormError(t("modules.contracts.enterFullName"));'],
  [
    'setFormError("Introdu o adresă de email validă.");',
    'setFormError(t("modules.contracts.enterValidEmail"));',
  ],
  [
    'setFormError("Trebuie să accepți termenii contractului.");',
    'setFormError(t("modules.contracts.mustAcceptTerms"));',
  ],
  [
    'setFormError("Trebuie să accepți politica de confidențialitate.");',
    'setFormError(t("modules.contracts.mustAcceptPrivacy"));',
  ],
  [
    ">Se încarcă contractul…<",
    '>{t("modules.contracts.loadingContract")}<',
  ],
  [
    "Pagină demonstrativă — acceptarea ta nu este salvată.",
    '{t("modules.contracts.demoPage")}',
  ],
  [
    'Între {data.providerName ?? "Furnizor"} și {data.clientName ?? "Client"}',
    '{t("modules.contracts.betweenParties", { provider: data.providerName ?? t("modules.contracts.providerFallback"), client: data.clientName ?? t("common.client") })}',
  ],
  [">Valoare totală<", '>{t("common.totalValue")}<'],
  [
    `Avans {formatCurrency(data.depositAmount, data.currency)} · Rest{" "}
                {formatCurrency(data.remainingAmount, data.currency)}`,
    `{t("modules.contracts.depositRemaining", { deposit: formatCurrency(data.depositAmount, data.currency), remaining: formatCurrency(data.remainingAmount, data.currency) })}`,
  ],
  [">Eveniment<", '>{t("modules.contracts.event")}<'],
  [
    '{data.eventDate ? formatDate(data.eventDate) : "De stabilit"}',
    '{data.eventDate ? formatDate(data.eventDate) : t("modules.contracts.toBeSet")}',
  ],
  [
    "Acceptare disponibilă până la {formatDate(data.validUntil)}.",
    '{t("modules.contracts.acceptUntilDate", { date: formatDate(data.validUntil) })}',
  ],
  [
    `Servicii contractate
            </p>`,
    `{t("modules.contracts.contractedServices")}
            </p>`,
  ],
  [">Serviciu<", '>{t("modules.contracts.service")}<'],
  [">Cant.<", '>{t("modules.proposals.qtyShort")}<'],
  [">Preț unitar<", '>{t("modules.contracts.unitPrice")}<'],
  [">Total<", '>{t("modules.proposals.total")}<'],
  [">Subtotal<", '>{t("common.subtotal")}<'],
  [">Discount<", '>{t("modules.proposals.discount")}<'],
  [">Taxe<", '>{t("modules.contracts.taxes")}<'],
  [
    `Termeni generali
                </p>`,
    `{t("modules.contracts.generalTerms")}
                </p>`,
  ],
  [
    `Descarcă PDF
            </Button>`,
    `{t("modules.contracts.downloadPdf")}
            </Button>`,
  ],
  [">Contract acceptat digital.<", '>{t("modules.contracts.acceptedDigital")}<'],
  [
    "Acest contract a fost anulat de furnizor.",
    '{t("modules.contracts.cancelledByProvider")}',
  ],
  [
    ">Termenul de acceptare a expirat.<",
    '>{t("modules.contracts.acceptExpired")}<',
  ],
  [
    "Această versiune a fost înlocuită de un contract nou.",
    '{t("modules.contracts.supersededNotice")}',
  ],
  [
    "Completează datele tale pentru a accepta digital acest contract.",
    '{t("modules.contracts.acceptFormIntro")}',
  ],
  [">Nume complet<", '>{t("portal.fullName")}<'],
  [
    'placeholder="Numele tău complet"',
    'placeholder={t("modules.contracts.fullNamePlaceholder")}',
  ],
  [
    "Am citit și sunt de acord cu termenii și clauzele acestui contract.",
    '{t("modules.contracts.acceptTermsCheckbox")}',
  ],
  [
    "Am citit și accept politica de confidențialitate privind prelucrarea datelor.",
    '{t("modules.contracts.acceptPrivacyCheckbox")}',
  ],
  [
    `Acceptarea digitală înregistrează identitatea declarată, data și informațiile tehnice
                ale sesiunii. Nu reprezintă o semnătură electronică calificată în sensul eIDAS.`,
    `{t("modules.contracts.digitalAcceptNote")}`,
  ],
  [
    '{submitting ? "Se trimite…" : "Accept contractul"}',
    '{submitting ? t("portal.sending") : t("modules.contracts.acceptContract")}',
  ],
  [
    `Publicat de {data.providerName ?? "EasyWedd Pro"}
          {data.publishedAt ? \` · \${formatDateTime(data.publishedAt)}\` : ""}`,
    `{t("modules.contracts.publishedBy", { provider: data.providerName ?? "EasyWedd Pro" })}{data.publishedAt ? \` · \${formatDateTime(data.publishedAt)}\` : ""}`,
  ],
]);
ensureHook("components/contracts/public-contract-view.tsx", "export function PublicContractView(");

// Fix hook placement for public view - may need better marker
{
  let text = fs.readFileSync("components/contracts/public-contract-view.tsx", "utf8");
  if (!text.includes("const { t } = useI18n()")) {
    // find component body
    const m = text.match(/export function PublicContractView\([^)]*\) \{/);
    if (m) {
      text = text.replace(m[0], m[0] + "\n  const { t } = useI18n();");
      fs.writeFileSync("components/contracts/public-contract-view.tsx", text);
      console.log("hook public-contract forced");
    }
  }
}

console.log("contracts rest done");
