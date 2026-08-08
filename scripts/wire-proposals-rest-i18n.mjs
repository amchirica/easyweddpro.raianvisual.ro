/**
 * Wire proposal-items-editor, public-proposal-view, and remaining proposal keys.
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
      } else {
        target[k] = v;
      }
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
    const c = text.split(from).length - 1;
    text = text.split(from).join(to);
    n += c;
  }
  if ((text.includes('t("') || text.includes("t(`")) && !text.includes("useI18n")) {
    if (text.includes('"use client"')) {
      text = text.replace(
        '"use client";\n',
        '"use client";\n\nimport { useI18n } from "@/components/providers/i18n-provider";\n',
      );
    }
  }
  fs.writeFileSync(file, text);
  console.log("patched", file, n);
}

function ensureHook(file, marker) {
  let text = fs.readFileSync(file, "utf8");
  if (text.includes("const { t } = useI18n()")) return;
  if (!text.includes(marker)) {
    console.warn("NO HOOK MARKER", file);
    return;
  }
  text = text.replace(marker, marker + "\n  const { t } = useI18n();");
  fs.writeFileSync(file, text);
  console.log("hook", file);
}

mergeKeys("ro", "modules", {
  proposals: {
    nameAndDescription: "Denumire & descriere",
    qtyShort: "Cant.",
    itemNameLabel: "Denumire item",
    itemNamePh: "Ex: Serviciu principal / pachet / oră",
    itemDescPh: "Descriere (opțional) — transport, montaj, garanție…",
    computeError: "Verifică cantitățile și prețurile — trebuie să fie valori pozitive.",
  },
});
mergeKeys("en", "modules", {
  proposals: {
    nameAndDescription: "Name & description",
    qtyShort: "Qty",
    itemNameLabel: "Item name",
    itemNamePh: "E.g. Main service / package / hour",
    itemDescPh: "Description (optional) — travel, setup, warranty…",
    computeError: "Check quantities and prices — they must be positive values.",
  },
});

mergeKeys("ro", "portal", {
  demoPageProposal: "Pagină demonstrativă — răspunsul tău nu este salvat.",
  proposalFor: "Ofertă {number} pentru",
  proposalForPlain: "Ofertă pentru",
  noDeadline: "Fără termen",
  includes: "Ce include oferta",
  acceptedReady: "Ofertă acceptată — contractul este în pregătire.",
  youDeclined: "Ai refuzat această ofertă.",
  cancelledByProvider: "Această ofertă a fost anulată de furnizor.",
  expiredNotice: "Această ofertă a expirat.",
  rejectReason: "Motivul refuzului (opțional)",
  rejectReasonPh: "Spune-ne de ce refuzi oferta…",
  confirmReject: "Confirmă refuzul",
  sending: "Se trimite…",
  acceptFormIntro: "Completează datele tale pentru a accepta digital această ofertă.",
  fullName: "Nume complet",
  fullNamePh: "Numele tău complet",
  acceptTerms: "Am citit și sunt de acord cu termenii și condițiile acestei oferte.",
  declineProposal: "Refuz oferta",
  sentBy: "Trimisă de {provider} · {date}",
  enterFullName: "Introdu numele tău complet.",
  enterValidEmail: "Introdu o adresă de email validă.",
  mustAcceptTerms: "Trebuie să accepți condițiile ofertei.",
  acceptDemo: "Acceptare simulată — mod demo, nu este salvată.",
  rejectDemo: "Refuz simulat — mod demo, nu este salvat.",
  acceptedThanks: "Ofertă acceptată. Mulțumim!",
  rejectedThanks: "Oferta a fost refuzată.",
  totalValue: "Valoare totală",
  subtotal: "Subtotal",
  discount: "Discount",
  tax: "TVA",
  total: "Total",
  terms: "Termeni și condiții",
});

mergeKeys("en", "portal", {
  demoPageProposal: "Demo page — your response is not saved.",
  proposalFor: "Proposal {number} for",
  proposalForPlain: "Proposal for",
  noDeadline: "No deadline",
  includes: "What's included",
  acceptedReady: "Proposal accepted — the contract is being prepared.",
  youDeclined: "You declined this proposal.",
  cancelledByProvider: "This proposal was cancelled by the provider.",
  expiredNotice: "This proposal has expired.",
  rejectReason: "Decline reason (optional)",
  rejectReasonPh: "Tell us why you're declining…",
  confirmReject: "Confirm decline",
  sending: "Sending…",
  acceptFormIntro: "Fill in your details to digitally accept this proposal.",
  fullName: "Full name",
  fullNamePh: "Your full name",
  acceptTerms: "I have read and agree to the terms and conditions of this proposal.",
  declineProposal: "Decline proposal",
  sentBy: "Sent by {provider} · {date}",
  enterFullName: "Enter your full name.",
  enterValidEmail: "Enter a valid email address.",
  mustAcceptTerms: "You must accept the proposal terms.",
  acceptDemo: "Simulated acceptance — demo mode, not saved.",
  rejectDemo: "Simulated decline — demo mode, not saved.",
  acceptedThanks: "Proposal accepted. Thank you!",
  rejectedThanks: "The proposal was declined.",
  totalValue: "Total value",
  subtotal: "Subtotal",
  discount: "Discount",
  tax: "VAT",
  total: "Total",
  terms: "Terms and conditions",
});

patch("components/proposals/proposal-items-editor.tsx", [
  [
    'computeError: "Verifică cantitățile și prețurile — trebuie să fie valori pozitive.",',
    'computeError: t("modules.proposals.computeError"),',
  ],
  [">Denumire &amp; descriere<", '>{t("modules.proposals.nameAndDescription")}<'],
  [">Unitate<", '>{t("modules.proposals.unit")}<'],
  [">Cant.<", '>{t("modules.proposals.qtyShort")}<'],
  [">Preț unitar<", '>{t("modules.proposals.unitPrice")}<'],
  [">Discount<", '>{t("modules.proposals.discount")}<'],
  [
    '<span className="text-right">Total linie</span>',
    '<span className="text-right">{t("modules.proposals.lineTotal")}</span>',
  ],
  [
    `Denumire item
                  </Label>`,
    `{t("modules.proposals.itemNameLabel")}
                  </Label>`,
  ],
  [
    'placeholder="Ex: Serviciu principal / pachet / oră"',
    'placeholder={t("modules.proposals.itemNamePh")}',
  ],
  [
    'placeholder="Descriere (opțional) — transport, montaj, garanție…"',
    'placeholder={t("modules.proposals.itemDescPh")}',
  ],
  [
    `Unitate
                </Label>`,
    `{t("modules.proposals.unit")}
                </Label>`,
  ],
  [
    `Cantitate
                </Label>`,
    `{t("modules.proposals.qty")}
                </Label>`,
  ],
  [
    `Preț unitar
                </Label>`,
    `{t("modules.proposals.unitPrice")}
                </Label>`,
  ],
  [
    `Discount linie
                </Label>`,
    `{t("modules.proposals.lineDiscount")}
                </Label>`,
  ],
  [
    '<span className="text-xs text-muted-foreground sm:hidden">Total linie</span>',
    '<span className="text-xs text-muted-foreground sm:hidden">{t("modules.proposals.lineTotal")}</span>',
  ],
  ['aria-label="Șterge item"', 'aria-label={t("modules.proposals.removeItem")}'],
  [
    `Adaugă item
      </Button>`,
    `{t("modules.proposals.addItem")}
      </Button>`,
  ],
  [">Subtotal<", '>{t("common.subtotal")}<'],
  [">TVA<", '>{t("modules.proposals.taxShort")}<'],
  [">Total ofertă<", '>{t("modules.proposals.totalProposal")}<'],
]);
ensureHook("components/proposals/proposal-items-editor.tsx", "}: ProposalItemsEditorProps) {");

patch("components/proposals/public-proposal-view.tsx", [
  ['setFormError("Introdu numele tău complet.");', 'setFormError(t("portal.enterFullName"));'],
  [
    'setFormError("Introdu o adresă de email validă.");',
    'setFormError(t("portal.enterValidEmail"));',
  ],
  [
    'setFormError("Trebuie să accepți condițiile ofertei.");',
    'setFormError(t("portal.mustAcceptTerms"));',
  ],
  [
    'toast("Acceptare simulată — mod demo, nu este salvată.", "info");',
    'toast(t("portal.acceptDemo"), "info");',
  ],
  [
    'toast(result?.success ?? "Ofertă acceptată. Mulțumim!", "success");',
    'toast(result?.success ?? t("portal.acceptedThanks"), "success");',
  ],
  [
    'toast("Refuz simulat — mod demo, nu este salvat.", "info");',
    'toast(t("portal.rejectDemo"), "info");',
  ],
  [
    'toast(result?.success ?? "Oferta a fost refuzată.", "success");',
    'toast(result?.success ?? t("portal.rejectedThanks"), "success");',
  ],
  [
    "Pagină demonstrativă — răspunsul tău nu este salvat.",
    '{t("portal.demoPageProposal")}',
  ],
  [
    `Ofertă {data.proposalNumber ? \`· \${data.proposalNumber}\` : ""} pentru`,
    `{data.proposalNumber ? t("portal.proposalFor", { number: \`· \${data.proposalNumber}\` }) : t("portal.proposalForPlain")}`,
  ],
  [">Valoare totală<", '>{t("portal.totalValue")}<'],
  [">Valabilă până la<", '>{t("portal.validUntil")}<'],
  [
    '{data.validUntil ? formatDate(data.validUntil) : "Fără termen"}',
    '{data.validUntil ? formatDate(data.validUntil) : t("portal.noDeadline")}',
  ],
  [
    `Ce include oferta
            </p>`,
    `{t("portal.includes")}
            </p>`,
  ],
  [">Subtotal<", '>{t("portal.subtotal")}<'],
  [">Discount<", '>{t("portal.discount")}<'],
  [">TVA<", '>{t("portal.tax")}<'],
  [">Total<", '>{t("portal.total")}<'],
  [
    ">Termeni și condiții<",
    '>{t("portal.terms")}<',
  ],
  [
    "Ofertă acceptată — contractul este în pregătire.",
    '{t("portal.acceptedReady")}',
  ],
  [">Ai refuzat această ofertă.<", '>{t("portal.youDeclined")}<'],
  [
    "Această ofertă a fost anulată de furnizor.",
    '{t("portal.cancelledByProvider")}',
  ],
  [">Această ofertă a expirat.<", '>{t("portal.expiredNotice")}<'],
  [
    ">Motivul refuzului (opțional)<",
    '>{t("portal.rejectReason")}<',
  ],
  [
    'placeholder="Spune-ne de ce refuzi oferta…"',
    'placeholder={t("portal.rejectReasonPh")}',
  ],
  [">Înapoi<", '>{t("common.back")}<'],
  [
    '{submitting ? "Se trimite…" : "Confirmă refuzul"}',
    '{submitting ? t("portal.sending") : t("portal.confirmReject")}',
  ],
  [
    "Completează datele tale pentru a accepta digital această ofertă.",
    '{t("portal.acceptFormIntro")}',
  ],
  [">Nume complet<", '>{t("portal.fullName")}<'],
  [
    'placeholder="Numele tău complet"',
    'placeholder={t("portal.fullNamePh")}',
  ],
  [
    "Am citit și sunt de acord cu termenii și condițiile acestei oferte.",
    '{t("portal.acceptTerms")}',
  ],
  [
    `Refuz oferta
                  </button>`,
    `{t("portal.declineProposal")}
                  </button>`,
  ],
  [
    "Trimisă de {data.providerName ?? \"EasyWedd Pro\"} · {formatDateTime(data.createdAt)}",
    '{t("portal.sentBy", { provider: data.providerName ?? "EasyWedd Pro", date: formatDateTime(data.createdAt) })}',
  ],
]);

console.log("done items+public");
