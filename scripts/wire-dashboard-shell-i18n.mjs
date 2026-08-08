/**
 * Wire remaining dashboard shell metadata/errors + small component leftovers.
 */
import fs from "node:fs";
import path from "node:path";

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

mergeKeys("ro", "modules", {
  clients: { loadFailed: "Nu am putut încărca clienții." },
  contracts: { loadFailed: "Nu am putut încărca contractele." },
  payments: { loadFailed: "Nu am putut încărca plățile.", newPayment: "Plată nouă" },
  proposals: { loadFailed: "Nu am putut încărca ofertele.", singular: "Ofertă" },
  team: { loadFailed: "Nu am putut încărca echipa." },
  leads: { loadFailed: "Nu am putut încărca leadurile." },
  templates: { loadFailed: "Nu am putut încărca template-urile." },
  projects: { loadFailed: "Nu am putut încărca proiectele." },
  tasks: { loadFailed: "Nu am putut încărca task-urile." },
  automations: { loadFailed: "Nu am putut încărca automatizările." },
  calendar: { loadFailed: "Nu am putut încărca calendarul." },
});
mergeKeys("en", "modules", {
  clients: { loadFailed: "Could not load clients." },
  contracts: { loadFailed: "Could not load contracts." },
  payments: { loadFailed: "Could not load payments.", newPayment: "New payment" },
  proposals: { loadFailed: "Could not load proposals.", singular: "Proposal" },
  team: { loadFailed: "Could not load the team." },
  leads: { loadFailed: "Could not load leads." },
  templates: { loadFailed: "Could not load templates." },
  projects: { loadFailed: "Could not load projects." },
  tasks: { loadFailed: "Could not load tasks." },
  automations: { loadFailed: "Could not load automations." },
  calendar: { loadFailed: "Could not load the calendar." },
});

function ensureImport(text) {
  if (text.includes("@/lib/i18n/t")) return text;
  return text.replace(/^(import .+;\n)/m, `$1import { getTranslator } from "@/lib/i18n/t";\n`);
}

function convertMetadata(file, titleKey) {
  let text = fs.readFileSync(file, "utf8");
  text = ensureImport(text);
  // Replace export const metadata = { title: "..." }
  text = text.replace(
    /export const metadata(?:: Metadata)? = \{\s*title:\s*"[^"]+",?\s*\};/,
    `export async function generateMetadata() {
  const { t } = await getTranslator();
  return { title: \`\${t("${titleKey}")} · EasyWedd Pro\` };
}`,
  );
  fs.writeFileSync(file, text);
  console.log("meta", file);
}

function patchError(file, from, to) {
  let text = fs.readFileSync(file, "utf8");
  text = ensureImport(text);
  if (!text.includes("const { t } = await getTranslator()") && text.includes("export default async function")) {
    const m = text.match(/export default async function \w+\([\s\S]*?\) \{/);
    if (m) text = text.replace(m[0], m[0] + "\n  const { t } = await getTranslator();");
  }
  if (text.includes(from)) {
    text = text.split(from).join(to);
    console.log("err", file);
  } else {
    console.warn("MISS ERR", file, from.slice(0, 60));
  }
  fs.writeFileSync(file, text);
}

const metaMap = [
  ["app/dashboard/clients/page.tsx", "modules.clients.title"],
  ["app/dashboard/contracts/page.tsx", "modules.contracts.title"],
  ["app/dashboard/payments/page.tsx", "modules.payments.title"],
  ["app/dashboard/proposals/page.tsx", "modules.proposals.title"],
  ["app/dashboard/team/page.tsx", "modules.team.title"],
  ["app/dashboard/settings/page.tsx", "modules.settings.title"],
  ["app/dashboard/leads/page.tsx", "modules.leads.title"],
  ["app/dashboard/templates/page.tsx", "modules.templates.title"],
  ["app/dashboard/projects/page.tsx", "modules.projects.title"],
  ["app/dashboard/tasks/page.tsx", "modules.tasks.title"],
  ["app/dashboard/calendar/page.tsx", "modules.calendar.title"],
  ["app/dashboard/automations/page.tsx", "modules.automations.title"],
  ["app/dashboard/automations/new/page.tsx", "modules.automations.new"],
  ["app/dashboard/payments/new/page.tsx", "modules.payments.new"],
  ["app/dashboard/proposals/new/page.tsx", "modules.proposals.new"],
];

for (const [f, key] of metaMap) {
  if (fs.existsSync(f)) convertMetadata(f, key);
}

patchError(
  "app/dashboard/clients/page.tsx",
  'error = err instanceof Error ? err.message : "Nu am putut încărca clienții.";',
  'error = err instanceof Error ? err.message : t("modules.clients.loadFailed");',
);
patchError(
  "app/dashboard/contracts/page.tsx",
  'error = err instanceof Error ? err.message : "Nu am putut încărca contractele.";',
  'error = err instanceof Error ? err.message : t("modules.contracts.loadFailed");',
);
patchError(
  "app/dashboard/payments/page.tsx",
  'error = err instanceof Error ? err.message : "Nu am putut încărca plățile.";',
  'error = err instanceof Error ? err.message : t("modules.payments.loadFailed");',
);
patchError(
  "app/dashboard/proposals/page.tsx",
  'error = err instanceof Error ? err.message : "Nu am putut încărca ofertele.";',
  'error = err instanceof Error ? err.message : t("modules.proposals.loadFailed");',
);
patchError(
  "app/dashboard/team/page.tsx",
  'error = err instanceof Error ? err.message : "Nu am putut încărca echipa.";',
  'error = err instanceof Error ? err.message : t("modules.team.loadFailed");',
);
patchError(
  "app/dashboard/leads/page.tsx",
  'error = err instanceof Error ? err.message : "Nu am putut încărca leadurile.";',
  'error = err instanceof Error ? err.message : t("modules.leads.loadFailed");',
);
patchError(
  "app/dashboard/templates/page.tsx",
  'error = err instanceof Error ? err.message : "Nu am putut încărca template-urile.";',
  'error = err instanceof Error ? err.message : t("modules.templates.loadFailed");',
);

// proposals/[id]
{
  const f = "app/dashboard/proposals/[id]/page.tsx";
  let text = fs.readFileSync(f, "utf8");
  text = ensureImport(text);
  text = text.replace(
    /title:\s*"Ofertă · EasyWedd Pro"/,
    'title: `${t("modules.proposals.singular")} · EasyWedd Pro`',
  );
  // if generateMetadata already exists, ensure t
  if (text.includes("generateMetadata") && !text.includes("getTranslator")) {
    text = text.replace(
      /export async function generateMetadata[\s\S]*?\{/,
      (m) => m + '\n  const { t } = await getTranslator();',
    );
  }
  text = text.replace(
    'description={proposal.proposalNumber ?? "Ofertă"}',
    'description={proposal.proposalNumber ?? t("modules.proposals.singular")}',
  );
  if (!text.includes("const { t } = await getTranslator()") && text.includes("export default async function")) {
    const m = text.match(/export default async function \w+\([\s\S]*?\) \{/);
    if (m) text = text.replace(m[0], m[0] + "\n  const { t } = await getTranslator();");
  }
  fs.writeFileSync(f, text);
  console.log("proposal detail meta", f);
}

// payments-list
{
  const f = "components/payments/payments-list.tsx";
  let text = fs.readFileSync(f, "utf8");
  if (!text.includes("useI18n")) {
    text = text.replace(
      '"use client";\n',
      '"use client";\n\nimport { useI18n } from "@/components/providers/i18n-provider";\n',
    );
  }
  if (!text.includes("const { t } = useI18n()")) {
    const m = text.match(/export function \w+\([\s\S]*?\) \{/);
    if (m) text = text.replace(m[0], m[0] + "\n  const { t } = useI18n();");
  }
  text = text.split("Plată nouă").join('{t("modules.payments.newPayment")}');
  fs.writeFileSync(f, text);
  console.log("payments-list");
}

// calendar-board Astăzi
{
  const f = "components/calendar/calendar-board.tsx";
  let text = fs.readFileSync(f, "utf8");
  if (!text.includes("useI18n")) {
    text = text.replace(
      '"use client";\n',
      '"use client";\n\nimport { useI18n } from "@/components/providers/i18n-provider";\n',
    );
  }
  if (!/\bconst \{ t \} = useI18n\(\)/.test(text)) {
    const m = text.match(/export function \w+\([\s\S]*?\) \{/);
    if (m) text = text.replace(m[0], m[0] + "\n  const { t } = useI18n();");
  }
  text = text.replace(/>Astăzi</, '>{t("common.today")}<');
  text = text.replace(/\n\s*Astăzi\n/, '\n                  {t("common.today")}\n');
  fs.writeFileSync(f, text);
  console.log("calendar-board");
}

// tasks-board Editează
{
  const f = "components/tasks/tasks-board.tsx";
  let text = fs.readFileSync(f, "utf8");
  if (!text.includes("useI18n")) {
    text = text.replace(
      '"use client";\n',
      '"use client";\n\nimport { useI18n } from "@/components/providers/i18n-provider";\n',
    );
  }
  if (!/\bconst \{ t \} = useI18n\(\)/.test(text)) {
    const m = text.match(/export function \w+\([\s\S]*?\) \{/);
    if (m) text = text.replace(m[0], m[0] + "\n  const { t } = useI18n();");
  }
  text = text.replace(/\n\s*Editează\n/, '\n                  {t("common.edit")}\n');
  fs.writeFileSync(f, text);
  console.log("tasks-board");
}

console.log("dashboard shell done");
