/**
 * Finish remaining dashboard/public page leftovers.
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

mergeKeys("ro", "modules", {
  automations: { editTitle: "Editează automatizare" },
  payments: { singular: "Plată" },
  projects: {
    editTitle: "Editează proiect",
    loadFailed: "Nu am putut încărca proiectele.",
  },
  calendar: {
    loadEventsFailed: "Nu am putut încărca evenimentele calendarului.",
  },
  tasks: { loadFailed: "Nu am putut încărca task-urile." },
  team: { memberTitle: "Membru echipă" },
});
mergeKeys("en", "modules", {
  automations: { editTitle: "Edit automation" },
  payments: { singular: "Payment" },
  projects: {
    editTitle: "Edit project",
    loadFailed: "Could not load projects.",
  },
  calendar: { loadEventsFailed: "Could not load calendar events." },
  tasks: { loadFailed: "Could not load tasks." },
  team: { memberTitle: "Team member" },
});
mergeKeys("ro", "portal", {
  contractLoadFailed: "Eroare la încărcarea contractului.",
});
mergeKeys("en", "portal", {
  contractLoadFailed: "Error loading contract.",
});

function ensureImport(text) {
  if (text.includes("@/lib/i18n/t")) return text;
  return text.replace(/^(import .+;\n)/m, `$1import { getTranslator } from "@/lib/i18n/t";\n`);
}

function ensurePageT(text) {
  if (text.includes("const { t } = await getTranslator()")) return text;
  const m = text.match(/export default async function \w+\([\s\S]*?\) \{/);
  if (m) return text.replace(m[0], m[0] + "\n  const { t } = await getTranslator();");
  return text;
}

function patch(file, fn) {
  let text = fs.readFileSync(file, "utf8");
  text = ensureImport(text);
  text = fn(text);
  fs.writeFileSync(file, text);
  console.log("ok", file);
}

patch("app/dashboard/automations/[id]/page.tsx", (text) => {
  if (text.includes('title: "Editează automatizare · EasyWedd Pro"')) {
    text = text.replace(
      /export const metadata(?:: Metadata)? = \{\s*title:\s*"[^"]+",?\s*\};/,
      `export async function generateMetadata() {
  const { t } = await getTranslator();
  return { title: \`\${t("modules.automations.editTitle")} · EasyWedd Pro\` };
}`,
    );
  }
  return text;
});

patch("app/dashboard/calendar/page.tsx", (text) => {
  text = ensurePageT(text);
  return text.replace(
    '"Nu am putut încărca evenimentele calendarului."',
    't("modules.calendar.loadEventsFailed")',
  );
});

patch("app/dashboard/payments/[id]/page.tsx", (text) => {
  return text.replace(
    /export const metadata(?:: Metadata)? = \{\s*title:\s*"[^"]+",?\s*\};/,
    `export async function generateMetadata() {
  const { t } = await getTranslator();
  return { title: \`\${t("modules.payments.singular")} · EasyWedd Pro\` };
}`,
  );
});

patch("app/dashboard/projects/page.tsx", (text) => {
  text = ensurePageT(text);
  return text.replace(
    '"Nu am putut încărca proiectele."',
    't("modules.projects.loadFailed")',
  );
});

patch("app/dashboard/projects/[id]/edit/page.tsx", (text) => {
  return text.replace(
    /export const metadata(?:: Metadata)? = \{\s*title:\s*"[^"]+",?\s*\};/,
    `export async function generateMetadata() {
  const { t } = await getTranslator();
  return { title: \`\${t("modules.projects.editTitle")} · EasyWedd Pro\` };
}`,
  );
});

patch("app/dashboard/tasks/page.tsx", (text) => {
  text = ensurePageT(text);
  return text.replace(
    '"Nu am putut încărca task-urile."',
    't("modules.tasks.loadFailed")',
  );
});

patch("app/dashboard/team/[id]/page.tsx", (text) => {
  return text.replace(
    'return { title: "Membru echipă · EasyWedd Pro" };',
    `const { t } = await getTranslator();
  return { title: \`\${t("modules.team.memberTitle")} · EasyWedd Pro\` };`,
  );
});

patch("app/p/[token]/page.tsx", (text) => {
  return text.replace(
    /export const metadata(?:: Metadata)? = \{\s*title:\s*"[^"]+",?\s*\};/,
    `export async function generateMetadata() {
  const { t } = await getTranslator();
  return { title: t("portal.proposal") };
}`,
  );
});

patch("app/c/[token]/page.tsx", (text) => {
  text = ensurePageT(text);
  text = text.replace(
    '"Eroare la încărcarea contractului."',
    't("portal.contractLoadFailed")',
  );
  text = text.replace(
    /Conexiunea cu serverul nu a putut fi realizată\. Verifică configurația și încearcă din\s*nou\./,
    '{t("portal.connectionFailed")}',
  );
  return text;
});

console.log("done");
