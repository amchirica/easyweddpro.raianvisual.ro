/**
 * Wire proposals + contracts remaining RO strings to t()/useI18n().
 */
import fs from "node:fs";

function patch(file, reps) {
  let text = fs.readFileSync(file, "utf8");
  let n = 0;
  for (const [from, to] of reps) {
    if (!text.includes(from)) {
      console.warn("MISS", file, from.slice(0, 80));
      continue;
    }
    const c = text.split(from).length - 1;
    text = text.split(from).join(to);
    n += c;
  }
  // Ensure useI18n import + hook for client components
  if (text.includes('t("') || text.includes("t(`")) {
    if (!text.includes('useI18n')) {
      if (text.includes('"use client"')) {
        text = text.replace(
          '"use client";\n',
          '"use client";\n\nimport { useI18n } from "@/components/providers/i18n-provider";\n',
        );
      }
    }
    // Insert hook if missing in exported function components that use t(
    // Handled per-file below when needed
  }
  fs.writeFileSync(file, text);
  console.log("patched", file, n);
  return text;
}

function ensureHook(file, afterPatterns) {
  let text = fs.readFileSync(file, "utf8");
  if (text.includes("const { t } = useI18n()") || text.includes("const { t, locale } = useI18n()")) {
    return;
  }
  for (const pat of afterPatterns) {
    if (text.includes(pat)) {
      text = text.replace(pat, pat + '\n  const { t } = useI18n();');
      fs.writeFileSync(file, text);
      console.log("hook", file);
      return;
    }
  }
  console.warn("NO HOOK INSERT", file);
}

function mergeKeys(loc, ns, keys) {
  const p = `messages/${loc}/${ns}.json`;
  const m = JSON.parse(fs.readFileSync(p, "utf8"));
  function deepAssign(target, source) {
    for (const [k, v] of Object.entries(source)) {
      if (v && typeof v === "object" && !Array.isArray(v)) {
        if (!target[k] || typeof target[k] !== "object") target[k] = {};
        deepAssign(target[k], v);
      } else {
        target[k] = v;
      }
    }
  }
  deepAssign(m, keys);
  fs.writeFileSync(p, JSON.stringify(m, null, 2) + "\n");
}

const proposalsRo = {
  proposals: {
    backToList: "Înapoi la oferte",
    noNumber: "Fără număr",
    noRecipient: "Fără destinatar",
    noRecipientLinked: "Fără destinatar asociat",
    published: "Ofertă publicată.",
    duplicated: "Ofertă duplicată.",
    cancelled: "Ofertă anulată.",
    deleted: "Ofertă ștearsă.",
    contractCreated: "Contract creat.",
    linkCopyFailed: "Nu am putut copia linkul.",
    needAccountPublish: "Publicarea ofertelor necesită un cont conectat.",
    needAccountDuplicate: "Duplicarea ofertelor necesită un cont conectat.",
    needAccountCancel: "Anularea ofertelor necesită un cont conectat.",
    needAccountDelete: "Ștergerea ofertelor necesită un cont conectat.",
    needAccountConvert: "Conversia în contract necesită un cont conectat.",
    needAccountEdit: "Editarea ofertelor necesită un cont conectat.",
    duplicating: "Se duplică…",
    converting: "Se convertește…",
    convertToContract: "Convertește în contract",
    viewContract: "Vezi contract",
    open: "Deschide",
    recipient: "Destinatar",
    viewClient: "Vezi client",
    viewLead: "Vezi lead",
    validity: "Valabilitate",
    noDeadline: "Fără termen limită",
    createdAt: "Creată {date}",
    totalValue: "Valoare totală",
    subtotalLabel: "Subtotal {amount}",
    items: "Items ofertă",
    discount: "Discount",
    tax: "TVA ({rate}%)",
    taxShort: "TVA",
    total: "Total",
    terms: "Termeni și condiții",
    internalNotes: "Notițe interne",
    cancelTitle: "Anulezi această ofertă?",
    cancelConfirm: "Oferta va fi marcată drept anulată și nu va mai putea fi acceptată de client.",
    cancelProposal: "Anulează oferta",
    deleteTitle: "Ștergi această ofertă?",
    deleteProposal: "Șterge oferta",
    deleting: "Se șterge…",
    formTitle: "Titlu ofertă",
    titlePlaceholder: "Pachet Full Service",
    selectClient: "Selectează clientul",
    selectLead: "Selectează leadul",
    noClientsYet: "Niciun client disponibil încă.",
    noLeadsYet: "Niciun lead disponibil încă.",
    discountType: "Tip discount",
    noDiscount: "Fără discount",
    percentDiscount: "Procent (%)",
    fixedDiscount: "Sumă fixă",
    discountValue: "Valoare discount",
    taxRate: "TVA (%)",
    termsPlaceholder: "Condiții de plată, politică de anulare…",
    notesPlaceholder: "Vizibile doar echipei tale…",
    summary: "Rezumat",
    totalProposal: "Total ofertă",
    createProposal: "Creează ofertă",
    createShort: "Creează",
    noPermissionSave: "Nu ai permisiunea de a salva oferte.",
    noPermissionEdit:
      "Nu ai permisiunea de a edita această ofertă. Poți vizualiza datele, dar salvarea este dezactivată.",
    saveFailed: "Oferta nu a putut fi salvată. Verifică datele și încearcă din nou.",
    created: "Ofertă creată.",
    updated: "Ofertă actualizată.",
    addItem: "Adaugă item",
    itemName: "Denumire",
    itemNamePlaceholder: "Serviciu foto",
    qty: "Cantitate",
    unit: "Unitate",
    unitPrice: "Preț unitar",
    lineDiscount: "Discount linie",
    lineTotal: "Total linie",
    removeItem: "Șterge item",
    itemDescription: "Descriere",
    itemDescriptionPlaceholder: "Detalii opționale…",
  },
};

const proposalsEn = {
  proposals: {
    backToList: "Back to proposals",
    noNumber: "No number",
    noRecipient: "No recipient",
    noRecipientLinked: "No linked recipient",
    published: "Proposal published.",
    duplicated: "Proposal duplicated.",
    cancelled: "Proposal cancelled.",
    deleted: "Proposal deleted.",
    contractCreated: "Contract created.",
    linkCopyFailed: "Could not copy the link.",
    needAccountPublish: "Publishing proposals requires a signed-in account.",
    needAccountDuplicate: "Duplicating proposals requires a signed-in account.",
    needAccountCancel: "Cancelling proposals requires a signed-in account.",
    needAccountDelete: "Deleting proposals requires a signed-in account.",
    needAccountConvert: "Converting to a contract requires a signed-in account.",
    needAccountEdit: "Editing proposals requires a signed-in account.",
    duplicating: "Duplicating…",
    converting: "Converting…",
    convertToContract: "Convert to contract",
    viewContract: "View contract",
    open: "Open",
    recipient: "Recipient",
    viewClient: "View client",
    viewLead: "View lead",
    validity: "Validity",
    noDeadline: "No deadline",
    createdAt: "Created {date}",
    totalValue: "Total value",
    subtotalLabel: "Subtotal {amount}",
    items: "Proposal items",
    discount: "Discount",
    tax: "VAT ({rate}%)",
    taxShort: "VAT",
    total: "Total",
    terms: "Terms and conditions",
    internalNotes: "Internal notes",
    cancelTitle: "Cancel this proposal?",
    cancelConfirm: "The proposal will be marked as cancelled and can no longer be accepted by the client.",
    cancelProposal: "Cancel proposal",
    deleteTitle: "Delete this proposal?",
    deleteProposal: "Delete proposal",
    deleting: "Deleting…",
    formTitle: "Proposal title",
    titlePlaceholder: "Full Service package",
    selectClient: "Select client",
    selectLead: "Select lead",
    noClientsYet: "No clients available yet.",
    noLeadsYet: "No leads available yet.",
    discountType: "Discount type",
    noDiscount: "No discount",
    percentDiscount: "Percent (%)",
    fixedDiscount: "Fixed amount",
    discountValue: "Discount value",
    taxRate: "VAT (%)",
    termsPlaceholder: "Payment terms, cancellation policy…",
    notesPlaceholder: "Visible only to your team…",
    summary: "Summary",
    totalProposal: "Proposal total",
    createProposal: "Create proposal",
    createShort: "Create",
    noPermissionSave: "You don't have permission to save proposals.",
    noPermissionEdit:
      "You don't have permission to edit this proposal. You can view the data, but saving is disabled.",
    saveFailed: "The proposal could not be saved. Check the data and try again.",
    created: "Proposal created.",
    updated: "Proposal updated.",
    addItem: "Add item",
    itemName: "Name",
    itemNamePlaceholder: "Photo service",
    qty: "Quantity",
    unit: "Unit",
    unitPrice: "Unit price",
    lineDiscount: "Line discount",
    lineTotal: "Line total",
    removeItem: "Remove item",
    itemDescription: "Description",
    itemDescriptionPlaceholder: "Optional details…",
  },
};

const commonRoExtra = {
  open: "Deschide",
  lead: "Lead",
  subtotal: "Subtotal",
  generating: "Se generează…",
  accepting: "Se acceptă…",
  rejecting: "Se refuză…",
  address: "Adresă",
};

const commonEnExtra = {
  open: "Open",
  lead: "Lead",
  subtotal: "Subtotal",
  generating: "Generating…",
  accepting: "Accepting…",
  rejecting: "Rejecting…",
  address: "Address",
};

const contractsRoExtra = {
  contracts: {
    backToList: "Înapoi la contracte",
    draftHint: "Contractul este în draft. Poți modifica liber clauzele și conținutul, apoi salvează.",
    publishHintAfter:
      "Clientul va primi un link public pentru vizualizare și acceptare digitală. După publicare, conținutul nu mai poate fi editat liber.",
    unresolvedVars: "{vars}. Publicarea poate eșua până le completezi.",
    createProject: "Creează proiect",
    clientPortal: "Portal client",
    sectionProviderObligations: "Obligațiile furnizorului",
    sectionClientObligations: "Obligațiile clientului",
    sectionAccessLogistics: "Acces și logistică",
    sectionSetupTeardown: "Montaj și demontaj",
    sectionPayments: "Plăți",
    sectionInstallments: "Tranșe",
    sectionForceMajeure: "Forță majoră",
    sectionLiability: "Răspundere",
    sectionPrivacy: "Protecția datelor",
    sectionPrivacyGdpr: "Protecția datelor (GDPR)",
    sectionNotes: "Observații",
    customSection: "Secțiune personalizată",
    sectionN: "Secțiune {n}",
    eventLocation: "Locație eveniment",
    acceptUntil: "Acceptare până la",
    deleteLine: "Șterge linie",
    remainingPayment: "Rest de plată: {amount}",
    customSections: "Secțiuni personalizate",
    addSection: "Adaugă secțiune",
    sectionTitle: "Titlu secțiune",
    moveUp: "Mută în sus",
    moveDown: "Mută în jos",
    deleteSection: "Șterge secțiune",
    saveDraft: "Salvează draft",
    nonEditable:
      "Acest contract nu mai poate fi editat direct. Creează o versiune nouă pentru modificări.",
    createNewVersion: "Creează versiune nouă",
    needAccountProjects: "Crearea proiectelor necesită un cont conectat.",
    enterFullName: "Introdu numele tău complet.",
    enterValidEmail: "Introdu o adresă de email validă.",
    mustAcceptTerms: "Trebuie să accepți termenii contractului.",
    mustAcceptPrivacy: "Trebuie să accepți politica de confidențialitate.",
    demoPage: "Pagină demonstrativă — acceptarea ta nu este salvată.",
    betweenParties: "Între {provider} și {client}",
    providerFallback: "Furnizor",
    acceptUntilDate: "Acceptare disponibilă până la {date}.",
    downloadPdf: "Descarcă PDF",
    supersededNotice: "Această versiune a fost înlocuită de un contract nou.",
    acceptFormIntro: "Completează datele tale pentru a accepta digital acest contract.",
    fullNamePlaceholder: "Numele tău complet",
    acceptTermsCheckbox: "Am citit și sunt de acord cu termenii și clauzele acestui contract.",
    acceptPrivacyCheckbox:
      "Am citit și accept politica de confidențialitate privind prelucrarea datelor.",
    digitalAcceptNote:
      "Acceptarea digitală înregistrează identitatea declarată, data și informațiile tehnice ale sesiunii. Nu reprezintă o semnătură electronică calificată în sensul eIDAS.",
  },
};

const contractsEnExtra = {
  contracts: {
    backToList: "Back to contracts",
    draftHint: "This contract is a draft. You can freely edit clauses and content, then save.",
    publishHintAfter:
      "The client will get a public link to view and accept digitally. After publishing, content can no longer be freely edited.",
    unresolvedVars: "{vars}. Publishing may fail until you fill them in.",
    createProject: "Create project",
    clientPortal: "Client portal",
    sectionProviderObligations: "Provider obligations",
    sectionClientObligations: "Client obligations",
    sectionAccessLogistics: "Access and logistics",
    sectionSetupTeardown: "Setup and teardown",
    sectionPayments: "Payments",
    sectionInstallments: "Installments",
    sectionForceMajeure: "Force majeure",
    sectionLiability: "Liability",
    sectionPrivacy: "Data protection",
    sectionPrivacyGdpr: "Data protection (GDPR)",
    sectionNotes: "Notes",
    customSection: "Custom section",
    sectionN: "Section {n}",
    eventLocation: "Event location",
    acceptUntil: "Accept until",
    deleteLine: "Delete line",
    remainingPayment: "Remaining: {amount}",
    customSections: "Custom sections",
    addSection: "Add section",
    sectionTitle: "Section title",
    moveUp: "Move up",
    moveDown: "Move down",
    deleteSection: "Delete section",
    saveDraft: "Save draft",
    nonEditable:
      "This contract can no longer be edited directly. Create a new version for changes.",
    createNewVersion: "Create new version",
    needAccountProjects: "Creating projects requires a signed-in account.",
    enterFullName: "Enter your full name.",
    enterValidEmail: "Enter a valid email address.",
    mustAcceptTerms: "You must accept the contract terms.",
    mustAcceptPrivacy: "You must accept the privacy policy.",
    demoPage: "Demo page — your acceptance is not saved.",
    betweenParties: "Between {provider} and {client}",
    providerFallback: "Provider",
    acceptUntilDate: "Acceptance available until {date}.",
    downloadPdf: "Download PDF",
    supersededNotice: "This version was replaced by a new contract.",
    acceptFormIntro: "Fill in your details to digitally accept this contract.",
    fullNamePlaceholder: "Your full name",
    acceptTermsCheckbox: "I have read and agree to the terms and clauses of this contract.",
    acceptPrivacyCheckbox: "I have read and accept the privacy policy regarding data processing.",
    digitalAcceptNote:
      "Digital acceptance records the declared identity, date, and technical session information. It is not a qualified electronic signature under eIDAS.",
  },
};

mergeKeys("ro", "modules", proposalsRo);
mergeKeys("en", "modules", proposalsEn);
mergeKeys("ro", "modules", contractsRoExtra);
mergeKeys("en", "modules", contractsEnExtra);
mergeKeys("ro", "common", commonRoExtra);
mergeKeys("en", "common", commonEnExtra);

// ---- proposal-detail ----
patch("components/proposals/proposal-detail.tsx", [
  [
    'if (!requireLive("Publicarea ofertelor necesită un cont conectat.")) return;',
    'if (!requireLive(t("modules.proposals.needAccountPublish"))) return;',
  ],
  [
    'toast(result?.success ?? "Ofertă publicată.", "success");',
    'toast(result?.success ?? t("modules.proposals.published"), "success");',
  ],
  [
    'toast("Link copiat în clipboard.", "success");',
    'toast(t("common.linkCopied"), "success");',
  ],
  [
    'toast("Nu am putut copia linkul.", "error");',
    'toast(t("modules.proposals.linkCopyFailed"), "error");',
  ],
  [
    'if (!requireLive("Duplicarea ofertelor necesită un cont conectat.")) return;',
    'if (!requireLive(t("modules.proposals.needAccountDuplicate"))) return;',
  ],
  [
    'toast(result?.success ?? "Ofertă duplicată.", "success");',
    'toast(result?.success ?? t("modules.proposals.duplicated"), "success");',
  ],
  [
    'if (!requireLive("Anularea ofertelor necesită un cont conectat.")) {',
    'if (!requireLive(t("modules.proposals.needAccountCancel"))) {',
  ],
  [
    'toast(result?.success ?? "Ofertă anulată.", "success");',
    'toast(result?.success ?? t("modules.proposals.cancelled"), "success");',
  ],
  [
    'if (!requireLive("Ștergerea ofertelor necesită un cont conectat.")) {',
    'if (!requireLive(t("modules.proposals.needAccountDelete"))) {',
  ],
  [
    'toast(result?.success ?? "Ofertă ștearsă.", "success");',
    'toast(result?.success ?? t("modules.proposals.deleted"), "success");',
  ],
  [
    'if (!requireLive("Conversia în contract necesită un cont conectat.")) return;',
    'if (!requireLive(t("modules.proposals.needAccountConvert"))) return;',
  ],
  [
    'toast(result?.success ?? "Contract creat.", "success");',
    'toast(result?.success ?? t("modules.proposals.contractCreated"), "success");',
  ],
  [
    'if (!requireLive("Editarea ofertelor necesită un cont conectat.")) return;',
    'if (!requireLive(t("modules.proposals.needAccountEdit"))) return;',
  ],
  ["Înapoi la oferte", '{t("modules.proposals.backToList")}'],
  [
    "label={PROPOSAL_STATUS_LABELS[proposal.effectiveStatus]}",
    'label={t(`status.proposal.${proposal.effectiveStatus}`)}',
  ],
  [
    '{proposal.proposalNumber ?? "Fără număr"} · {proposal.clientName ?? proposal.leadName ?? "Fără destinatar"}',
    '{proposal.proposalNumber ?? t("modules.proposals.noNumber")} · {proposal.clientName ?? proposal.leadName ?? t("modules.proposals.noRecipient")}',
  ],
  [">Editează<", '>{t("common.edit")}<'],
  [
    '{publishing ? "Se publică…" : "Publică"}',
    '{publishing ? t("common.publishing") : t("common.publish")}',
  ],
  [">Copiază link<", '>{t("common.copyLink")}<'],
  [
    '{duplicating ? "Se duplică…" : "Duplică"}',
    '{duplicating ? t("modules.proposals.duplicating") : t("common.duplicate")}',
  ],
  [
    '{converting ? "Se convertește…" : "Convertește în contract"}',
    '{converting ? t("modules.proposals.converting") : t("modules.proposals.convertToContract")}',
  ],
  [">Vezi contract<", '>{t("modules.proposals.viewContract")}<'],
  [">Anulează<", '>{t("common.cancel")}<'],
  [">Șterge<", '>{t("common.delete")}<'],
  [">Link public<", '>{t("modules.proposals.publicLink")}<'],
  [
    `Deschide
            <ExternalLink`,
    `{t("common.open")}
            <ExternalLink`,
  ],
  [">Destinatar<", '>{t("modules.proposals.recipient")}<'],
  ['{proposal.clientName ?? "Vezi client"}', '{proposal.clientName ?? t("modules.proposals.viewClient")}'],
  ['{proposal.leadName ?? "Vezi lead"}', '{proposal.leadName ?? t("modules.proposals.viewLead")}'],
  [">Fără destinatar asociat<", '>{t("modules.proposals.noRecipientLinked")}<'],
  [">Valabilitate<", '>{t("modules.proposals.validity")}<'],
  [
    '{proposal.validUntil ? formatDate(proposal.validUntil) : "Fără termen limită"}',
    '{proposal.validUntil ? formatDate(proposal.validUntil) : t("modules.proposals.noDeadline")}',
  ],
  [
    "Creată {formatDateTime(proposal.createdAt)}",
    '{t("modules.proposals.createdAt", { date: formatDateTime(proposal.createdAt) })}',
  ],
  [">Valoare totală<", '>{t("modules.proposals.totalValue")}<'],
  [
    "Subtotal {formatCurrency(proposal.subtotal, proposal.currency)}",
    '{t("modules.proposals.subtotalLabel", { amount: formatCurrency(proposal.subtotal, proposal.currency) })}',
  ],
  [">Items ofertă<", '>{t("modules.proposals.items")}<'],
  [
    'title="Niciun item" description="Această ofertă nu are items adăugate."',
    'title={t("modules.proposals.noItems")} description={t("modules.proposals.noItemsHint")}',
  ],
  [">Subtotal<", '>{t("common.subtotal")}<'],
  [">Discount<", '>{t("modules.proposals.discount")}<'],
  [
    ">TVA ({proposal.taxRate}%)<",
    '>{t("modules.proposals.tax", { rate: proposal.taxRate })}<',
  ],
  [">Total<", '>{t("modules.proposals.total")}<'],
  [">Termeni și condiții<", '>{t("modules.proposals.terms")}<'],
  [">Notițe interne<", '>{t("modules.proposals.internalNotes")}<'],
  [">Anulezi această ofertă?<", '>{t("modules.proposals.cancelTitle")}<'],
  [
    ">Oferta va fi marcată drept anulată și nu va mai putea fi acceptată de client.<",
    '>{t("modules.proposals.cancelConfirm")}<',
  ],
  [">Renunță<", '>{t("common.dismiss")}<'],
  [
    '{cancelling ? "Se anulează…" : "Anulează oferta"}',
    '{cancelling ? t("common.cancelling") : t("modules.proposals.cancelProposal")}',
  ],
  [">Ștergi această ofertă?<", '>{t("modules.proposals.deleteTitle")}<'],
  [
    ">Această acțiune nu poate fi anulată.<",
    '>{t("common.cannotUndo")}<',
  ],
  [
    '{deleting ? "Se șterge…" : "Șterge oferta"}',
    '{deleting ? t("modules.proposals.deleting") : t("modules.proposals.deleteProposal")}',
  ],
]);

ensureHook("components/proposals/proposal-detail.tsx", [
  "}: ProposalDetailProps) {",
]);

// Remove unused PROPOSAL_STATUS_LABELS import if still present
{
  let text = fs.readFileSync("components/proposals/proposal-detail.tsx", "utf8");
  if (!text.includes("PROPOSAL_STATUS_LABELS[")) {
    text = text.replace(
      /import \{ PROPOSAL_STATUS_LABELS, type ProposalStatus \} from "@\/lib\/constants";/,
      'import { type ProposalStatus } from "@/lib/constants";',
    );
    fs.writeFileSync("components/proposals/proposal-detail.tsx", text);
  }
}

// ---- proposal-form ----
patch("components/proposals/proposal-form.tsx", [
  [
    'toast("Nu ai permisiunea de a salva oferte.", "error");',
    'toast(t("modules.proposals.noPermissionSave"), "error");',
  ],
  [
    'setFormError("Verifică datele completate.");',
    'setFormError(t("common.verifyData"));',
  ],
  [
    'result.error || "Oferta nu a putut fi salvată. Verifică datele și încearcă din nou.";',
    'result.error || t("modules.proposals.saveFailed");',
  ],
  [
    'toast(result?.success ?? (mode === "create" ? "Ofertă creată." : "Ofertă actualizată."), "success");',
    'toast(result?.success ?? (mode === "create" ? t("modules.proposals.created") : t("modules.proposals.updated")), "success");',
  ],
  [
    'const message = "Oferta nu a putut fi salvată. Verifică datele și încearcă din nou.";',
    'const message = t("modules.proposals.saveFailed");',
  ],
  [
    "Nu ai permisiunea de a edita această ofertă. Poți vizualiza datele, dar salvarea este dezactivată.",
    '{t("modules.proposals.noPermissionEdit")}',
  ],
  [">Titlu ofertă<", '>{t("modules.proposals.formTitle")}<'],
  [
    'placeholder="Pachet Full Service"',
    'placeholder={t("modules.proposals.titlePlaceholder")}',
  ],
  [">Destinatar<", '>{t("modules.proposals.recipient")}<'],
  [
    `>
                Client
              </Button>`,
    `>
                {t("common.client")}
              </Button>`,
  ],
  [
    `>
                Lead
              </Button>`,
    `>
                {t("common.lead")}
              </Button>`,
  ],
  ['<Label htmlFor="proposal-client">Client</Label>', '<Label htmlFor="proposal-client">{t("common.client")}</Label>'],
  [
    'placeholder="Selectează clientul"',
    'placeholder={t("modules.proposals.selectClient")}',
  ],
  [
    ">Niciun client disponibil încă.<",
    '>{t("modules.proposals.noClientsYet")}<',
  ],
  ['<Label htmlFor="proposal-lead">Lead</Label>', '<Label htmlFor="proposal-lead">{t("common.lead")}</Label>'],
  [
    'placeholder="Selectează leadul"',
    'placeholder={t("modules.proposals.selectLead")}',
  ],
  [
    ">Niciun lead disponibil încă.<",
    '>{t("modules.proposals.noLeadsYet")}<',
  ],
  ['<Label htmlFor="proposal-currency">Monedă</Label>', '<Label htmlFor="proposal-currency">{t("common.currency")}</Label>'],
  [
    '<Label htmlFor="proposal-validUntil">Valabilă până la</Label>',
    '<Label htmlFor="proposal-validUntil">{t("modules.proposals.validUntil")}</Label>',
  ],
  [">Items ofertă<", '>{t("modules.proposals.items")}<'],
  [
    '<Label htmlFor="proposal-discountType">Tip discount</Label>',
    '<Label htmlFor="proposal-discountType">{t("modules.proposals.discountType")}</Label>',
  ],
  [">Fără discount<", '>{t("modules.proposals.noDiscount")}<'],
  [">Procent (%)<", '>{t("modules.proposals.percentDiscount")}<'],
  [">Sumă fixă<", '>{t("modules.proposals.fixedDiscount")}<'],
  [
    '<Label htmlFor="proposal-discountValue">Valoare discount</Label>',
    '<Label htmlFor="proposal-discountValue">{t("modules.proposals.discountValue")}</Label>',
  ],
  [
    '<Label htmlFor="proposal-taxRate">TVA (%)</Label>',
    '<Label htmlFor="proposal-taxRate">{t("modules.proposals.taxRate")}</Label>',
  ],
  [
    '<Label htmlFor="proposal-terms">Termeni și condiții</Label>',
    '<Label htmlFor="proposal-terms">{t("modules.proposals.terms")}</Label>',
  ],
  [
    'placeholder="Condiții de plată, politică de anulare…"',
    'placeholder={t("modules.proposals.termsPlaceholder")}',
  ],
  [
    '<Label htmlFor="proposal-notes">Notițe interne</Label>',
    '<Label htmlFor="proposal-notes">{t("modules.proposals.internalNotes")}</Label>',
  ],
  [
    'placeholder="Vizibile doar echipei tale…"',
    'placeholder={t("modules.proposals.notesPlaceholder")}',
  ],
  [">Anulează<", '>{t("common.cancel")}<'],
  [
    '{submitting ? "Se salvează…" : mode === "create" ? "Creează ofertă" : "Salvează modificările"}',
    '{submitting ? t("common.saving") : mode === "create" ? t("modules.proposals.createProposal") : t("common.saveChanges")}',
  ],
  [">Rezumat<", '>{t("modules.proposals.summary")}<'],
  [">Subtotal<", '>{t("common.subtotal")}<'],
  [">Discount<", '>{t("modules.proposals.discount")}<'],
  [">TVA<", '>{t("modules.proposals.taxShort")}<'],
  [">Total<", '>{t("modules.proposals.total")}<'],
  [">Total ofertă<", '>{t("modules.proposals.totalProposal")}<'],
  [
    '{submitting ? "Se salvează…" : mode === "create" ? "Creează" : "Salvează"}',
    '{submitting ? t("common.saving") : mode === "create" ? t("modules.proposals.createShort") : t("common.save")}',
  ],
]);

ensureHook("components/proposals/proposal-form.tsx", ["}: ProposalFormProps) {"]);

console.log("proposals done");
